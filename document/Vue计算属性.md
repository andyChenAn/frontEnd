# Vue计算属性

[参考](https://juejin.im/post/5d206531f265da1ba84ab1ad)

##### 基于2.6.10版本

##### 什么时候会初始化计算属性？

当在调用initState函数，初始化各种数据的时候，其中也会初始化计算属性。

```javascript
function initState (vm) {
    // 省略..
    if (opts.computed) { initComputed(vm, opts.computed); }
}
```

```javascript
function initComputed (vm, computed) {

    // 创建一个对象，挂载在vue实例的_computedWatchers上，这个属性保存的是计算属性的watcher
    var watchers = vm._computedWatchers = Object.create(null);
    
    var isSSR = isServerRendering();

    for (var key in computed) {
        
        // 这是用户自己定义的计算属性的getter
        var userDef = computed[key];
        var getter = typeof userDef === 'function' ? userDef : userDef.get;
        
        if (!isSSR) {
            // 为每一个计算属性都创建一个watcher
            watchers[key] = new Watcher(
                vm,
                getter || noop,
                noop,
                computedWatcherOptions
            );
        }
        
        // 判断是否有重名属性，如果没有重名属性，那么就调用defineComputed
        if (!(key in vm)) {
            defineComputed(vm, key, userDef);
        } else {
            if (key in vm.$data) {
                warn(("The computed property \"" + key + "\" is already defined in data."), vm);
            } else if (vm.$options.props && key in vm.$options.props) {
                warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
            }
        }
    }
}
```
initComputed函数，做了以下几件事情：
- 1、为每一个计算属性创建一个watcher
- 2、调用defineComputed函数
- 3、手机所有的计算属性的watcher

##### 为什么要给每一个计算属性创建一个watcher？

- 1、保存计算属性的结果
- 2、将计算属性的getter保存到watcher.getter上
- 3、用于控制计算缓存结果是否有效

```javascript
var Watcher = function Watcher (vm,expOrFn,cb,options,isRenderWatcher) {
    // 省略代码..
    this.vm = vm;
    if (isRenderWatcher) {
        vm._watcher = this;
    }
    vm._watchers.push(this);
    
    // 用于控制计算缓存结果是否有效，将lazy赋值给dirty，只是给dirty一个初始值，表示控制缓存的任务开始了，是真正控制缓存的变量。
    this.dirty = this.lazy; 
    
    // 将计算属性的getter保存到watcher.getter上
    this.getter = expOrFn;
    
    // 保存计算属性的结果
    // 调用this.get()方法，其实就是获取计算属性的值
    this.value = this.lazy ? undefined : this.get();
};
```
这里我们需要注意的是，当我们在初始化计算属性的时候，并不会立刻获取值，而是等到再次访问计算属性的时候，才会开始计算 计算属性的值。

调用this.get()方法，其实就是获取计算属性的值

```javascript
Watcher.prototype.get = function get () {
    // 省略代码...
    var value;
    value = this.getter.call(vm, vm);
    return value
};
```
##### 调用defineComputed函数

调用defineComputed函数，主要就是设置计算属性的get和set，这里的get是通过createComputedGetter进行包装后返回的一个函数，并且在vue实例上挂载计算属性，这样我们就可以直接通过this.xx来访问计算属性了

```javascript
function defineComputed (target,key,userDef) {
    var shouldCache = !isServerRendering();
    // 这里就是设置计算属性的get和set
    // set默认是一个空函数
    // 这里就表示计算属性既可以是一个函数，也可以是一个对象
    // {get : fn , set : fn}或者fn
    if (typeof userDef === 'function') {
        sharedPropertyDefinition.get = shouldCache
        ? createComputedGetter(key)
        : createGetterInvoker(userDef);
        sharedPropertyDefinition.set = noop;
    } else {
        sharedPropertyDefinition.get = userDef.get
        ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
        : noop;
        sharedPropertyDefinition.set = userDef.set || noop;
    }
    // 如果用户没有自己去设置计算属性的set，那么当用户直接去修改计算属性的值时，就会执行下面的警告。
    if (sharedPropertyDefinition.set === noop) {
        sharedPropertyDefinition.set = function () {
            warn(
                ("Computed property \"" + key + "\" was assigned to but it has no setter."),
                this
            );
        };
    }
    // 这里就是将计算属性挂载到vue实例上，这样我们就可以直接通过this.xx来获取计算属性的值。
    Object.defineProperty(target, key, sharedPropertyDefinition);
}
```
调用createComputedGetter函数，返回一个函数，将这个函数赋值给计算属性的get

```javascript
function createComputedGetter (key) {
    return function computedGetter () {
        // 获取每个计算属性对应的watcher
        var watcher = this._computedWatchers && this._computedWatchers[key];
        if (watcher) {
            // 如果计算属性依赖的数据发生变化，dirty会变成true，则表示数据脏了，要重新计算，然后更新watcher.value
            // 如果dirty为false，那么就会返回原来的值。
            if (watcher.dirty) {
                watcher.evaluate();
            }
            if (Dep.target) {
                watcher.depend();
            }
            return watcher.value
        }
    }
}
```
watcher.evaluate 用来重新计算，更新缓存值，并重置dirty为false，表示缓存已更新。

```javascript
Watcher.prototype.evaluate = function evaluate () {
    // 重新计算
    this.value = this.get();
    // 重新设置dirty为false，表示缓存已更新
    this.dirty = false;
};
```
不知道大家还记不记得，我们在初始化computed的时候，会将this.lazy赋值给dirty，所以一开始的时候watcher.dirty为true，当我们再次访问计算属性的时候，就会调用watcher.evaluate方法，会重新计算computed的值，更新dirty为false。

watcher.get方法，其实就是当我们在读取计算属性的时候，就会调用，这个方法会计算computed的值，然后收集依赖。

```javascript
Watcher.prototype.get = function get () {
    // 这里可以改变Dep.target
    // 如果computed依赖其他一个数据的时候，那么这个数据的依赖收集器就会把这个computed watcher收集起来，等到这个数据发生变化的时候，就会通知所有依赖他的数据，及时更新。
    // 而此时的Dep.target指向computed watcher
    pushTarget(this);
    var value;
    var vm = this.vm;
    try {
        // 调用computed，返回computed的值，如果我们调用computed，发现computed还依赖其他数据，那么当我们访问其他数据的时候，又会在其他数据的get方法里，将当前的computed watcher添加到其他数据的依赖收集中。此时的Dep.target指向的还是computed watcher，只有调用了popTarget()才会把Dep.target指向上一个watcher
        value = this.getter.call(vm, vm);
    } catch (e) {
        if (this.user) {
            handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
        } else {
            throw e
        }
    } finally {
        if (this.deep) {
            traverse(value);
        }
        popTarget();
        this.cleanupDeps();
    }
    return value
};
```

```javascript
Dep.target = null;
var targetStack = [];
function pushTarget (target) {
    // 将watcher缓存起来，便于后面恢复
    targetStack.push(target);
    // 目前这个数据依赖的watcher
    Dep.target = target;
}

function popTarget () {
    targetStack.pop();
    // 指向上一个watcher
    Dep.target = targetStack[targetStack.length - 1];
}
```
所以当我们在读取computed的时候，首先会调用watcher.evaluate方法，然后调用watcher.get方法，然后会设置Dep.target指向当前的computed watcher，然后调用computed的getter，如果我们在调用computed的getter的时候，会依赖其他数据，那么会调用其他数据的get方法，那么其他数据的依赖收集器就会收集到这个computed watcher，等到computed依赖的数据发生变化时，会调用依赖收集器（Dep）的notify方法，通知所有的watcher，去更新。

如果有一个页面P，一个computed - C，一个data - D。

```
1、P 引用了 C，C 引用了 D

2、理论上 D 改变时， C 就会改变，C 则通知 P 更新。

3、实际上 C 让 D 和 P 建立联系，让 D 改变时直接通知 P
```

会出现这种情况就是因为下面这段代码，看着很少，但是确实比较绕

```javascript
if (Dep.target) {
    watcher.depend();
}
```
我们来看一下上面这种情况的具体流程是怎样的？

当页面P引用了一个计算属性C，而C又引用了D。
- 1、当页面渲染时，由于页面P读取计算属性C，Dep.target会设置为页面watcher，所以计算属性C收集了页面watcher。
- 2、读取computed C，第一次会进行计算，computed-watcher.evaluted 被调用，进而 computed-watcher.get 被调用，Dep.target会被设置为computed watcher，旧值 页面 watcher 被缓存起来。
- 2、在获取计算属性值的时候，由于计算属性C依赖数据D，在获取D数据的值的时候(调用get方法)，数据D会收集computed watcher。
- 3、computed 计算会读取 data，此时 data 就收集到 computed-watcher同时 computed-watcher 也会保存到 data 的依赖收集器 dep（用于下一步）。
- 4、手动 watcher.depend， 让 data 再收集一次 Dep.target，于是 data 又收集到 恢复了的页面watcher。

```javascript
Watcher.prototype.get = function get () {
    pushTarget(this);
    var value;
    var vm = this.vm;
    value = this.getter.call(vm, vm);
};

Object.defineProperty(obj , key , {
    get : function () {
        if (Dep.target) {
            // computed-watcher 也会保存到 data 的依赖收集器 dep
            dep.depend();
        }
    }
});
```