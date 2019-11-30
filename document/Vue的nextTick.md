# Vue的nextTick
Vue在更新DOM时是异步执行的。只要侦听到数据变化，Vue将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。然后在下一个事件循环中，Vue刷新队列并执行实际工作。

举个例子：

```html
<div id="app">
    <button @click="add">click</button>
    <div id="box">{{name}}</div>
</div>
```
```javascript
let vm = new Vue({
    el : '#app',
    data : {
        name : 'andy'
    },
    methods: {
        add () {
            this.name = 'jack';
            let box = document.getElementById('box');
            console.log(box.innerText);
        }
    },
});
```
当我们点击按钮，改变name值之后，发现获取到的dom中的name值是andy，而不是改变之后的jack，这也就是说明DOM的更新是异步的，并不会立即更新，而是等到下一个事件循环的时候执行更新。

如果我们想要获得正确的结果，那么我们可以使用this.$nextTick方法，在这个方法的回调里获取获取DOM的值就可以了。

### nextTIck实现
Vue内部是如果实现nextTick呢？

```javascript
Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
};
```
当我们调用this.$nextTick方法时，其实也就是执行nextTick函数

```javascript
var callbacks = [];
var pending = false;
// cb是回调函数，ctx是当前执行上下文
function nextTick (cb, ctx) {
    var _resolve;
    callbacks.push(function () {
        if (cb) {
            try {
            cb.call(ctx);
            } catch (e) {
            handleError(e, ctx, 'nextTick');
            }
        } else if (_resolve) {
            _resolve(ctx);
        }
    });
    if (!pending) {
        pending = true;
        timerFunc();
    }
    // 返回一个Promise对象
    if (!cb && typeof Promise !== 'undefined') {
        return new Promise(function (resolve) {
        _resolve = resolve;
        })
    }
}
```
在nextTick函数中，有几个变量我们需要注意：pending，_resolve，callbacks。
- 1、callbacks是一个数组，用来保存各种异步函数。
- 2、pending是一个标记，用来标记是否需要执行异步任务。
- 3、_resolve是一个Promise中的resolve函数，用于当nextTick方法中的回调函数不存在的情况下，就调用Promise的resolve函数。

nextTick函数，主要做了以下几件事情：
- 1、将nextTick的回调函数保存在callbacks数组中。
- 2、当pending为false，表示当前没有需要等待的异步任务，那么就立即刷新队列，执行异步任务。
- 3、返回一个Promise对象。

从上面代码中，我们发现，当pending为false时，就会执行timerFunc函数，timerFunc是什么？

```javascript
if (typeof Promise !== 'undefined' && isNative(Promise)) {
    var p = Promise.resolve();
    timerFunc = function () {
        p.then(flushCallbacks);
        if (isIOS) { setTimeout(noop); }
    };
    isUsingMicroTask = true;
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
    var counter = 1;
    var observer = new MutationObserver(flushCallbacks);
    var textNode = document.createTextNode(String(counter));
    observer.observe(textNode, {
        characterData: true
    });
    timerFunc = function () {
        counter = (counter + 1) % 2;
        textNode.data = String(counter);
    };
    isUsingMicroTask = true;
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    timerFunc = function () {
        setImmediate(flushCallbacks);
    };
} else {
    timerFunc = function () {
        setTimeout(flushCallbacks, 0);
    };
}
```
上面代码主要是Vue对异步队列尝试使用哪种方式执行。

- 1、如果环境执行原生Promise，那么使用Promise.then来实现异步执行。
- 2、如果环境不支持原生Promise，并且不是IE浏览器，并且支持MutationObserver，那么就使用MutationObserver来实现异步执行。
- 3、如果setImmediate存在，那么就使用setImmediate来实现异步执行。
- 4、上面三种方式都不支持的话，那么就使用setTimeout来实现异步执行。

所以Vue内部会先尝试使用Promise.then，如果不行就使用MutationObserver，如果不行再使用setImmediate，最后上面三种方式都不行的话，就使用setTimeout。所以Vue内部会优先使用微任务，如果不支持，才会使用宏任务。
