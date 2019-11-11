# Vue的过渡动画
Vue的过渡动画，我们可以使用Vue提供的transition组件来实现。

**当插入或删除包含在transition组件中的元素时，Vue将会做以下几件事情：**

- 1、自动嗅探目标元素是否应用了CSS过渡或动画，如果是，那么就会在恰当的时候添加或删除CSS类名。
- 2、如果目标元素提供了javascript过渡动画钩子函数，那么这些钩子函数会在恰当的时候被调用
- 3、如果目标元素既没有应用CSS过渡或动画，又没有提供javascript过渡动画钩子函数，那么DOM操作（插入或删除）会在下一帧中立即执行。

### CSS过渡
当一个元素在进入或者离开的过渡中，会有6个状态切换。6个状态分别是：进入过渡的开始状态，进入过渡生效时的状态，进入过渡的结束状态，离开过渡的开始状态，离开过渡生效时的状态，离开过渡的结束状态。

- 进入过渡的开始状态
  - 在元素被插入之前生效，在元素被插入之后的下一帧移除。

- 进入过渡生效时的状态
  - 在元素被插入之前生效，在过渡完成之后移除。

- 进入过渡的结束状态
  - 在元素被插入之后的下一帧生效，在过渡完成之后移除。

- 离开过渡的开始状态
  - 在离开过渡被触发时立刻生效，下一帧被移除。

- 离开过渡生效时的状态
  - 在离开过渡被触发时立刻生效，在过渡完成之后移除。

- 离开过渡的结束状态
  - 在离开过渡被触发之后下一帧生效，在过渡完成之后移除。

##### 举个例子：

```html
<div id="app4">
    <button @click="handleClick">click</button>
    <transition name="fade">
        <div v-if="show">hello andy</div>
    </transition>
</div>
```

```css
.fade-enter-active , .fade-leave-active {
    transition: all 5000ms ease;
}
.fade-enter {
    opacity: 0;
    transform: translate(100px);
}
.fade-leave-to {
    opacity: 0;
    transform: translate(-100px);
}
```

上面的例子中，当我们点击按钮是，插入的DOM就会进行过渡动画。我们可以看到css中，==.fade-enter== 表示的是元素进入过渡的开始状态，这个样式会在DOM插入之前生效，在DOM插入之后的下一帧被移除。也就是说，在DOM被插入的时候，DOM的起始状态是：==opacity：0，transform：translate(100px)==，在DOM插入之后的下一帧，==.fade-enter== 被移除，也就是说，transform的样式和opacity的样式被删除掉了，而一开始的时候DOM的位置是在100px上，透明度为0，突然transform和opacity被删除了，那么样式失去了transform和opacity的约束，所以DOM肯定会往本该在的位置（也就是过渡结束时的那个状态）进行移动，并且opacity也会往自己本来的值展示（也就是opacity:1），这个时候，如果给DOM加上transition的属性，那么这个过程自然也就是以一种过渡动画的形式发生了。

所以上面的解释也说明了，我们在写过渡样式的时候，并没有写==.fade-enter-to== 也会知道元素的结束状态，而只需要添加transition属性就可以了。其实这也是利用了FLIP技术来实现过渡动画效果。

### CSS动画
CSS动画的用法和CSS过渡相同，区别是在动画中v-enter类名在节点插入DOM后不会立即删除，而是animationend事件触发时删除。

### javascript动画钩子

我们可以在transition组件中声明javascript钩子，其实也就是绑定相应的事件
```html
<transition
  v-on:before-enter="beforeEnter"
  v-on:enter="enter"
  v-on:after-enter="afterEnter"
  v-on:enter-cancelled="enterCancelled"

  v-on:before-leave="beforeLeave"
  v-on:leave="leave"
  v-on:after-leave="afterLeave"
  v-on:leave-cancelled="leaveCancelled"
>
  <!-- ... -->
</transition>
```

```javascript
// ...
methods: {
  // --------
  // 进入中
  // --------

  beforeEnter: function (el) {
    // ...
  },
  // 当与 CSS 结合使用时
  // 回调函数 done 是可选的
  enter: function (el, done) {
    // ...
    done()
  },
  afterEnter: function (el) {
    // ...
  },
  enterCancelled: function (el) {
    // ...
  },

  // --------
  // 离开时
  // --------

  beforeLeave: function (el) {
    // ...
  },
  // 当与 CSS 结合使用时
  // 回调函数 done 是可选的
  leave: function (el, done) {
    // ...
    done()
  },
  afterLeave: function (el) {
    // ...
  },
  // leaveCancelled 只用于 v-show 中
  leaveCancelled: function (el) {
    // ...
  }
}
```