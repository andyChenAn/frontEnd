# Redux之减少样板代码
我们在写react应用的时候，基本上都会使用到redux用来管理react应用的状态。那么在管理状态的过程中，我们会编写大量的action creator函数。但是action creator函数的模板样式其实都比较类似，那么有什么方法可以通过编写一个函数，来生成我们想要的action creator，这样我们就不需要单独写很多哥action creator函数了。

### action creator生成器
其实我们可以编写一个函数，专门用来生成action creator。首先我们都知道，action creator函数都会返回一个对象，这个对象有一个type属性，然后还有其他属性。那么我们可以这样一步一步的来实现（假设这个函数名叫做actionCreatorFnMaker）：

- 首先，函数actionCreatorFnMaker会返回一个函数，返回的这个函数就是aciton creator
- 其次，返回的这个函数会返回一个对象，这个对象有一个type字段和其他字段（比如需要更新的数据），所以我们要在创建action creator函数的时候把需要的action字段确定好

```javascript
function actionCreatorFnMaker (type , ...args1) {
    return function (...args2) {
        let result = {type};
        args1.forEach((arg , index) => {
            result[args1[index]] = args2[index];
        });
        return result;
    }
};
```
我们来测试一下：

```javascript
const ADD_TODO = 'ADD_TODO';
const DELETE_TODO = 'DELETE_TODO';
const addTodo = actionCreatorFnMaker(ADD_TODO , 'name');
const deleteTodo = actionCreatorFnMaker(DELETE_TODO , 'index');
console.log(addTodo('andy'))
console.log(deleteTodo(0));
```
结果为：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/34.png)

### 异步aciton creator
当我们在使用异步action的时候，一般都会这样写：

```javascript
function asyncAction (...args) {
    return function (dispatch) {
        dispatch(startRequest());
        return fetch('xxx').then(res => {
            dispatch(requestSuccess({
                res
            }));
        })
    }
}
```
当我们需要通过请求来获取后端数据的时候，我们就会使用到中间件。如果我们想要编写自己的异步action creator函数，那么我们首先需要编写一个自定义的中间件函数，通过这个中间件来捕捉我们编写的异步action creator函数中的一些操作。

- 编写中间件函数

```javascript
let thunk = ({ dispatch , getState }) => next => action => {
    let {
        types,
        shouldCallApi = () => true,
        callApi,
        payload = {}
    } = action;
    // 如果没有types，那么就执行跳过这个中间件，执行下面的中间件
    if (!types) {
        return next(action);
    }
    if (!Array.isArray(types) || types.length !== 3 || !types.every(type => typeof type === 'string')) {
        throw new Error('Expected an array of three string types.');
    }
    if (typeof callApi !== 'function') {
        throw new Error('callApi must be function');
    }
    if (!shouldCallApi(getState())) {
        return;
    }
    let [startType , successType , failType] = types;
    dispatch(Object.assign({} , payload , {
        type : startType
    }));
    callApi().then(response => {
        return response.json();
    }).then(json => {
        dispatch(Object.assign({} , payload , {
            type : successType,
            posts : json.data.children.map(child => child.data)
        }))
    }).catch(err => {
        dispatch(Object.assign({} , payload , {
            type : failType,
            error : err.message
        }));
    })
}
```
- 异步action creator函数

```javascript
function postData (subreddit) {
    return {
        types : [REQUEST_START , REQUEST_SUCCESS , REQUEST_FAIL],
        shouldCallApi : state => {
            let posts = state.postsBySubreddit[subreddit];
            if (!posts) {
                return true;
            } else if (posts.isFetching) {
                return false;
            } else {
                return posts.didInvalidate;
            }
        },
        callApi : () => fetch(`https://www.reddit.com/r/${subreddit}.json`),
        payload : {subreddit}
    }
};
```
上面代码，当我们dispatch一个异步action，那么中间件会捕捉到这个异步action，然后对这个异步action进行处理。
### Reducers函数 生成器
在写reducer函数的时候，我们发现我们会写很多的switch/case语句，来判断不同类型的action执行不同的操作。如果我不想写那么多的switch/case语句，那有没有其他方式可以解决这一的问题呢？答案肯定是有的，我们可以将每一个switch/case部分都写成一个函数，针对这一类型的action的操作都写在函数里。怎么做到这一点呢？我们需要建立一个action类型到action处理函数的映射对象。比如：

```javascript
function createReducer (initialState , handles) {
    return function (state = initialState , action) {
        if (handles.hasOwnProperty(action.type)) {
            return handles[action.type](state , action);
        } else {
            return state;
        }
    }
};
```
上面代码就是一个自动创建reducer的函数代码，我们根据type类型和处理type类型的函数之间建立一个映射关系。当dispatch一个type类型的aciton，那么就会执行具体的函数。

```javascript
const ADD_TODO = 'ADD_TODO';
const DELETE_TODO = 'DELETE_TODO';
const reducer = createReducer([] , {
    ADD_TODO : function (state , action) {
        let text = action.text;
        return [...state , text];
    },
    DELETE_TODO : function (state , action) {
        let index = action.index;
        return [
            ...state.slice(0 , index),
            ...state.slice(index + 1)
        ]
    }
});
```
测试代码：
```javascript

function addTodo (text) {
    return {
        type : ADD_TODO,
        text
    }
};

function deleteTodo (index) {
    return {
        type : DELETE_TODO,
        index
    }
};

let store = createStore(todos);

store.subscribe(function () {
    console.log(store.getState());
})

store.dispatch(addTodo('andy'));
store.dispatch(addTodo('jack'));
store.dispatch(addTodo('tom'));
setTimeout(() => {
    store.dispatch(deleteTodo(1));
} , 2000)
```