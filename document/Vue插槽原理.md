# Vue插槽原理

我们通过一个简单的例子来了解下Vue插槽内部原理是怎样的？

```javascript
const test = {
    template : "<div>hello <slot /></div>"
}
let vm = new Vue({
    el : '#app',
    data : {
        name : 'andy',
    },
    components : {
        test
    }
});
```

当我们在使用插槽的时候，Vue底层是如何对插槽内容进行解析的呢？

```javascript
Vue.prototype._init = function (options) {
    if (options && options._isComponent) {
        initInternalComponent(vm, options);
    } else {
        vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor),options || {},vm);
    }
    initRender(vm);
};
```
Vue内部会使用_init方法来初始化Vue实例，当该实例是一个组件的时候，那么会调用initInternalComponent函数，在initInternalComponent函数中，会将组件的插槽节点挂载到组件选项的 _renderChildren 上。

initRender函数会把保存在组件选项的_renderChildren保存在实例的$slots上。

```javascript
function initRender (vm) {
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
}
```

```javascript
function resolveSlots (children,context) {
    if (!children || !children.length) {
        return {}
    }
    var slots = {};
    for (var i = 0, l = children.length; i < l; i++) {
        var child = children[i];
        var data = child.data;
        // 如果节点被当做是一个插槽节点，那么就把节点上的slot属性删除掉
        if (data && data.attrs && data.attrs.slot) {
            delete data.attrs.slot;
        }
        // 如果是具名插槽
        if ((child.context === context || child.fnContext === context) && data && data.slot != null
        ) {
            var name = data.slot;
            var slot = (slots[name] || (slots[name] = []));
            if (child.tag === 'template') {
                slot.push.apply(slot, child.children || []);
            } else {
                slot.push(child);
            }
        } else {
            // 如果是匿名插槽
            (slots.default || (slots.default = [])).push(child);
        }
    }
    // 忽略注释节点，空文本节点
    for (var name$1 in slots) {
        if (slots[name$1].every(isWhitespace)) {
            delete slots[name$1];
        }
    }
    return slots
}
```
通过上面的方式，我们就把插槽节点保存在vm.$slots中。