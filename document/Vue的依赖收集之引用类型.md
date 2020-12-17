# Vue的依赖收集之引用类型
如果依赖收集过程中，数据是引用类型，那么在设置响应式的时候，会有所不同。会分为两种，一种是对象，一种是数组。

举个例子：
```html
<div id="app">
  <div id="box">{{person.name}} = {{person.age}}</div>
</div>

<script>
  let vm = new Vue({
    el: "#app",
    data: {
      person : {
        name : 'andy',
        age : 234
      }
    }
  });
</script>
```

#### 对象
如果数据是对象，那么会遍历对象所有属性，给属性设置响应式，如果属性是基本类型，那么跟依赖收集之基本类型的流程是一样的，每个数据对象都会添加一个`__ob__`属性。

`__ob__`下面会有一个dep属性，其实就是一个Dep对象，用来收集依赖的，为什么数据对象需要通过`__ob__.dep`来收集依赖呢？那是因为对象数据有可能会在其他地方被使用，比如说Vue.set或者Vue.del方法，举个例子：
```html
<div id="app">
  <div id="box">{{person.name}} - {{person.age}}-{{person.address}}</div>
</div>

<script>
  let vm = new Vue({
    el: "#app",
    data: {
      person : {
        name : 'andy',
        age : 234
      }
    },
    created () {
      setTimeout(() => {
        this.$set(this.person , 'address' , '广州');
      } , 2000)
    }
  });
</script>
```
上面代码中，当2秒后，会给person对象添加一个address属性，但是我们一开始初始化的时候并没有添加address属性，如果我们直接使用`this.person.address="广州"`页面是不会更新的，因为person对象下的address属性没有设置响应式，那么这个时候我们如果需要给person对象添加新的属性并且设置属性为响应式的话，我们就需要使用`vm.$set`方法来实现，而`vm.$set`方法内部就是使用了数据对象`__ob__.dep`来通知依赖更新的。所以我们需要在数据对象中添加一个`__ob__.dep`来收集依赖。

基本类型和引用类型收集依赖过程中，主要区别在于：基本类型只使用闭包dep来收集依赖，而引用类型是使用闭包dep和__ob__.dep两种来收集依赖。闭包dep只是存在于defineReactive方法中，其他地方根本访问不到。而对象数据就有可能会在其他地方被使用，就像vm.set方法。

```javascript
function defineReactive$$1(obj, key, val, customSetter, shallow) {
    // 创建一个闭包dep，用来收集依赖
    var dep = new Dep()
    // 如果val是一个对象，那么会返回一个ob对象
    var childOb = !shallow && observe(val);
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get: function reactiveGetter() {
        var value = getter ? getter.call(obj) : val;
        if (Dep.target) {
          dep.depend();
          // 如果是一个对象，那么ob.dep也会收集依赖
          if (childOb) {
            childOb.dep.depend();
            // 如果是数组，那么就会遍历数组，主要是为了数组下面的子元素是对象，给对象也保存一份依赖
            if (Array.isArray(value)) {
              dependArray(value);
            }
          }
        }
        return value;
      },
      // 省略代码...
    });
}
```
#### 数组
如果数据是一个数组，那么会遍历数组，如果数组中的子元素是对象，那么就按照对象的方式进行处理，和对象的处理方式一样，如果是数组的话，也会给数组保存一个`__ob__`属性，数组中的`__ob__.dep`也是用来收集依赖的，作用和对象中的`__ob__.dep`一样。

数组为什么需要`__ob__`属性呢？因为Vue内部重写了数组中的一些方法，而`__ob__dep`中保存的依赖就是给这些方法使用的。

```javascript
var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);
var methodsToPatch = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"];
methodsToPatch.forEach(function (method) {
    var original = arrayProto[method];
    def(arrayMethods, method, function mutator() {
      var args = [],
        len = arguments.length;
      while (len--) args[len] = arguments[len];
    
      var result = original.apply(this, args);
      var ob = this.__ob__;
      var inserted;
      switch (method) {
        case "push":
        case "unshift":
          inserted = args;
          break;
        case "splice":
          inserted = args.slice(2);
          break;
      }
      if (inserted) {
        ob.observeArray(inserted);
      }
      // 通知依赖更新
      ob.dep.notify();
      return result;
    });
});
```
上面代码中，当我们使用数组的上述方法时，数组发生了改变，所以会通知依赖这个数组的watcher进行更新。
