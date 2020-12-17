# Vue的methods
在Vue中，我们可以在Vue中的methods字段下定义各种方法，用来处理业务逻辑。而我们需要掌握的有以下两点：

- 1、我们如何访问定义在methods下的方法
- 2、定义的方法的作用域

```javascript
function initMethods (vm, methods) {
    // vue中绑定的属性
    var props = vm.$options.props;
    // 遍历methods对象下的所有属性，并保存到vm[key]中
    for (var key in methods) {
      // ...省略代码
      // 调用bind方法，绑定methods下的所有方法的作用域在当前vue实例上
      vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm);
    }
}
```
#### 我们如何访问定义在methods下的方法？
在Vue源码中，会遍历methods对象下的所有属性，并直接复制到Vue实例上，所以我们就可以通过vm.xxx来访问方法了。

#### methods下定义的方法的作用域？
在Vue源码中，会通过调用bind方法来绑定methods的作用域。
```javascript
// polyfill
function polyfillBind (fn, ctx) {
    function boundFn (a) {
      var l = arguments.length;
      return l
        ? l > 1
          ? fn.apply(ctx, arguments)
          : fn.call(ctx, a)
        : fn.call(ctx)
    }
    
    boundFn._length = fn.length;
    return boundFn
}

function nativeBind (fn, ctx) {
    return fn.bind(ctx)
}
var bind = Function.prototype.bind ? nativeBind : polyfillBind;
```
通过上面代码，我们可以发现，我们定义的methods的方法作用域都是绑定在当前Vue实例上的。也就是说，你在哪个Vue实例上定义的方法，方法的作用域就绑定在哪个Vue实例上。
