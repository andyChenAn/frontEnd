# Vue的transition组件实现原理
transition组件是Vue内部实现的一个抽象组件，主要作用是Vue在插入、更新或者移除DOM时，提供多种不同方式的应用过渡效果。说白了就是给组件提供过渡动画效果的。

举个例子：

```html
<div id="app">
    <button @click="handleClick">click</button>
    <transition name="fade">
        <div v-show="show">hello andy</div>
    </transition>
</div>
```
当Vue执行，模板会被最终解析为render函数：

```javascript
with(this){return _c('div',{attrs:{"id":"app4"}},[_c('button',{on:{"click":handleClick}},[_v("click")]),_v(" "),_c('transition',{attrs:{"name":"fade"}},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(show),expression:"show"}]},[_v("hello andy")])])],1)}
```
当执行

```javascript
_c('transition' , {attrs : {"name":"fade"}} , [_c('div' , ...)])
```
其实就会调用createElement函数创建vnode

```javascript
vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
```
所以模板从一开始会被编译成render函数，然后在调用render函数创建vnode。

当我们知道调用createElement函数来创建vnode，那么在Vue内部定义了一个Transition的对象，这个对象我们是怎么获取到的呢？因为我们也只是有一个transition的标签，怎么将这个标签和Vue内部定义的Transition对象联系起来呢？

通过调试，我们发现在_createElement函数中，有一个函数resolveAsset

```javascript
// options指的是vue配置选项
// type指的是
function resolveAsset (options,type,id,warnMissing) {
    if (typeof id !== 'string') {
        return
    }
    var assets = options[type];
    if (hasOwn(assets, id)) { return assets[id] }
    var camelizedId = camelize(id);
    if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
    var PascalCaseId = capitalize(camelizedId);
    if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
    var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
    if (warnMissing && !res) {
        warn(
            'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
            options
        );
    }
    return res
}
```
resolveAsset函数主要作用：

获取Vue实例上的资源，这里的资源主要指的是，组件，过滤器，指令等数据。比如我们定义的组件，定义的过滤器，定义的指令，也就是Vue中的components，filters，directives。

当我们获取到资源之后，就会调用createComponent函数来创建vnode。

我们来看一下transition组件是怎样的？

```javascript
var Transition = {
    // transition组件名字
    name: 'transition',
    // 组件的属性
    props: transitionProps,
    // 抽象组件的标记
    abstract: true,
    
    // 渲染函数，当创建transition组件时，会调用这个render函数
    render: function render (h) {
        var this$1 = this;
        
        // 获取transition组件的子元素
        var children = this.$slots.default;
        if (!children) {
            return
        }
        
        // 过滤掉文本节点
        children = children.filter(isNotTextNode);
        if (!children.length) {
            return
        }
        
        // warn multiple elements
        // 如果transition组件的子节点只能有一个，不能存在多个子节点
        if (children.length > 1) {
            warn(
            '<transition> can only be used on a single element. Use ' +
            '<transition-group> for lists.',
            this.$parent
            );
        }
        
        // 过渡模式，out-in，in-out
        var mode = this.mode;
        
        // 非法的过渡模式，过渡模式只能是out-in或者in-out
        if (mode && mode !== 'in-out' && mode !== 'out-in'
        ) {
            warn(
                'invalid <transition> mode: ' + mode,
                this.$parent
            );
        }
        
        // 获取子节点
        var rawChild = children[0];
        
        // if this is a component root node and the component's
        // parent container node also has transition, skip.
        if (hasParentTransition(this.$vnode)) {
            return rawChild
        }
        
        // 调用getRealChild方法，过滤掉keep-alive组件，获取到真正的子节点
        var child = getRealChild(rawChild);
        if (!child) {
            return rawChild
        }
        
        if (this._leaving) {
            return placeholder(h, rawChild)
        }
        
        // ensure a key that is unique to the vnode type and to this transition
        // component instance. This key will be used to remove pending leaving nodes
        // during entering.
        var id = "__transition-" + (this._uid) + "-";
        child.key = child.key == null
        ? child.isComment
        ? id + 'comment'
        : id + child.tag
        : isPrimitive(child.key)
        ? (String(child.key).indexOf(id) === 0 ? child.key : id + child.key)
        : child.key;
        
        // 获取transition组件上的props和listeners
        // 将数据保存在child.data.transition上，
        // 也就是说，将transition组件上的props和listeners数据保存在transition组件的子节点的data对象的transition属性上
        var data = (child.data || (child.data = {})).transition = extractTransitionData(this);
        var oldRawChild = this._vnode;
        var oldChild = getRealChild(oldRawChild);
        
        // mark v-show
        // so that the transition module can hand over the control to the directive
        
        // 如果transition组件的子组件存在v-show指令，那么child.data.show为true
        if (child.data.directives && child.data.directives.some(isVShowDirective)) {
        child.data.show = true;
        }
        
        // 对新旧 child 进行比较，并对部分钩子函数进行 hook merge 等操作
        if (
            oldChild &&
            oldChild.data &&
            !isSameChild(child, oldChild) &&
            !isAsyncPlaceholder(oldChild) &&
            // #6687 component root is a comment node
            !(oldChild.componentInstance && oldChild.componentInstance._vnode.isComment)
        ) {
           
            var oldData = oldChild.data.transition = extend({}, data);
            // handle transition mode
            if (mode === 'out-in') {
                // return placeholder node and queue update when leave finishes
                this._leaving = true;
                mergeVNodeHook(oldData, 'afterLeave', function () {
                this$1._leaving = false;
                this$1.$forceUpdate();
                });
                return placeholder(h, rawChild)
            } else if (mode === 'in-out') {
                if (isAsyncPlaceholder(child)) {
                    return oldRawChild
                }
                var delayedLeave;
                var performLeave = function () { delayedLeave(); };
                mergeVNodeHook(data, 'afterEnter', performLeave);
                mergeVNodeHook(data, 'enterCancelled', performLeave);
                mergeVNodeHook(oldData, 'delayLeave', function (leave) { delayedLeave = leave; });
            }
        }
        
        return rawChild
    }
};
```
<transition> 在 render阶段会获取节点上的数据、在不同的mode下绑定了对应的钩子函数以及其每个钩子需要用到的 data 数据、且同时也会返回了 rawChild vnode 节点。

### enter

```javascript
function _enter (_, vnode) {
    if (vnode.data.show !== true) {
        enter(vnode);
    }
}

var transition = inBrowser ? {
    create: _enter,
    activate: _enter,
    remove: function remove$$1 (vnode, rm) {
        if (vnode.data.show !== true) {
            leave(vnode, rm);
        } else {
            rm();
        }
    }
} : {};

var platformModules = [
    attrs,
    klass,
    events,
    domProps,
    style,
    transition
];
```
从上面代码中，我们可以看到，在create和activate的时候会执行enter函数，在remove的时候会执行leave函数。

```javascript
function enter (vnode, toggleDisplay) {
    var el = vnode.elm;
    
    // call leave callback now
    if (isDef(el._leaveCb)) {
      el._leaveCb.cancelled = true;
      el._leaveCb();
    }
    
    // 将transition组件的数据传递给resolveTransition函数，最后解析得到一个过渡需要的数据，保存在data中
    /** {
        enterActiveClass: "fade-enter-active"
        enterClass: "fade-enter"
        enterToClass: "fade-enter-to"
        leaveActiveClass: "fade-leave-active"
        leaveClass: "fade-leave"
        leaveToClass: "fade-leave-to"
        name: "fade"
    } */
    var data = resolveTransition(vnode.data.transition);
    if (isUndef(data)) {
        return
    }
    

    if (isDef(el._enterCb) || el.nodeType !== 1) {
        return
    }
    
    // 过渡样式类和过渡钩子
    var css = data.css;
    var type = data.type;
    var enterClass = data.enterClass;
    var enterToClass = data.enterToClass;
    var enterActiveClass = data.enterActiveClass;
    var appearClass = data.appearClass;
    var appearToClass = data.appearToClass;
    var appearActiveClass = data.appearActiveClass;
    var beforeEnter = data.beforeEnter;
    var enter = data.enter;
    var afterEnter = data.afterEnter;
    var enterCancelled = data.enterCancelled;
    var beforeAppear = data.beforeAppear;
    var appear = data.appear;
    var afterAppear = data.afterAppear;
    var appearCancelled = data.appearCancelled;
    var duration = data.duration;
    
    
    var context = activeInstance;
    var transitionNode = activeInstance.$vnode;
    while (transitionNode && transitionNode.parent) {
      context = transitionNode.context;
      transitionNode = transitionNode.parent;
    }
    
    // 判断是否为初始渲染的过渡
    var isAppear = !context._isMounted || !vnode.isRootInsert;
    
    if (isAppear && !appear && appear !== '') {
        return
    }
    
    // 获取相应的过渡样式类和过渡钩子函数
    var startClass = isAppear && appearClass
      ? appearClass
      : enterClass;
    var activeClass = isAppear && appearActiveClass
      ? appearActiveClass
      : enterActiveClass;
    var toClass = isAppear && appearToClass
      ? appearToClass
      : enterToClass;
    
    var beforeEnterHook = isAppear
      ? (beforeAppear || beforeEnter)
      : beforeEnter;
    var enterHook = isAppear
      ? (typeof appear === 'function' ? appear : enter)
      : enter;
    var afterEnterHook = isAppear
      ? (afterAppear || afterEnter)
      : afterEnter;
    var enterCancelledHook = isAppear
      ? (appearCancelled || enterCancelled)
      : enterCancelled;
    
    // 获取进场过渡动画的市场
    var explicitEnterDuration = toNumber(
      isObject(duration)
        ? duration.enter
        : duration
    );
    
    // 检查进场动画的时长是否有效
    if (explicitEnterDuration != null) {
      checkDuration(explicitEnterDuration, 'enter', vnode);
    }
    
    // 过渡动画是否受 css 影响，推荐对于仅使用 JavaScript 过渡的元素添加 v-bind:css="false"，Vue 会跳过 CSS 的检测。这也可以避免过渡过程中 CSS 的影响。
    var expectsCSS = css !== false && !isIE9;
    // 用户是否想介入控制 css 动画
    var userWantsControl = getHookArgumentsLength(enterHook);
    
    var cb = el._enterCb = once(function () {
        // 如果expectsCSS为false，那么表示用户设置了v-bind:css=false，
        // 这样Vue会跳过CSS的检测，其实就是将toClass和activeClass这两个类删除掉
        if (expectsCSS) {
            removeTransitionClass(el, toClass);
            removeTransitionClass(el, activeClass);
        }
        // 如果进场动画被取消了
        // 那么看过渡动画是否受css影响，如果expectsCSS为false，那么Vue会跳过CSS检测，其实就是把startClass这个类删除
        // 然后触发enter-cancelled钩子
        if (cb.cancelled) {
            if (expectsCSS) {
                removeTransitionClass(el, startClass);
            }
            enterCancelledHook && enterCancelledHook(el);
        } else {
            // 如果没有取消进场动画，那么就会触发after-enter钩子
            afterEnterHook && afterEnterHook(el);
        }
        el._enterCb = null;
    });
    
    if (!vnode.data.show) {
      mergeVNodeHook(vnode, 'insert', function () {
        var parent = el.parentNode;
        var pendingNode = parent && parent._pending && parent._pending[vnode.key];
        if (pendingNode &&
          pendingNode.tag === vnode.tag &&
          pendingNode.elm._leaveCb
        ) {
          pendingNode.elm._leaveCb();
        }
        enterHook && enterHook(el, cb);
      });
    }
    
    // 开始进场过渡
    beforeEnterHook && beforeEnterHook(el);
    if (expectsCSS) {
        // 添加过渡样式类
        addTransitionClass(el, startClass);
        addTransitionClass(el, activeClass);
        nextFrame(function () {
            // 在元素插入之后下一帧删除掉startClass
            removeTransitionClass(el, startClass);
            // 如果进场过渡没有被取消
            if (!cb.cancelled) {
                // 添加toClass类
                addTransitionClass(el, toClass);
                if (!userWantsControl) {
                    // 如果有设置过渡动画时长，那么在duration时间之后调用cb回调函数
                    // 否则，监听过渡动画结束事件，在结束时调用cb回调函数
                    if (isValidDuration(explicitEnterDuration)) {
                        setTimeout(cb, explicitEnterDuration);
                    } else {
                        whenTransitionEnds(el, type, cb);
                    }
                }
            }
        });
    }
    
    if (vnode.data.show) {
        toggleDisplay && toggleDisplay();
        enterHook && enterHook(el, cb);
    }
    
    if (!expectsCSS && !userWantsControl) {
        cb();
    }
}
```
### leave

leave函数会在remove的时候执行。

```javascript
function leave (vnode, rm) {
    var el = vnode.elm;

    // call enter callback now
    if (isDef(el._enterCb)) {
        el._enterCb.cancelled = true;
        el._enterCb();
    }
    
    // 将transition组件的数据传递给resolveTransition函数，最后解析得到一个过渡需要的数据，保存在data中
    /** {
        enterActiveClass: "fade-enter-active"
        enterClass: "fade-enter"
        enterToClass: "fade-enter-to"
        leaveActiveClass: "fade-leave-active"
        leaveClass: "fade-leave"
        leaveToClass: "fade-leave-to"
        name: "fade"
    } */
    var data = resolveTransition(vnode.data.transition);
    if (isUndef(data) || el.nodeType !== 1) {
        return rm()
    }

    if (isDef(el._leaveCb)) {
        return
    }
    
    // 获取过渡样式类和过渡钩子
    var css = data.css;
    var type = data.type;
    var leaveClass = data.leaveClass;
    var leaveToClass = data.leaveToClass;
    var leaveActiveClass = data.leaveActiveClass;
    var beforeLeave = data.beforeLeave;
    var leave = data.leave;
    var afterLeave = data.afterLeave;
    var leaveCancelled = data.leaveCancelled;
    var delayLeave = data.delayLeave;
    var duration = data.duration;
    
    // 过渡动画是否受 css 影响，推荐对于仅使用 JavaScript 过渡的元素添加 v-bind:css="false"，Vue 会跳过 CSS 的检测。这也可以避免过渡过程中 CSS 的影响。
    // 用户是否想介入控制 css 动画，我们可以在文档中看到，在enter钩子和leave钩子中的参数必须要传入一个回调函数done，而且必须调用done
    var expectsCSS = css !== false && !isIE9;
    var userWantsControl = getHookArgumentsLength(leave);
    
    // 获取过渡动画时长
    var explicitLeaveDuration = toNumber(
    isObject(duration)
        ? duration.leave
        : duration
    );

    if (isDef(explicitLeaveDuration)) {
        checkDuration(explicitLeaveDuration, 'leave', vnode);
    }
    
    // 回调函数，这个会在leave钩子调用的时候，作为参数传入到leave钩子函数中，也就是vue文档中提到的在enter和leave的钩子中，必须使用done进行回调
    var cb = el._leaveCb = once(function () {
        if (el.parentNode && el.parentNode._pending) {
            el.parentNode._pending[vnode.key] = null;
        }
        if (expectsCSS) {
            removeTransitionClass(el, leaveToClass);
            removeTransitionClass(el, leaveActiveClass);
        }
        if (cb.cancelled) {
            if (expectsCSS) {
                removeTransitionClass(el, leaveClass);
            }
            leaveCancelled && leaveCancelled(el);
        } else {
            rm();
            afterLeave && afterLeave(el);
        }
        el._leaveCb = null;
    });

    if (delayLeave) {
        delayLeave(performLeave);
    } else {
        performLeave();
    }

    function performLeave () {
    // the delayed leave may have already been cancelled
    if (cb.cancelled) {
        return
    }
    // record leaving element
    if (!vnode.data.show && el.parentNode) {
        (el.parentNode._pending || (el.parentNode._pending = {}))[(vnode.key)] = vnode;
    }
    // 离场过渡前调用beforeLeave钩子
    beforeLeave && beforeLeave(el);
    // 开始离场过渡动画
    if (expectsCSS) {
        // 添加离场过渡样式类
        addTransitionClass(el, leaveClass);
        addTransitionClass(el, leaveActiveClass);
        nextFrame(function () {
            // 在离开过渡动画生效时的下一帧删除leaveClass
            removeTransitionClass(el, leaveClass);
            if (!cb.cancelled) {
                // 在离开过渡动画生效时的下一帧添加leaveToClass
                addTransitionClass(el, leaveToClass);
                // 是否有人为控制css，估计一般用于钩子函数
                // 一般都没有人为的去控制css，那么离场过渡动画会在duration时间结束，或者会监听dom的transitionend或animationend事件，当该事件触发的时候，也就表示离场过渡动画结束
                if (!userWantsControl) {
                    if (isValidDuration(explicitLeaveDuration)) {
                    setTimeout(cb, explicitLeaveDuration);
                    } else {
                    whenTransitionEnds(el, type, cb);
                    }
                }
            }
        });
    }
    // 调用leave钩子
    leave && leave(el, cb);
    if (!expectsCSS && !userWantsControl) {
        cb();
    }
}
```
### 总结
- 1、transition组件是Vue内部的一个抽象组件。
- 2、transition组件的核心功能就是给渲染的组件提供进场和离场过渡动画效果。
- 3、Vue内部的Transition对象定义的属性会在创建vnode的时候将属性合并到options中。也就是在执行createComponent函数时（Ctor = baseCtor.extend(Ctor)）
- 4、创建transition组件的时候，会调用Transition对象中的render方法来进行渲染，返回transition组件的子节点。
- 5、当数据发生变化是，就会执行组件的更新函数，进行更新，此时就会触发transition组件的create，activate，remove这三个钩子函数，create，activate钩子会调用enter函数（进场过渡动画），而remove会调用leave函数（离场过渡动画）。