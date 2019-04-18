# Redux之中间件
我们之前所讲的action只是一个普通的对象，而且action都是同步action，如果要dispatch一个异步任务，那么我们该怎么办呢？比如我们通过请求去获取数据，这个过程是异步的，我们不可能dispatch这个任务，然后再去处理返回的数据。就像这样：

```javascript
// 这里都是伪代码

// 这里是发送请求去获取数据的任务，这里是异步的，所以我们在后面在分发一个处理响应的任务是根本获取不到数据的，那么又怎么去更新数据呢？
dispatch(sendRequestAction);
//这里是处理响应的任务
dispatch(handleResponseAction);
```
如果dispatch方法接受的是一个函数而不是一个普通对象，那么我们可以在这个函数里面进行异步操作，然后等结果返回的时候，我们再调用dispatch派发处理异步结果的action，那么就可以解决这个问题了。

redux提供了一个applyMiddleware方法来添加中间件来解决这样的问题。
### applyMiddleware方法

```
function applyMiddleware() {
    // 处理参数，这里传入的参数都是中间件函数
    // 将所有的中间件函数保存在middlewares数组里
    /*
        middlewares = [
            middleware1,
            middleware2,
            ...
            middlewareN
        ]
    */
    for (var _len = arguments.length,     middlewares = new Array(_len), _key = 0; _key < _len; _key++) {
        middlewares[_key] = arguments[_key];
    }
    // 返回一个函数，这个函数就是createStore方法中传入的第三个参数enhancer
    // enhancer(createStore)(reducer, preloadedState)
    return function (createStore) {
        return function () {
            // 这里的arguments参数就是reducer和preloadedState这两个
            // 所以这里还是通过createStore方法创建一个store
            var store = createStore.apply(void 0, arguments);
            
            var _dispatch = function dispatch() {
                throw new Error("Dispatching while constructing your middleware is not allowed. " + "Other middleware would not be applied to this dispatch.");
            };
            
            // 中间件函数传入的两个参数
            var middlewareAPI = {
                getState: store.getState,
                dispatch: function dispatch() {
                  return _dispatch.apply(void 0, arguments);
                }
            };
            var chain = middlewares.map(function (middleware) {
                return middleware(middlewareAPI);
            });
          _dispatch = compose.apply(void 0, chain)(store.dispatch);
          return _objectSpread({}, store, {
            dispatch: _dispatch
          });
        };
    };
}
```
我们先来看一下中间件函数的写法：

```javascript
// es6的写法
const middleware = store => next => action => {
    // 代码...
}
```
上面代码相当于：

```javascript
// es5的写法
const middleware = function (store) {
    return function (next) {
        return function (action) {
            // 代码...
        }
    }
}
```
我们再来看一下applyMiddleware方法中的这段代码：

```javascript
var chain = middlewares.map(function (middleware) {
    return middleware(middlewareAPI);
});
```
当我们遍历middlewares数组中的所有的中间件，并调用中间件，将middlewareAPI传递给中间件函数，这里调用的目的是接口（store的getState方法和dispatch方法）暴露给每一个中间件函数使用。

当我们遍历完middlewares数组中的所有中间件，将返回的中间件保存在chain遍历中，这时候的中间件函数，已经是这个样子：

```javascript
const middleware = function (next) {
    return function (action) {
        // 代码...
    }
}
```
然后再执行compose方法。
### compose方法
compose方法是将多个中间件函数从右往左组合到一起。
```javascript
function compose() {
    // 将传递过来的中间件函数保存到funcs中
    for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) {
        funcs[_key] = arguments[_key];
    }
    
    // 如果没有中间件函数，那么就返回默认的函数
    if (funcs.length === 0) {
        return function (arg) {
          return arg;
        };
    }
    
    // 如果只有一个中间件函数，那么就直接返回这一个中间件函数
    if (funcs.length === 1) {
        return funcs[0];
    }
    
    // 有多个中间件函数的情况
    return funcs.reduce(function (a, b) {
        return function () {
            return a(b.apply(void 0, arguments));
        };
    });
}
```
这里我们重点来看一下这段代码：

```javascript
return funcs.reduce(function (a, b) {
    return function () {
        return a(b.apply(void 0, arguments));
    };
});
```
我们假设funcs数组中存在三个中间件函数。

```javascript
const funcs = [fn1 , fn2 , fn3];
```
当首次执行reduce方法时，这个方法中的回调函数中的参数a和b的值是：fn1 , fn2，返回一个函数是：
```javascript
function () {
    return a(b.apply(void 0, arguments));
};

// 此时a为fn1，b为fn2
function () {
    return fn1(fn2.apply(void 0 , arguments));
}

// 其实就是
function () {
    return fn1(fn2(arguments));
}
```

当第二次执行reduce方法的回调函数时，a的值为上一次执行reduce方法的回调函数返回的值，而b则是fn3。

```javascript
a = function () {
    return fn1(fn2(arguments));
};
b = fn3;
```
那么第二次执行的回调函数返回的值为：
```javascript
function () {
    return fn1(fn2(fn3(arguments)));
}
```
所以调用compose方法最终返回的是：

```javascript
function () {
    return fn1(fn2(fn3(arguments)));
}
```
我们再回过头来看applyMiddleware方法中的这段代码：
```javascript
_dispatch = compose.apply(void 0, chain)(store.dispatch);

// 上面代码等价于：
_dispatch = function () {
    return fn1(fn2(fn3(argumnets)));
}(store.dispatch);

// 最终为：
_dispatch = fn1(fn2(fn3(store.dispatch)));
```
到这里我们首先要明确一点，就是这里的fn1 , fn2 , fn3都是已经执行过一层的中间件函数，当执行fn1(fn2(fn3(store.dispatch)))代码，我们来看一下是怎么执行的，首先会执行fn3中间件，而fn3中间件函数中的next参数就是这里的store.dispatch，返回最后一层的函数，以此类推，下一个中间件接收的next参数就是上一个中间件执行返回的结果。这样讲可能不太直观，我们来通过一个例子来进行说明：


```javascript
// 三个中间件函数
const fn1 = function (store) {
    return function (next) {
        return function (action) {
            console.log('fn1');
            next(action);
            console.log('fn1');
        }
    }
}

const fn2 = function (store) {
    return function (next) {
        return function (action) {
            console.log('fn2');
            next(action);
            console.log('fn2');
        }
    }
}

const fn3 = function (store) {
    return function (next) {
        return function (action) {
            console.log('fn3');
            next(action);
            console.log('fn3');
        }
    }
}

// reducer函数
const reducer = function (state = 0 , action) {
    switch (action.type) {
        case 'add' : 
        return state + 1;
        case 'delete' :
        return state - 1;
        default :
        return state;
    }
}

const store = createStore(reducer , 0 , applyMiddleware(fn1 , fn2 , fn3));
store.subscribe(function () {
    console.log(store.getState());
});
store.dispatch({
    type : 'add'
});
```
具体的执行过程如下：

第一次执行时：

```javascript
function (action) {
    console.log('fn3');
    dispatch(action);
    console.log('fn3'); 
};
```
第二次执行时：

```javascript
function (action) {
    console.log('fn2');
    (function (action) {
        console.log('fn3');
        dispatch(action);
        console.log('fn3'); 
    })(action);
    console.log('fn2');
}
```
第三次执行时：

```javascript
function (action) {
    console.log('fn1');
    (function (action) {
        console.log('fn2');
        (function (action) {
            console.log('fn3');
            dispatch(action);
            console.log('fn3'); 
        })(action);
        console.log('fn2');
    })(action);
    console.log('fn1');
}
```
所以最终的的dispatch的值为：

```javascript
dispatch = function (action) {
    console.log('fn1');
    (function (action) {
        console.log('fn2');
        (function (action) {
            console.log('fn3');
            dispatch(action);
            console.log('fn3'); 
        })(action);
        console.log('fn2');
    })(action);
    console.log('fn1');
}
```

然后调用_objectSpread函数将这个dispatch合并到store对象上。所以当我们调用store.dispatch方法，其实就是执行这个dispatch。

上面代码中，当调用store.dispatch()方法派发一个任务时，才开始真正的执行中间件函数，首先执行中间件fn1，当执行到next时，就会执行fn2中间件，以此类推直到最后一个中间件，然后才调用原生的store.dispatch方法。

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/32.png)

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/33.png)

### 总结：

**中间件可以让我们在派发一个action到reducer函数处理action并更新state这个中间的过程中，可以执行更多的操作。**