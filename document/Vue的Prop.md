# Vue的props
当我们创建实例时，Vue会进行一系列初始化操作，其中执行initState函数，就是对computed,props,data,watch,computed等组件数据和方法进行初始化。

```javascript
function initState (vm) {
    vm._watchers = [];
    var opts = vm.$options;
    // 初始化props
    if (opts.props) { initProps(vm, opts.props); }
}
```
我们主要来看看initProps函数具体都做了什么事情？

```javascript
// 简化的代码
function initProps (vm, propsOptions) {
    var propsData = vm.$options.propsData || {};
    var props = vm._props = {};
    // 组件props所有的key都会保存在这里
    var keys = vm.$options._propKeys = [];
    var isRoot = !vm.$parent;

    var loop = function ( key ) {
        // 把props的key保存在vm.$options._propKeys里
        keys.push(key);
        // 给props的key设置响应式
        defineReactive$$1(props, key, value);
        
        // 给props设置代理，我们可以直接通过vm.xx来方式来访问props的属性值
        // 当访问vm属性，直接转接到访问vm._props属性
        if (!(key in vm)) {
            proxy(vm, "_props", key);
        }
    };
    
    // 遍历props
    for (var key in propsOptions) loop( key );
    toggleObserving(true);
}
```
上面的代码主要做了以下几件事情：
- 1、遍历props，将props的key保存在vm.$options._propKeys中
- 2、给props的key设置响应式
- 3、给props设置代理，我们可以直接通过vm.xx的方式来访问props的属性值

### 父组件是怎么传值给子组件的props的？

```html
<div class="aa">
    <test :name="name"></test>
</div>
```
上面代码，父组件模板会被解析为渲染函数

```javascript
(function() {    
    with(this){  
        return _c('div',{staticClass:"aa"},[
            _c('test',{attrs:{"name":name}})
        ],1)
    }
})
```
当执行这个渲染函数的时候，with绑定的作用域是父组件的作用域，所以当调用

```javascript
_c('test',{attrs:{"name":name}})
```
渲染test子组件的时候，this.name其实就是父组件上定义的name字段，这样的话，子组件就拿到了父组件的数据。

test组件是一个外壳组件，外壳组件中保存着父组件传递给子组件的数据，比如，props，listeners，children等，都是保存在外壳组件的componentOptions属性上。当Vue在创建test组件的时候，首先也是调用Vue.prototype._init方法进行初始化，在初始化的时候，会判断是不是一个自定义的组件，如果是的话，就会调用initInternalComponent函数。

```javascript
Vue.prototype._init = function (options) {
    // ...省略代码
    if (options && options._isComponent) {
        initInternalComponent(vm, options);
    }
}
```
这个函数的主要作用就是：将外壳组件中，父组件传递给子组件的数据都保存到子组件实例的$options对象上。

然后会调用initState(vm)函数，对组件的数据进行初始化，其中就会调用initProps

```javascript
if (opts.props) { initProps(vm, opts.props); }
```
在initProps函数中，会把props的数据都保存在组件实例的_props对象上，然后设置_props的属性为响应式，所有的props属性，都会被保存在组件实例的_props上，并且会设置props的代理拦截，也就是，当我们使用this.name来访问props属性值时，其实访问的this._props.name。

### 父组件数据发生变化时，怎么通知子组件更新？

当每一个组件渲染的时候，都会存在一个组件watcher，而这个watcher就是用来组件更新，以及用来给该组件依赖的数据来保存，这样当组件依赖的数据发生变化的时候，那么就会通知所有依赖这个数据的组件进行更新。

```html
<div class="aa">
    <test :name="name"></test>
</div>
```
```javascript
(function() {    
    with(this){  
        return _c('div',{staticClass:"aa"},[
            _c('test',{attrs:{"name":name}})
        ],1)
    }
})
```
在父组件第一次调用渲染函数进行渲染的时候，会读取父组件上的name属性，而此时的name属性已经被设置为响应式了，所以在读取name属性的时候，会触发name属性的get方法，这个时候name属性的依赖收集器就会收集父组件的watcher，用于当name属性发生变化时，更新父组件。

所以当name属性发生变化的时候，就会通知父组件的watcher更新，那么又会调用渲染函数，进行更新渲染

```javascript
(function() {    
    with(this){  
        return _c('div',{staticClass:"aa"},[
            _c('test',{attrs:{"name":name}})
        ],1)
    }
})
```

我们通过一个简单的例子来看一下具体是怎么更新的？

```javascript
const vm = new Vue({
    el : '#app',
    data : {
        name : 'andy'
    },
    components : {
        test : {
            props : ['name'],
            template : '<div>hello {{name}}</div>'
        }
    },
    created () {
        
    },
    methods : {
        change () {
            this.name = 'jack';
        }
    }
})
```
上面这个例子中，父组件传递name给子组件，当父组件的name发生变化时，会将变化的name通过props传递给子组件。updateChildComponent函数是子组件内部更新时会调用到的一个函数

```javascript
function updateChildComponent(vm,propsData,listeners,parentVnode,renderChildren) {
    if (propsData && vm.$options.props) {
        var props = vm._props;
        // 遍历子组件上的props的key
        var propKeys = vm.$options._propKeys || [];
        for (var i = 0; i < propKeys.length; i++) {
            var key = propKeys[i];
            var propOptions = vm.$options.props; 
            // 更新props属性上的值
            // 这里会触发props属性的set方法，从而会通知所有的依赖该属性的监听器更新
            props[key] = validateProp(key, propOptions, propsData, vm);
        }
        vm.$options.propsData = propsData;
    }
}
```
当父组件的属性发生变化时，新的数据会通过props传递给子组件，然后子组件直接进行赋值操作，由于子组件的_props属性已经在初始化props的时候设置了响应式，那么这个时候就会触发该属性的set方法，从而会通知子组件的监听器更新，从而会进行渲染更新。所以当props传递的基本数据类型，那么会由子组件内部的 _props通知子组件更新。

上面这种情况属于当props传递的基本数据类型，如果props是引用类型，那么是怎么操作的呢？如果父组件props传递到子组件的数据是一个引用类型，那么是由父组件的数据data通知子组件更新的。

### 总结

1、如果props传递是基本数据类型，那么会在子组件实例上设置这个_props为响应式，主要就是来监听 _props属性的修改。当父组件修改props的属性时，那么只会把新的数据传递给子组件，子组件拿到新的数据，就会直接会赋值给 _props属性，这个时候就会触发 _props属性的set方法，那么就会通知子组件完成渲染更新。也就是说，当传递的数据时基本类型的时候，是由子组件内部的props通知子组件进行更新的。

2、如果props传递的引用类型（数组或对象），那么也会在子组件实例上设置这个属性为响应式，但是不会向下递归数组或对象，那是因为该数组或对象在父组件上进行初始化data数据的时候就已经完成响应式的设置了。所以在修改对象下的属性值时，重新调用渲染函数，读取属性值的时候，其实就是父组件的data数据通知子组件进行更新。

3、但是如果是对象被整个替换了，那么还是走props传递是基本类型的流程，也就是说，当父组件的数据发生变化时，是由子组件内部的props通知子组件渲染更新的。