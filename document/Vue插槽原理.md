# Vue插槽原理

我们通过一个简单的例子来了解下Vue插槽内部原理是怎样的？

```html
<div>
    <test>hello , {{name}}</test>
</div>
```

```javascript
const vm = new Vue({
    el : '#app',
    data : {
        name : 'andy'
    },
    components : {
        test : {
            template : '<div><slot /></div>',
        }
    }
});
```

### 怎么解析插槽内容？

当父组件渲染函数执行时，绑定的作用域是父组件的实例，所以在执行渲染函数的时候，this.name其实是获取父组件上绑定的name值。
```javascript
// 这个是父组件的渲染函数
with(this){
    return 
    _c('div',{attrs:{"id":"app"}},
    [
        _c('test',[_v("hello "+_s(name))])
    ],1)
}
```

```javascript
// 这个是子组件的渲染函数
with(this){return _c('div',[_t("default")],2)}
```
这个渲染函数是解析test组件生成的渲染函数。

### 插槽内容怎么插入到子组件中？

当父渲染函数执行完成之后，会生成一个父组件的vnode：里面包含了所有DOM的信息：

```javascript
{
    tag : "div",
    data: { 
        attrs : {id : '#app'}
    },
    children : [
        tag : "vue-component-1-test",
        componentOptions : {
            children : [
                {
                    text : 'hello andy'
                    // ...省略
                }
            ],
            listeners : undefined,
            propsData : undefined,
            tag : 'test'
        }
    ]
}
```
上面的父组件渲染函数执行后，就会得到一个类似于上面的vnode（简化过的vnode），通过vnode我们可以了解到，test组件（外壳节点）保存了父组件传递给子组件的数据，包括children，listeners事件回调，propsData等。

当父组件渲染完之后，发现test组件是一个自定义的组件，那么又会去解析这个组件。在解析test组件时，会调用Vue.prototype._init方法初始化组件。

```javascript
Vue.prototype._init = function (options) {
    // 如果是一个组件，那么就会调用initInternalComponent函数
    if (options && options._isComponent) {
        initInternalComponent(vm, options);
    } else {
        vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor),options || {},vm);
    }
    initRender(vm);
};
```
initInternalComponent函数的作用就是将test外壳节点的中保存的父组件传递给子组件的数据保存到子组件的$options中。这其中就包括将父组件中的子节点保存在子组件的$options对象的_renderChildren上。

```javascript
function initInternalComponent (vm, options) {
    var opts = vm.$options = Object.create(vm.constructor.options);
    var parentVnode = options._parentVnode;
    opts.parent = options.parent;
    opts._parentVnode = parentVnode;
    
    // 将test外壳节点保存的数据，重新赋值到vm.$options上
    var vnodeComponentOptions = parentVnode.componentOptions;
    opts.propsData = vnodeComponentOptions.propsData;
    opts._parentListeners = vnodeComponentOptions.listeners;
    opts._renderChildren = vnodeComponentOptions.children;
    opts._componentTag = vnodeComponentOptions.tag;
    
    if (options.render) {
      opts.render = options.render;
      opts.staticRenderFns = options.staticRenderFns;
    }
}
```
上面代码中，当初始化子组件时，就是将外壳节点中的数据移植到子组件的$options上，这样就完成了将父组件的数据传递给子组件的转移过程。所以我们发现，test外壳节点只是一个缓存父组件传递给子组件的数据的作用。

而当我们调用initRender函数时，会把保存在组件选项的_renderChildren保存在实例的$slots上。

```javascript
function initRender (vm) {
    // ...省略
    var options = vm.$options;
    // 获取子组件的父组件
    var parentVnode = vm.$vnode = options._parentVnode;
    // 获取父组件的执行上下文
    var renderContext = parentVnode && parentVnode.context;
    
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
    vm.$scopedSlots = emptyObject;
    
    vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
    vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };
    
    // ...省略
}
```

```javascript
// children：表示父组件的子节点
// context：表示父组件的执行上下文
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

举个例子：

```javascript
<div id="app">
    <test>
        hello {{name}}
        <div slot="aa">{{name}}</div>
    </test>
</div>
```

如果是匿名插槽，那么就会保存在slots.default中。

```javascript
{
    default : [vnode]
}
```

如果是具名插槽，那么就会拿到插槽的名字name，然后保存在slots[name]中。

```javascript
{
    aa : [vnode]
}
```
最终vm.$slots的结果为：

```
{
    default : [vnode],
    aa : [vnode]
}
```
当子组件完成初始化之后，会将子组件的模板编译成渲染函数：

```javascript
with(this){return _c('div',[_t("default")],2)}
```

当我们调用 "_t('default')"的时候，其实调用的是renderSlot('default'):

```javascript
function renderSlot (name,fallback,props,bindObject) {
    // 作用域插槽
    var scopedSlotFn = this.$scopedSlots[name];
    var nodes;
    // 如果是作用域插槽
    if (scopedSlotFn) { // scoped slot
        props = props || {};
        if (bindObject) {
            if (!isObject(bindObject)) {
                warn(
                    'slot v-bind without argument expects an Object',
                    this
                );
            }
            props = extend(extend({}, bindObject), props);
        }
        nodes = scopedSlotFn(props) || fallback;
    } else {
        // 普通插槽，直接从$slots中，取出插槽内容
        nodes = this.$slots[name] || fallback;
    }
    
    var target = props && props.slot;
    if (target) {
        return this.$createElement('template', { slot: target }, nodes)
    } else {
        return nodes
    }
}
```
通过调用这个方法，就能获取到插槽内容了，当获取到插槽内容，再调用_c函数

```javascript
_c('div',['hello andy'],2)
```
这样我们就把slot插入到子组件中了，接下来就是将组件渲染成真是DOM。

### 总结

- 1、解析父组件，将父组件的插槽保存在子组件的外壳节点的children中。
- 2、将外壳节点的children转移到子组件的选项对象的_renderChildren属性上。
- 3、将子组件的选项对象的_renderChildren属性转移到子组件实例的$slots上。
- 4、解析子组件，会将子组件内部的<slot>标签转为_t函数，执行_t函数，获取对应的插槽内容。
