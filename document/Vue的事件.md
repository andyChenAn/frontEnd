# Vue的事件
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
            if (isUndef(cur.fns)) {
                cur = on[name] = createFnInvoker(cur, vm);
            }
            if (isTrue(event.once)) {
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
