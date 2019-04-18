# Redux之store
我们都知道Redux是一个数据状态管理器，那么存放数据状态的容器在哪里呢？store就是存放数据状态的容器。
### 创建store
通过Redux的源码，我们来看一下store是怎么被创建的。
```javascript
function createStore(reducer, preloadedState, enhancer) {
    var _ref2;
    // 验证参数
    if (typeof preloadedState === 'function' && typeof enhancer === 'function' || typeof enhancer === 'function' && typeof arguments[3] === 'function') {
        throw new Error('It looks like you are passing several store enhancers to ' + 'createStore(). This is not supported. Instead, compose them ' + 'together to a single function');
    }
    // 参数重载
    if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
        enhancer = preloadedState;
        preloadedState = undefined;
    }
    // 如果enhancer不为空，那么就返回一个增强的store，其实就是添加了中间件的store
    if (typeof enhancer !== 'undefined') {
        if (typeof enhancer !== 'function') {
            throw new Error('Expected the enhancer to be a function.');
        }
    
        return enhancer(createStore)(reducer, preloadedState);
    }

    if (typeof reducer !== 'function') {
        throw new Error('Expected the reducer to be a function.');
    }

    var currentReducer = reducer;    // 通过参数传入的reducer函数
    var currentState = preloadedState;    // 初始状态
    var currentListeners = [];    // 订阅函数集合
    var nextListeners = currentListeners;   
    var isDispatching = false;   // 是否正在派发action

    function ensureCanMutateNextListeners() {
        if (nextListeners === currentListeners) {
            nextListeners = currentListeners.slice();
        }
    }
    
    // 调用getState方法，返回当前的数据状态
    function getState() {
        if (isDispatching) {
            throw new Error('You may not call store.getState() while the reducer is executing. ' + 'The reducer has already received the state as an argument. ' + 'Pass it down from the top reducer instead of reading it from the store.');
        }
    
        return currentState;
    }
    // 订阅状态变化
    // 当状态发生变化的时候，就会调用listener
    // 调用这个方法时，返回一个unsubcribe函数，这个函数的作用就是用来取消订阅的。
    // 该方法内部其实就是将监听器添加到一个数组中，等到状态改变时，再依次拿出来调用
    function subscribe(listener) {
        if (typeof listener !== 'function') {
            throw new Error('Expected the listener to be a function.');
        }
    
        if (isDispatching) {
            throw new Error('You may not call store.subscribe() while the reducer is executing. ' + 'If you would like to be notified after the store has been updated, subscribe from a ' + 'component and invoke store.getState() in the callback to access the latest state. ' + 'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.');
        }
    
        var isSubscribed = true;
        ensureCanMutateNextListeners();
        nextListeners.push(listener);
        return function unsubscribe() {
            if (!isSubscribed) {
                return;
            }
    
            if (isDispatching) {
                throw new Error('You may not unsubscribe from a store listener while the reducer is executing. ' + 'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.');
            }
    
            isSubscribed = false;
            ensureCanMutateNextListeners();
            var index = nextListeners.indexOf(listener);
            nextListeners.splice(index, 1);
        };
    }
    
    // 该方法是用来分发任务的
    // 该方法主要执行以下几个步骤：
    // 1、调用reducer函数，执行状态更新操作
    // 2、调用所有订阅状态变化的监听器
    function dispatch(action) {
        if (!isPlainObject(action)) {
            throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
        }
    
        if (typeof action.type === 'undefined') {
            throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
        }
    
        if (isDispatching) {
            throw new Error('Reducers may not dispatch actions.');
        }
    
        try {
            isDispatching = true;
            currentState = currentReducer(currentState, action);
        } finally {
            isDispatching = false;
        }
    
        var listeners = currentListeners = nextListeners;
    
        for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            listener();
        }
    
        return action;
    }
    // 省略代码...
    return _ref2 = {
        dispatch: dispatch,
        subscribe: subscribe,
        getState: getState,
        replaceReducer: replaceReducer
    }, _ref2[$$observable] = observable, _ref2;
}
```
创建store代码：
```javascript
import { createStore } from 'redux';
const reducer = function (state = 0 , action) {
    switch (action.type) {
        case 'PLUS' : 
        return state + 1;
        case 'MINUS' :
        return state - 1;
        default :
        return state;
    }
};
const store = createStore(reducer);
store.subscribe(function () {
    console.log(store.getState());
})
store.dispatch({
    type : 'PLUS'
})
```
### 小结：

**1、store是通过调用createStore方法来创建的，store是一个对象，该对象存在几个方法，其中getState方法主要是用来获取当前状态的，dispatch方法主要是用来派发任务并调用reducer函数改变状态的，subscribe方法主要是用来添加状态发生改变时需要调用的监听器的。**

**2、如果想改变状态，必须要派发一个任务，不然状态是不会发生改变。**