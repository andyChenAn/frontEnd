# redux
redux是一种状态管理器，它不属于react，但是我们使用redux来管理react应用中的状态。

redux有三大原则：单一数据源，state是只读的，使用纯函数来修改state。

redux是一种状态管理器，如果我们想要改变状态，只能通过dispatch(action)的方式来改变。redux有三个重要的东西：action，reducer，store。

### action
action是一个普通的对象，该对象会有一个type属性，其他属于自己可以自定义，action表示的是描述要发生什么事情，它不会去修改state，action是将数据传入到store的有效载荷。

```javascript
{
    type : 'ADD_TODO',
    text : text
}
```
我们知道action是一个普通的对象，但是一般我们都是通过action creator函数来返回这个对象，比如这样：

```javascript
const addTodo = (text) => {
    return {
        type : 'ADD_TODO',
        text
    }
}
```
### reducer
指定了应用状态的变化如何响应 actions 并发送到 store 的。

```javascript
import { VisibilityFilters , SET_VISIBILITY_FILTER , ADD_TODO , TOGGLE_TODO } from './actions';
const initialState = {
    visibilityFilter : VisibilityFilters.SHOW_ALL,
    todos : []
};
const { SHOW_ALL } = VisibilityFilters;

function visibilityFilter (state = SHOW_ALL , action) {
    switch (action.type) {
        case SET_VISIBILITY_FILTER :
        return action.filter;
        default : 
        return state;
    }
}

function todos (state = [] , action) {
    switch (action.type) {
        case ADD_TODO : 
        return [
            ...state ,
            {
                text : action.text,
                completed : false
            }
        ]
        case TOGGLE_TODO :
        return state.map((todo , index) => {
            if (index == action.index) {
                return Object.assign({} , todo , {
                    completed : !todo.completed
                })
            }
            return todo;
        });
        default :
        return state;
    }
}

function todoApp (state = initialState , action) {
    return {
        visibilityFilter : visibilityFilter(state.visibilityFilter , action),
        todos : todos(state.todos , action)
    }
}

export default todoApp;
```
### store
store是一个普通的对象，是连接action和reducer的桥梁，当我们调用redux库中的createStore方法，将reducer作为参数传入，并返回的就是一个store对象，在redux应用中，store只能有一个，并且store内部管理着react应用的状态。通过调用store的dispatch(action)方法来描述要执行的操作，然后会调用reducer函数，执行相关的状态修改的操作，最后store会重新更新内部state。

```
const store = createStore(reducer);
```
### 数据流
redux是单向数据流

```
store.dispatch(action) -> reducer(state , action) -> state
```
调用store.dispatch(action)方法，然后执行传入的reducer函数，改变state，最后更新state。

### redux如何处理异步数据
上面我们说的操作都是同步操作，没有涉及到异步数据的操作，如果是异步action，那么我们需要使用redux-thunk库，通过使用这个第三方库，我们的action创建函数不仅可以返回一个对象，而且还可以返回一个函数，而在返回的这个函数里，我们可以有副作用的操作，比如请求数据。

例子：

```javascript
// actions.js
import fetch from 'cross-fetch';
export const REQUEST_POSTS = 'REQEUST_POSTS';
function requestPosts (subreddit) {
    return {
        type : REQUEST_POSTS,
        subreddit
    }
};

export const RECEIVE_POSTS = 'RECEIVE_POSTS';
function receivePosts (subreddit , data) {
    return {
        type : RECEIVE_POSTS,
        subreddit,
        data : data.data.children.map(child => child.data),
        receivedAt : Date.now()
    }
};

export const SELECTED_SUBREDDIT = 'SELECTED_SUBREDDIT';
export function selectSubreddit (subreddit) {
    return {
        type : SELECTED_SUBREDDIT,
        subreddit
    }
};

export const REQUEST_ERROR = 'REQUEST_ERROR';
function fectchError (subreddit , error) {
    return {
        type : REQUEST_ERROR,
        subreddit,
        error,
        receivedAt : Date.now()
    }
};

export function fetchData (subreddit) {
    return function (dispatch) {
        dispatch(requestPosts(subreddit));
        return fetch(`https://www.reddit.com/r/${subreddit}.json`)
        .then(res => res.json())
        .then(res => dispatch(receivePosts(subreddit , res)))
        .catch(err => dispatch(fectchError(subreddit , err)))
    }
};
```

```javascript
// reducers.js
import { combineReducers } from 'redux';
import {
    REQUEST_POSTS,
    RECEIVE_POSTS,
    REQUEST_ERROR,
    SELECTED_SUBREDDIT
} from './actions';

function selectedSubreddit (state = 'reactjs' , action) {
    switch (action.type) {
        case SELECTED_SUBREDDIT :
        return action.subreddit;
        default :
        return state;
    }
};

function posts (state = {
    isFetching : false,
    error : false,
    items : []
} , action) {
    switch (action.type) {
        case REQUEST_POSTS : 
        return Object.assign({} , state , {
            isFetching : true
        });
        case RECEIVE_POSTS :
        return Object.assign({} , state , {
            isFetching : false,
            items : action.data,
            lastUpdated : action.receivedAt
        });
        case REQUEST_ERROR :
        return Object.assign({} , state , {
            isFetching : true,
            error : action.error
        });
        default : 
        return state;
    }
}

function postsBySubreddit (state = {} , action) {
    switch (action.type) {
        case REQUEST_POSTS:
        case RECEIVE_POSTS:
        case REQUEST_ERROR:
        return Object.assign({} , state , {
            [action.subreddit] : posts(state[action.subreddit] , action)
        });
        default :
        return state;
    }
}

const rootReducer = combineReducers({
    postsBySubreddit,
    selectedSubreddit
});
export default rootReducer;
```

```javascript
// App.js
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { selectSubreddit , fetchData } from './actions';

class App extends Component {
    constructor (props) {
        super(props);
    }
    selectSubreddit = (e) => {
        const { dispatch } = this.props;
        dispatch(selectSubreddit(e.target.value));
    }
    componentDidMount () {
        const { dispatch } = this.props;
        dispatch(fetchData(this.props.selectedSubreddit));
    }
    componentWillReceiveProps (newProps) {
        if (newProps.selectedSubreddit !== this.props.selectedSubreddit) {
            const { dispatch , selectedSubreddit } = newProps;
            dispatch(fetchData(selectedSubreddit));
        }
    }
    render () {
        const { items , error } = this.props;
        return (
            <div style={{margin : '40px'}}>
                <span>请选择</span>
                <select onChange={this.selectSubreddit} name="" id="">
                    <option value="reactjs">reactjs</option>
                    <option value="vuejs">vuejs</option>
                </select>
                {
                    error ? <p>请求失败</p> :
                    <ul>
                        {
                            items.map((item , index) => (
                                <li key={index}>{item.title}</li>
                            ))
                        }
                    </ul>
                }
            </div>
        )
    }
}

const mapStateToProps = function (state) {
    const { postsBySubreddit , selectedSubreddit } = state;
    const {
        isFetching,
        lastUpdated,
        items,
        error
    } = postsBySubreddit[selectedSubreddit] || {
        isFetching : false,
        items : []
    };
    return {
        isFetching,
        lastUpdated,
        error,
        items,
        selectedSubreddit
    }
}
export default connect(mapStateToProps)(App);

```

```javascript
// index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import { createStore , applyMiddleware } from 'redux';
import rootReducer from './reducers';
import App from './App';

let store = createStore(rootReducer , applyMiddleware(thunkMiddleware));
ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'));
```