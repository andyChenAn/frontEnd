# Vue生命周期
Vue的生命周期分为以下几个阶段：
- 1、创建实例阶段
- 2、挂载阶段
- 3、更新阶段
- 4、销毁阶段

## 创建实例阶段
创建Vue实例阶段又可以分为创建实例前和创建实例后。创建实例前，会调用beforeCreate生命周期钩子，创建实例后，会调用created生命周期钩子。
```javascript
vm._self = vm;
// 初始化生命周期
initLifecycle(vm);
// 初始化事件
initEvents(vm);
// 初始化渲染函数
initRender(vm);
// 调用beforeCreate生命周期函数
callHook(vm, 'beforeCreate');
// 在初始化数据之前先处理依赖注入的数据
initInjections(vm); // resolve injections before data/props
// 初始化数据
initState(vm);
// 在初始化数据之后，再处理给其子孙组件提供的依赖
initProvide(vm); // resolve provide after data/props
// 创建Vue实例完成，调用created生命周期函数
callHook(vm, 'created');
```
##### beforeCreate生命周期钩子函数
当beforeCreate生命周期钩子函数调用的时候，我们是不能获取到data数据的。因为此时还没有将data数据挂载到Vue实例上。从上面代码中我们可以看到，beforeCreate生命周期函数调用的时候，vue已经对生命周期、事件、渲染函数进行了初始化。所以我们来看一下initLifecycle，initEvents，initRender这三个函数都执行了什么。
- **1、initLifecycle函数**

initLifecycle函数，主要作用是初始化生命周期相关的属性，以及设置vue实例的父组件，子组件，根组件，以及注册了ref引用的组件。
```javascript
function initLifecycle (vm) {
    var options = vm.$options;
    
    // 查找第一个非抽象组件parent
    // 如果存在父组件，并且父组件不是一个抽象组件，那么就循环，直到找到第一个父组件不是抽象组件，那么就将这个组件赋值给parent变量
    // 我们可以看一下while循环，如果父组件是一个抽象组件，并且该组件还有父组件，那么就继续寻找他的父组件，直到找到第一个非抽象组件的父组件为止。
    // 当找到父组件，那么就将当前组件添加到父组件的$chilren属性中。
    var parent = options.parent;
    if (parent && !options.abstract) {
      while (parent.$options.abstract && parent.$parent) {
        parent = parent.$parent;
      }
      // 将当前组件添加到父组件的$children属性中
      parent.$children.push(vm);
    }
    
    // 将父组件赋值给当前组件的$parent属性，这样我们可以通过$parent属性来查找到该组件的父组件
    // 通过组件的$children属性，我们可以找到该组件所有的子组件。
    vm.$parent = parent;
    // 设置组件的根组件
    vm.$root = parent ? parent.$root : vm;
    
    // 组件下的所有子组件
    vm.$children = [];
    // 添加了ref引用的子组件
    vm.$refs = {};
    
    vm._watcher = null;
    // 表示keep-alive中组件状态，如被激活，该值为false,反之为true。
    vm._inactive = null;
    vm._directInactive = false;
    // 当前组件是否完成挂载
    vm._isMounted = false;
    // 当前组件是否被销毁
    vm._isDestroyed = false;
    // 当前组件正在被销毁，介于beforeDestroy和destroyed之间，还没有销毁完成
    vm._isBeingDestroyed = false;
}
```
- **2、initEvents函数**

initEvents函数主要做的是，创建一个空对象，并且将这个空对象赋值给当前组件的_events属性，并且设置当前组件的 _hasHookEvent 属性为false。说白了，这里就是初始化一个事件属性用来保存当前组件所有的事件监听器。
```
function initEvents (vm) {
    // 创建一个空对象，用来保存当前组件的事件监听器
    vm._events = Object.create(null);
    vm._hasHookEvent = false;
    // init parent attached events
    var listeners = vm.$options._parentListeners;
    if (listeners) {
        updateComponentListeners(vm, listeners);
    }
}
```
- **3、initRender函数**

initRender函数主要作用是，



