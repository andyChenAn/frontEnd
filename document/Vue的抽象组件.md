# Vue的抽象组件
当我们在编写Vue组件的时候，如果我们给组件设置了一个abstract为true的属性，那么这个组件就是一个抽象组件，抽象组件并不会存在于虚拟DOM树中，因为在Vue组件初始化的时候，再查找当前组件的父节点的时候，会过滤掉父节点为抽象组件的节点。所以抽象组件并不会挂载在虚拟DOM树中，从而也不会被渲染成真实的DOM。像Vue内部的keep-alive，transition，transition-group都是抽象组件。

抽象组件可以很方便的让我们复用功能，我们只需要将复用的功能写到抽象组件里面即可。比如像我们常见的防抖功能，节流功能等。

举个例子：当点击按钮时，隔1秒钟后再执行其他操作，而且这个功能会在应用中很多地方使用，那么为了复用我们可以把它写成一个抽象组件，然后将按钮元素作为这个抽象组件的子元素即可。

```javascript
function debounce (fn , interval) {
    let timer = null;
    return function () {
        let args = arguments;
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(null , args)
        } , interval)
    }
}
export default {
    name : 'debounce',
    abstract : true,
    props : {
        events : String,
        time : Number
    },
    render () {
        const vnode = this.$slots.default[0];
        if (vnode && this.events) {
            let eventList = this.events.split('-');
            eventList.forEach(event => {
                let eventFn = vnode.data.on[event];
                if (typeof eventFn === 'function') {
                    vnode.data.on[event] = debounce(eventFn , this.time);
                }
            })
        }
        return vnode;
    }
}
```
```html
<debounce :time=3000 events="click">
	<button @click="handleClick" id="btn">click</button>
</debounce>
```
这样我们就完成了一个简单的抽象组件。比如我们现在又有一个需求就是，在输入框中输入完1秒后，显示提示内容

```html
<debounce :time=1000 events="input">
	<input type="text" @input="handleInput">
</debounce>
```
这样我们就编写了一个抽象组件，并复用了这个防抖功能。
