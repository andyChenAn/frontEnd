# Vue的事件之绑定原生DOM事件
我们可以把Vue中的事件划分为：原生DOM事件，自定义事件。
### 如何绑定原生DOM事件？
我们通过一个简单的例子来看一下具体是怎么执行的？

```html
<div id="app">
    <div @click="showName">{{name}}</div>
</div>
```
当Vue在初始化的时候，会将模板解析为VNode，对新旧VNode进行对比，然后生成真实DOM，挂载到相应的地方。而模板最终会被转为渲染函数。

```javascript
with (this) {
    return _c(
        'div',
        {
            attrs : {
                "id" : "app"
            }
        },
        [
            _c(
                'div',
                {
                    on : {
                        "click" : showName
                    }
                },
                [
                    _v(_s(name))
                ]
            )
        ]
    )
}
```
执行_c其实就是调用createElement函数，最终会创建DOM，设置DOM的属性，绑定DOM事件等。

```javascript
function updateListeners (on,oldOn,add,remove$$1,createOnceHandler,vm) {
    var name, def$$1, cur, old, event;
    // 遍历绑定的事件
    for (name in on) {
        // 新事件
        def$$1 = cur = on[name];
        // 旧事件
        old = oldOn[name];
        event = normalizeEvent(name);
        if (isUndef(cur)) {
            // 如果新事件不存在，那么就发出警告
            warn(
                "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
                vm
            );
        } else if (isUndef(old)) {
            // 如果DOM没有旧事件，那么就添加新事件
            if (isUndef(cur.fns)) {
                // 调用createFnInvoker函数，其实就是给事件回调函数进行一层包装，它返回的也还是一个函数
                // 进行包装的原因是当新事件和旧事件不同时，不需要对就事件进行解绑，然后绑定新事件，而是直接替换事件回调函数即可
                cur = on[name] = createFnInvoker(cur, vm);
            }
            if (isTrue(event.once)) {
                // 一次性事件情况，也就是说，事件只会执行一次，执行完之后就解绑
                cur = on[name] = createOnceHandler(event.name, cur, event.capture);
            }
            // 绑定DOM事件，内部其实就是调用addEventListener
            add(event.name, cur, event.capture, event.passive, event.params);
        } else if (cur !== old) {
            // 如果新事件和旧事件不相同
            // 那么就替换旧事件
            old.fns = cur;
            on[name] = old;
        }
    }
    // 移除旧事件
    // 主要是判断当前DOM中绑定的新事件中没有旧事件，那么就直接移除旧事件
    for (name in oldOn) {
        if (isUndef(on[name])) {
            event = normalizeEvent(name);
            remove$$1(event.name, oldOn[name], event.capture);
        }
    }
}
```

上面代码主要做了以下几件事情：
- 1、如果DOM没有旧事件，那么就添加新事件
- 2、如果DOM的新事件和旧事件不同，那么就用新事件替换旧事件
- 3、移除旧事件，如果DOM绑定的新事件中没有旧事件，那么就直接移除旧事件

#### createFnInvoker函数

createFnInvoker函数主要做了以下几件事情：
- 1、返回一个新函数invoker
- 2、将事件回调函数挂载在invoker.fns上，目的是，如果旧事件和新事件不同时，不需要解绑旧事件，而是直接用新事件回调函数替换旧事件回调函数即可

```javascript
function createFnInvoker (fns, vm) {
    // 返回一个invoker函数，并将事件回调函数绑定在invokers.fns上
    function invoker () {
        var arguments$1 = arguments;
        var fns = invoker.fns;
        if (Array.isArray(fns)) {
            var cloned = fns.slice();
            for (var i = 0; i < cloned.length; i++) {
            invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
            }
        } else {
            return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
        }
    }
    invoker.fns = fns;
    return invoker
}
```
#### createOnceHandler函数

createOnceHandler函数主要作用是当只会触发一次事件回调函数，当触发完一次事件回调函数后，就会解绑事件回调。

createOnceHandler函数主要做了以下几件事情：
- 1、返回一个新函数
- 2、当触发事件，执行这个新函数后，会立刻解绑事件回调。

```javascript
function createOnceHandler (event, fn) {
    var _target = target;
    return function onceHandler () {
        var res = fn.apply(null, arguments);
        if (res !== null) {
            _target.$off(event, onceHandler);
        }
    }
}
```

这里我们主要来看一下这段代码：

```javascript
if (isUndef(cur)) {
    ...省略代码
} else if (cur !== old) {
    // 如果新事件和旧事件不相同
    // 那么就替换旧事件
    old.fns = cur;
    on[name] = old;
}
```
上面这段代码的作用就是，当旧事件和新事件不同时，直接替换事件回调函数即可。
