# Vue从新建实例到开始diff
我们知道当我们调用new Vue的时候，首先会编译模板，生成render函数，然后调用render函数，生成vnode虚拟dom节点，然后就会调用_update函数，进行更新。

举个例子：
```html
<div id="app">
    <div>{{name}}</div>
</div>
```

```javascript
updateComponent = function () {
    vm._update(vm._render(), hydrating);
};
      
new Watcher(vm, updateComponent, noop, {
  before: function before () {
    if (vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'beforeUpdate');
    }
  }
}, true);

```
上面代码，主要做了以下几件事情：
- 创建一个watcher对象
- 给watcher对象绑定了回调函数（updateComponent）

每一个实例都会有自己的watcher，绑定的回调函数会在页面更新的时候调用。当我们创建watcher的时候，就会调用一次updateComponent，也就是执行：
```javascript
vm._update(vm._render(), hydrating);
```
上面代码中，先会调用_render函数，然后调用_update函数。

_render函数是用来生成vnode节点树，_update函数是用来比较旧节点树和调用_render生成的新节点树，完成更新。

```javascript
Vue.prototype._update = function (vnode, hydrating) {
  var vm = this;
  var prevVnode = vm._vnode;
  vm._vnode = vnode;
  // 省略代码...
  
  // 如果旧节点不存在，那么就进行初始化渲染，表示这是第一次渲染组件，所以不存在旧的节点
  if (!prevVnode) {
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
  } else {
    // 如果旧节点存在，那么就对比新旧节点，完成更新操作
    vm.$el = vm.__patch__(prevVnode, vnode);
  }
  // 省略代码...
};
```
- 如果旧节点不存在，那么就进行初始化渲染，表示这是第一次渲染组件，所以不存在旧的节点
- 如果旧节点存在，那么就对比新旧节点，完成更新操作

vm._vnode保存的是当前vnode节点树，当页面开始更新时，生成了新的vnode节点树，会将新的节点树赋值给vm._vnode，而将节点树保存在这里，也是为了方便获取到旧节点树。

vm.__patch__就是对比新旧节点树的地方。