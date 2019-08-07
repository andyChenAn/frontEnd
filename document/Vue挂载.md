# Vue挂载
当将模板字符串转为ast，然后再将ast转为render函数之后，我们就需要调用render函数，将元素挂载到页面上。

挂载之前，先会调用Vue组件生命周期钩子beforeMount函数，然后调用new Watcher()，收集依赖，并且当表达式的值发生变化时，触发回调函数的执行。在new Watcher()内部，当调用this.get()时，就会调用this.getter()方法，其实也就是调用updateComponent，所以会调用：
```javascript
updateComponent = function () {
    vm._update(vm._render(), hydrating);
};
```
该方法内部就是调用vm._update方法：

```javascript
Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;
    // 上一个元素
    var prevEl = vm.$el;
    // 上一个节点，一开始的时候会undefined
    var prevVnode = vm._vnode;
    var restoreActiveInstance = setActiveInstance(vm);
    // 将当前节点设置为上一个节点
    vm._vnode = vnode;
    // 如果不存在上一个节点，那么表示当前渲染属于初始化渲染，否则就属于更新
    if (!prevVnode) {
        // 这里进行初始化渲染
        // 
        vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
    } else {
        // updates
        // 这里会去对比上一个节点和当前节点有哪些地方是更新过的，那么只需要更新已经改变的节点
        vm.$el = vm.__patch__(prevVnode, vnode);
    }
    restoreActiveInstance();
    // update __vue__ reference
    if (prevEl) {
        prevEl.__vue__ = null;
    }
    if (vm.$el) {
        vm.$el.__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
        vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
};
```
当初始化完成之后就会调用mount生命周期钩子，完成初始化渲染工作。

## 总结

初始化渲染的过程中，__patch__方法内部其实就是在遍历VNode树上的所有节点，然后创建对应的真实DOM，并将DOM插入到body上。