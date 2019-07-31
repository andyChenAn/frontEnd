# Vue事件机制
Vuejs提供了四个事件API，$on,$off,$once,$emit。

当我们创建一个Vue实例时，内部会调用initEvents方法进行初始化事件处理。

```javascript
function initEvents (vm) {
// 创建一个_events对象，用来保存事件
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}
```
## $on
监听当前实例上的自定义事件。事件可以由vm.$emit触发。回调函数会接收所有传入事件触发函数的额外参数。

```javascript
Vue.prototype.$on = function (event, fn) {
    var vm = this;
    // 如果event是一个数组，那么就递归$on方法，为数组中的每一个元素绑定事件
    if (Array.isArray(event)) {
        for (var i = 0, l = event.length; i < l; i++) {
            vm.$on(event[i], fn);
        }
    } else {
        // 如果是字符串的话，会先判断之前是否有绑定事件，如果有的话，直接将回调函数添加到对应的事件名下面
        // 如果之前没有绑定事件，那么将这个事件名称的值初始化为一个数组，然后再将回调添加到数组中
        (vm._events[event] || (vm._events[event] = [])).push(fn);
        // optimize hook:event cost by using a boolean flag marked at registration
        // instead of a hash lookup
        if (hookRE.test(event)) {
            vm._hasHookEvent = true;
        }
    }
    return vm
};
```
## $once
监听一个自定义事件，但是只触发一次，在第一次触发之后移除监听器。

```javascript
Vue.prototype.$once = function (event, fn) {
    var vm = this;
    function on () {
        // 当执行回调函数的时候，将这个事件销毁
        vm.$off(event, on);
        fn.apply(vm, arguments);
    }
    on.fn = fn;
    vm.$on(event, on);
    return vm
};
```
## $off
移除自定义事件监听器。

```javascript
Vue.prototype.$off = function (event, fn) {
    var vm = this;
    // all
    // 如果没有参数，那么就移除所有的事件监听器
    if (!arguments.length) {
      vm._events = Object.create(null);
      return vm
    }
    // array of events
    // 如果提供的事件是一个数组，那么就遍历数组，递归调用$off方法，移除事件对应监听器
    if (Array.isArray(event)) {
      for (var i$1 = 0, l = event.length; i$1 < l; i$1++) {
        vm.$off(event[i$1], fn);
      }
      return vm
    }
    // specific event
    // 如果提供的事件没有监听器，那么就直接返回
    var cbs = vm._events[event];
    if (!cbs) {
      return vm
    }
    // 如果只提供了事件，那么就移除该事件所有的监听器
    if (!fn) {
      vm._events[event] = null;
      return vm
    }
    // specific handler
    // 如果同时提供了事件和回调，那么就只移除这个监听器
    var cb;
    var i = cbs.length;
    while (i--) {
      cb = cbs[i];
      // 这里会有cb.fn === fn的判断，是因为有可能是调用$once方法，绑定一次事件
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1);
        break
      }
    }
    return vm
};
```
## $emit
触发当前实例上的事件。附加参数都会传给监听器回调。

```javascript
Vue.prototype.$emit = function (event) {
    var vm = this;
    {
        var lowerCaseEvent = event.toLowerCase();
        if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
            tip(
              "Event \"" + lowerCaseEvent + "\" is emitted in component " +
              (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
              "Note that HTML attributes are case-insensitive and you cannot use " +
              "v-on to listen to camelCase events when using in-DOM templates. " +
              "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
            );
        }
    }
    // 找到事件对应的回调，然后遍历执行相应的监听器
    var cbs = vm._events[event];
    if (cbs) {
        cbs = cbs.length > 1 ? toArray(cbs) : cbs;
        var args = toArray(arguments, 1);
        var info = "event handler for \"" + event + "\"";
        for (var i = 0, l = cbs.length; i < l; i++) {
            invokeWithErrorHandling(cbs[i], vm, args, vm, info);
        }
    }
    return vm
};
```
