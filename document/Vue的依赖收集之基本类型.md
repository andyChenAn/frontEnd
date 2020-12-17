# Vue的依赖收集之基本类型
举个小列子：
```html
<div id="app">
  <div id="box">{{name}}</div>
</div>

<script>
  let vm = new Vue({
    el: "#app",
    data: {
      name : 'andy'
    }
  });
</script>
```
上面代码中，模板编译成render函数为：

```javascript
with(this){  
    return _c('div',{attrs: {id : 'app'}},[name])
}
```
当页面读取name属性的值时，就会触发属性的get方法
```javascript
function defineReactive$$1(obj, key, val, customSetter, shallow) {
    // 创建一个dep对象，主要用于依赖收集和依赖更新
    // 这个dep对象是当前key独有的，每一个key都会有一个自己的dep对象
    var dep = new Dep();
    
    // 获取当前key的属性描述符
    var property = Object.getOwnPropertyDescriptor(obj, key);
    // 如果对象的属性描述不可改变时，那么就直接返回
    // 这就说明我们不能修改对象的属性描述
    if (property && property.configurable === false) {
      return;
    }

    // 获取属性的值
    var getter = property && property.get;
    var setter = property && property.set;
    if ((!getter || setter) && arguments.length === 2) {
      val = obj[key];
    }
    // 观察属性的值
    // 如果值是一个对象那么就递归遍历对象中的每个属性，并设置响应式
    // 如果值是一个数组，那么就重新设置数组方法，并且遍历数组中的每一个元素，调用observe(value)
    var childOb = !shallow && observe(val);
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get: function reactiveGetter() {
        // 获取属性的值
        var value = getter ? getter.call(obj) : val;
        // 如果Dep.target存在
        if (Dep.target) {
          // 那么就将依赖收集到这个属性中
          dep.depend();
          // 省略代码...
        }
        return value;
      },
      // ...省略代码
    });
  }
```
在收集的过程中，有几个比较重要的东西：
- Dep.target：指的是各种watcher，包括`页面watcher`，`computed watcher`等，Dep.target是不停在变化的，根据调用渲染函数，指向不同的watcher，指向一个watcher，那么表示这个watcher正在使用当前的数据，那么当前数据就会把这个watcher添加到自己的依赖中。
- Dep：指的是一个依赖对象，主要的作用就是收集依赖和通知依赖更新。