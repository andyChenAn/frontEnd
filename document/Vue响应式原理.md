# Vue响应式原理
在Vue内部中，通过使用Object.defineProperty方法重新定义了对象的属性，当使用这个属性的时候会进行依赖收集，当属性的值发生改变的时候，会通知依赖进行更新。

## 我们怎么知道数据发生改变了呢？
Vue中，通过Object.defineProperty方法来为对象的每一个属性设置一个get和set方法，get方法指的是当获取对象的某个属性，就会调用get方法，而set方法指的是当给对象的某个属性重新赋值时，就会调用set方法。所以我们通过set方法就可以知道数据是不是发生了改变。

```javascript
class Observe {
    constructor (data) {
        this._data = data;
        this.walk(data);
    }
    walk (data) {
        Object.keys(data).forEach(key => {
            this.defineReactive(data , key , data[key]);
        })
    }
    defineReactive (data , key , val) {
        Object.defineProperty(data , key , {
            enumerable : true,
            configurable : true,
            get () {
                return val;
            },
            set (newVal) {
                val = newVal;
            }
        })
    }
}
```
## 当数据发生改变，怎么通知哪些视图更新呢？
首先我们需要知道哪些视图依赖这个数据，所以我们先要进行的就是依赖收集工作，那我们什么时候进行依赖收集工作呢？我们可以在对象的属性被获取的时候去收集，当需要获取对象的属性，那么就表示需要用到对象的这个属性，从而也表明视图需要依赖这个属性，那么我们可以把这个视图添加到这个属性的依赖中。

每个属性都有一个依赖收集器，用来收集所有依赖这个属性的视图。

当我们收集了所有依赖这个属性的视图之后，当这个属性发生改变的时候，就需要通知这些视图进行更新。

```javascript
class Observe {
    constructor (data) {
        this._data = data;
        this.walk(data);
    }
    walk (data) {
        Object.keys(data).forEach(key => {
            this.defineReactive(data , key , data[key]);
        })
    }
    defineReactive (data , key , val) {
        let dep = new Dep();
        observe(val);
        Object.defineProperty(data , key , {
            enumerable : true,
            configurable : true,
            get () {
                // 哪个视图依赖这个属性，我们就把这个视图添加到依赖收集器中
                // 等到属性值发生改变的时候，再通知所有依赖这个属性的视图更新
                if (Dep.target) {
                    dep.addSub(Dep.target);
                } 
                return val;
            },
            set (newVal) {
                val = newVal;
                observe(newVal);
                // 当数据发送改变时，通知视图发生更新
                dep.notify();
            }
        })
    }
};
function observe (data) {
    if (!data || typeof data !== 'object') {
        return;
    }
    return new Observe(data);
};
```

```javascript
class Dep {
    constructor () {
        this.subs = [];
    }
    addSub (sub) {
        this.subs.push(sub);
    }
    notify () {
        this.subs.forEach(sub => {
            sub.update();
        })
    }
}
Dep.target = null;
```
## 当数据发生改变，视图怎么知道什么时候需要更新？
当数据发生变化时，我们可以在定义属性的set方法里面，去通知所有依赖这个属性的视图更新。视图主要做的事情就是在自身实例化的时候往订阅收集器中添加自己，而且视图会有一个update方法，当属性发生改变的时候，调用这个方法来更新视图。

```javascript
class Watcher {
    constructor (vm , expOrFn , cb) {
        this.cb = cb;
        this.vm = vm;
        this.expOrFn = expOrFn;
        this.value = this.get();
    }
    get () {
        Dep.target = this;
        const value = this.vm._data[this.expOrFn];
        Dep.target = null;
        return value;
    }
    update () {
        this.run();
    }
    run () {
        let value = this.get();
        if (value !== this.value) {
            this.value = value;
            this.cb.call(this.vm);
        }
    }
};
```
当视图初始化的时候，就会去获取需要监听属性的值，这个时候就会将视图添加到依赖收集中，当属性值发生变化时，就会调用视图的update方法，从而最新传入视图的回调函数。

## 全部代码

```javascript
class Observe {
    constructor (data) {
        this._data = data;
        this.walk(data);
    }
    walk (data) {
        Object.keys(data).forEach(key => {
            this.defineReactive(data , key , data[key]);
        })
    }
    defineReactive (data , key , val) {
        let dep = new Dep();
        observe(val);
        Object.defineProperty(data , key , {
            enumerable : true,
            configurable : true,
            get () {
                // 哪个视图依赖这个属性，我们就把这个视图添加到依赖收集器中
                // 等到属性值发生改变的时候，再通知所有依赖这个属性的视图更新
                if (Dep.target) {
                    dep.addSub(Dep.target);
                } 
                return val;
            },
            set (newVal) {
                val = newVal;
                observe(newVal);
                dep.notify();
            }
        })
    }
};
function observe (data) {
    if (!data || typeof data !== 'object') {
        return;
    }
    return new Observe(data);
};

class Dep {
    constructor () {
        this.subs = [];
    }
    addSub (sub) {
        this.subs.push(sub);
    }
    notify () {
        this.subs.forEach(sub => {
            sub.update();
        })
    }
}
Dep.target = null;

class Watcher {
    constructor (vm , expOrFn , cb) {
        this.cb = cb;
        this.vm = vm;
        this.expOrFn = expOrFn;
        this.value = this.get();
    }
    get () {
        Dep.target = this;
        const value = this.vm._data[this.expOrFn];
        Dep.target = null;
        return value;
    }
    update () {
        this.run();
    }
    run () {
        let value = this.get();
        if (value !== this.value) {
            this.value = value;
            this.cb.call(this.vm);
        }
    }
};

class ANDY {
    constructor (options) {
        this._data = options.data;
        observe(this._data);
        this._proxy(this._data);
    }
    watch (key , cb) {
        new Watcher(this , key , cb);
    }
    _proxy (data) {
        Object.keys(data).forEach(key => {
            Object.defineProperty(this , key , {
                enumerable : true,
                configurable : true,
                get () {
                    return data[key];
                },
                set (newVal) {
                    data[key] = newVal;
                }
            })
        })
    }
}
```

```javascript
let vm = new ANDY({
    data : {
        name : 'andy',
        age : 12
    }
})
// 我们在这里监听属性的变化，一旦发生变化，就会调用回调函数
vm.watch('age' , function () {
    console.log('age的值发生了变化');
});
vm.watch('name' , function () {
    let el = document.getElementById('app');
    el.innerHTML = vm.name;
});
```