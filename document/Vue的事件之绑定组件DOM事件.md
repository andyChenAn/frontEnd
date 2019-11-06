# Vue的事件之绑定组件DOM事件
我们通过一个简单的例子来看一下具体是怎么绑定组件事件的

```html
<div id="app">
    <andy @click.native="showName" />
</div>
```

上面的模板字符串，经过Vue解析为渲染函数

```javascript
with(this){
    return _c(
        'div',
        {
            attrs:{
                "id":"app"
            }
        },
        [
            _c(
                'andy',
                {
                    nativeOn:{
                        "click":function($event){return showName($event)}
                    }
                }
            )
        ]
    )
}
```
执行渲染函数会创建vnode，首先调用_c函数，给<andy>组件创建vnode，得到下面的结果（经过删减了，只看我们需要的），我们先来看一下执行顺序：

```
vm._c ==> createElement ==> _createElement ==> createComponent ==> return vnode
```
在createComponent函数里面就是创建vnode，并且会将data.nativeOn直接赋值给data.on，所以返回的结果中，就会看到有"on"这个字段，返回的结果：
```javascript
{
    tag : 'vue-component-1-andy',
    data : {
        hook: {init: ƒ, prepatch: ƒ, insert: ƒ, destroy: ƒ}
        nativeOn: {click: ƒ}
        on: {click: ƒ}
        pendingInsert: null
    }
    ...
}
```
而这个"vue-component-1-andy"vnode节点可以说是一个外壳节点，外壳节点中保存了父子组件关联的数据，比如props，事件，子元素等。我们这里来看一下createComponent函数内部具体是怎么做的（代码经过删减了）

```javascript
function createComponent (Ctor,data,context,children,tag) {
    data = data || {};
    
    // 提取父组件传递给子组件的props
    var propsData = extractPropsFromVNodeData(data, Ctor, tag);
    
    // 提取监听子组件的事件监听器，这里是自定义事件监听器
    var listeners = data.on;

    // 获取在组件上绑定的原生事件监听器，<andy @click.native="fn" />
    // data.on上面保存的是原生DOM事件
    data.on = data.nativeOn;
    
    // return a placeholder vnode
    // 创建一个vnode，这个vnode就是一个外壳节点，而不是里面的内容的vnode，这个外壳节点上保存了父组件与子组件关联的数据，比如props，事件，子元素等
    var name = Ctor.options.name || tag;
    var vnode = new VNode(
      ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
      data, undefined, undefined, undefined, context,
      { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
      asyncFactory
    );
    // 返回vnode
    return vnode
}
```
createComponent函数做了以下几件事情：
- 1、提取父组件传递给子组件的props。
- 2、提取监听子组件的事件监听器（自定义事件）。
- 3、处理组件上绑定的原生DOM事件，比如<andy @click.native="fn" />，直接将data.nativeOn赋值给data.on。
- 4、创建vnode，并将props，事件，子元素等保存在这个vnode上。

当调用完渲染函数，创建完vnode后，就会调用Vue.prototype._update这个方法，来进行更新。我们先来看一下执行过程：

```javascript
Vue.prototype._update ==> Vue.prototype.__patch__ ==> patch ==> createPatchFunction ==> return function patch (oldVnode, vnode, hydrating, removeOnly) ==> createElm ==> createComponent(这个函数和之前的createComponent不一样) ==> initComponent ==> invokeCreateHooks ==> cbs.create[i$1](emptyNode, vnode) ==> updateDOMListeners ==> updateListeners
```
所以我们可以看到最后还是调用updateListeners函数，来绑定事件

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