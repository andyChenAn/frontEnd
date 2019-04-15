# Redux之reducer函数
reducer是一个纯函数，主要作用就是用来修改状态的。当数据状态比较复杂的时候，我们可以编写多个子reducer分别处理对应的部分数据状态，然后再将多个子reducer合并成一个reducer。

根据redux约定，reducer是一个纯函数，并且函数里面不包含任何副作用。这样就能保证状态的可预测和可追踪性。在reducer函数中是通过action的类型来分别对状态做对应的修改操作。

这里需要注意的是：如果状态只是基本数据类型，那么可以直接修改状态，因为返回的修改后的值是一个新的状态值，而不会对之前的状态进行修改。如果状态是一个引用类型，那么我们在修改状态的时候，就一定要注意不能改变原来的状态。

reducer函数是由开发者自己编写，一般格式都是：

```javascript
function reducer (prevState , action) {
    switch (aciton.type) {
        case1 :
        return state1;
        ...
        caseN :
        return stateN;
        default : 
        return prevState;
    }
}
```
### 如何编写多个子reducer并合成一个reducer
首先我们需要明确的是子reducer其实就是一个普通的reducer函数，在写法上是类似的，然后我们通过combineReducers方法进行合并，这个方法接受一个对象作为参数，对象的键指的就是状态的变量名，对象的值指的就是子reducer函数。当我们dispatch一个action时，就会调用所有这些子reducer函数。

```javascript
const reducer1 = function (state = 0 , action) {
    switch (action.type) {
        case 'PLUS' : 
        return state + 1;
        case 'MINUS' :
        return state - 1;
        default :
        return state;
    }
};
const reducer2 = function (state = [] , action) {
    switch (action.type) {
        case "ADD" : 
        return state.concat([action.data]);
        case "DELETE" :
        return state.slice(0 , action.index).concat(state.slice(action.index+1));
        default :
        return state;
    }
}
const store = createStore(combineReducers({
    data1 : reducer1,
    data2 : reducer2
}));
store.subscribe(function () {
    console.log(store.getState());
})
store.dispatch({
    type : 'PLUS'
});
store.dispatch({
    type : 'ADD',
    index : 0,
    data : 'andy'
});
store.dispatch({
    type : 'ADD',
    index : 1,
    data : 'jack'
});
store.dispatch({
    type : 'DELETE',
    index : 0
});
```
上面代码中，当我们在处理状态为引用类型时，一定要注意不能修改原状态值。
### combineReducers内部原理
我们来看一下redux的combineReducers部分的源码是怎么实现的

```javascript
// 这里传递的reducers参数是一个对象
function combineReducers(reducers) {
    // 获取对象所有的键名
    var reducerKeys = Object.keys(reducers);
    var finalReducers = {};
    
    // 遍历键名，验证键名是否存在
    // 如果存在那么就将reducer函数与键名建立映射关系
    for (var i = 0; i < reducerKeys.length; i++) {
        var key = reducerKeys[i];
    
        if (process.env.NODE_ENV !== 'production') {
          if (typeof reducers[key] === 'undefined') {
            warning("No reducer provided for key \"" + key + "\"");
          }
        }
        
        if (typeof reducers[key] === 'function') {
          finalReducers[key] = reducers[key];
        }
    }

    var finalReducerKeys = Object.keys(finalReducers);
    var unexpectedKeyCache;

    if (process.env.NODE_ENV !== 'production') {
        unexpectedKeyCache = {};
    }

    var shapeAssertionError;
    
    // 这个是验证reducer函数结构是否正确
    try {
        assertReducerShape(finalReducers);
    } catch (e) {
        shapeAssertionError = e;
    }
    
    // 返回一个函数，这个函数会被传入到createStore()方法中
    // 当我们调用store.createStore()方法创建一个store时，就会被调用
    return function combination(state, action) {
        // state变量是一个初始state，主要用来与nextState进行比较，如果两个不一样，那么表示上一个状态和当前状态是不一样的，那么就表示状态发生了改变
        if (state === void 0) {
            state = {};
        }
        // 如果reducer函数结构有问题，那么就抛出错误
        if (shapeAssertionError) {
          throw shapeAssertionError;
        }
    
        if (process.env.NODE_ENV !== 'production') {
          var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);
        
          if (warningMessage) {
            warning(warningMessage);
          }
        }
        
        // state是否有改变
        var hasChanged = false;
        // 下一个状态，用来与state做比较
        var nextState = {};
        
        // 遍历所有的键名，调用所有reducer函数，并将reducer函数返回的结果保存在nextState变量中
        // 判断两个state的值是否一样，如果不一样，那么表示状态发生改变，则hasChaged为true，否则，为false
        for (var _i = 0; _i < finalReducerKeys.length; _i++) {
            var _key = finalReducerKeys[_i];
            var reducer = finalReducers[_key];
            var previousStateForKey = state[_key];
            var nextStateForKey = reducer(previousStateForKey, action);
            
            if (typeof nextStateForKey === 'undefined') {
                var errorMessage = getUndefinedStateErrorMessage(_key, action);
                throw new Error(errorMessage);
            }
            
            nextState[_key] = nextStateForKey;
            hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
        }
    
        return hasChanged ? nextState : state;
    };
}
```
### 小结：

**- reducer函数必须是一个纯函数，并且函数里面是不能有任何副作用的。**

**- 可以将一个复杂的reducer函数，分割成多个子reducer函数，每个子reducer函数负责一部分状态的修改，然后再通过combineReducers方法将多个子reducer函数合并成一个reducer函数。**