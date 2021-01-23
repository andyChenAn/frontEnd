# Vue插槽原理
我们通过一个简单的例子来了解下Vue插槽内部原理是怎样的？

我们需要关注两个问题，一个是插槽内容是怎么解析的？另外一个就是插槽内容是怎么插入到组件当中的。

```html
<div>
    <test>hello , {{name}}</test>
</div>
```

```javascript
const vm = new Vue({
    el : '#app',
    data : {
        name : 'andy'
    },
    components : {
        test : {
            template : '<div><slot /></div>',
        }
    }
});
```

### 怎么解析插槽内容？

当父组件渲染函数执行时，绑定的作用域是父组件的实例，所以在执行渲染函数的时候，this.name其实是获取父组件上绑定的name值。
```javascript
// 这个是父组件的渲染函数
with(this){
    return 
    _c('div',{attrs:{"id":"app"}},
    [
        _c('test',[_v("hello "+_s(name))])
    ],1)
}
```

```javascript
// 这个是子组件的渲染函数
with(this){return _c('div',[_t("default")],2)}
```
这个渲染函数是解析test组件生成的渲染函数。

这里讲一下为什么会出现两个渲染函数？一个数父组件的渲染函数，一个是父组件里面的子组件的渲染函数。

这里我们需要讲一下，Vue的大概渲染流程：
- 1、首先会进行模板编译，生成render函数，在编译阶段，如果存在slot节点，那么会将slot转为_t函数，所以我们会看到最后的render函数中会存在 _t函数。
- 2、执行render函数，创建vnode虚拟DOM
- 3、调用patch函数进行更新，因为一开始的时候是首次渲染，那么就会直接调用createElm函数来进行初始化渲染，createElm函数内部主要做了以下几件事情：
  - 3.1、调用createComponent函数来创建组件，这里又会重新调用componentVNodeHooks中中init方法来进行初始化组件，这里又会重新走一遍new Vue的流程，所以在_init方法中，会判断该实例是否为一个组件，如果是组件的话，那么会调用initInternalComponent函数，而在这个函数里面就会把这个组件的外壳节点(test节点)中保存的数据又重新保存到子组件中，其中就包括属性，事件监听器，子元素等。然后又会编译test组件的模板(template)，所以又会生成一个render函数，那么这个render函数就是子组件的render函数。
  - 3.2、调用createChildren来创建子元素，如果存在子元素，那么会递归遍历并创建子元素，创建子元素也是调用createElm函数，这样又会回到第一步。
  - 3.3、如果子元素就是一个文本元素，那么就会直接创建一个文本元素，并插入到文本元素的父元素上。
  - 3.4、就是通过这种递归遍历所有子元素的方式，最终将一个组件中的所有的节点都渲染到页面上了。

### 插槽内容怎么插入到子组件中？

当父渲染函数执行完成之后，会生成一个父组件的vnode：里面包含了所有DOM的信息：

```javascript
{
    tag : "div",
    data: { 
        attrs : {id : '#app'}
    },
    children : [
        tag : "vue-component-1-test",
        componentOptions : {
            children : [
                {
                    text : 'hello andy'
                    // ...省略
                }
            ],
            listeners : undefined,
            propsData : undefined,
            tag : 'test'
        }
    ]
}
```
上面的父组件渲染函数执行后，就会得到一个类似于上面的vnode（简化过的vnode），通过vnode我们可以了解到，test组件（外壳节点）保存了父组件传递给子组件的数据，包括children，listeners事件回调，propsData等。

当父组件渲染完之后，发现test组件是一个自定义的组件，那么又会去解析这个组件。在解析test组件时，会调用Vue.prototype._init方法初始化组件。

```javascript
Vue.prototype._init = function (options) {
    // 如果是一个组件，那么就会调用initInternalComponent函数
    if (options && options._isComponent) {
        initInternalComponent(vm, options);
    } else {
        vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor),options || {},vm);
    }
    initRender(vm);
};
```
initInternalComponent函数的作用就是将test外壳节点的中保存的父组件传递给子组件的数据保存到子组件的$options中。这其中就包括将父组件中的子节点保存在子组件的$options对象的_renderChildren上。

```javascript
function initInternalComponent (vm, options) {
    var opts = vm.$options = Object.create(vm.constructor.options);
    var parentVnode = options._parentVnode;
    opts.parent = options.parent;
    opts._parentVnode = parentVnode;
    
    // 将test外壳节点保存的数据，重新赋值到vm.$options上
    var vnodeComponentOptions = parentVnode.componentOptions;
    opts.propsData = vnodeComponentOptions.propsData;
    opts._parentListeners = vnodeComponentOptions.listeners;
    opts._renderChildren = vnodeComponentOptions.children;
    opts._componentTag = vnodeComponentOptions.tag;
    
    if (options.render) {
      opts.render = options.render;
      opts.staticRenderFns = options.staticRenderFns;
    }
}
```
上面代码中，当初始化子组件时，就是将外壳节点中的数据移植到子组件的$options上，这样就完成了将父组件的数据传递给子组件的转移过程。所以我们发现，test外壳节点只是一个缓存父组件传递给子组件的数据的作用。

而当我们调用initRender函数时，会把保存在组件选项的_renderChildren保存在实例的$slots上。

```javascript
function initRender (vm) {
    // ...省略
    var options = vm.$options;
    // 获取子组件的父组件
    var parentVnode = vm.$vnode = options._parentVnode;
    // 获取父组件的执行上下文
    var renderContext = parentVnode && parentVnode.context;
    
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
    vm.$scopedSlots = emptyObject;
    
    vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
    vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };
    
    // ...省略
}
```

```javascript
// children：表示父组件的子节点
// context：表示父组件的执行上下文
function resolveSlots (children,context) {
    if (!children || !children.length) {
        return {}
    }
    var slots = {};
    for (var i = 0, l = children.length; i < l; i++) {
        var child = children[i];
        var data = child.data;
        // 如果节点被当做是一个插槽节点，那么就把节点上的slot属性删除掉
        if (data && data.attrs && data.attrs.slot) {
            delete data.attrs.slot;
        }
        // 如果是具名插槽
        if ((child.context === context || child.fnContext === context) && data && data.slot != null
        ) {
            var name = data.slot;
            var slot = (slots[name] || (slots[name] = []));
            if (child.tag === 'template') {
                slot.push.apply(slot, child.children || []);
            } else {
                slot.push(child);
            }
        } else {
            // 如果是匿名插槽
            (slots.default || (slots.default = [])).push(child);
        }
    }
    // 忽略注释节点，空文本节点
    for (var name$1 in slots) {
        if (slots[name$1].every(isWhitespace)) {
            delete slots[name$1];
        }
    }
    return slots
}
```
通过上面的方式，我们就把插槽节点保存在vm.$slots中。

举个例子：

```javascript
<div id="app">
    <test>
        hello {{name}}
        <div slot="aa">{{name}}</div>
    </test>
</div>
```

如果是匿名插槽，那么就会保存在slots.default中。

```javascript
{
    default : [vnode]
}
```

如果是具名插槽，那么就会拿到插槽的名字name，然后保存在slots[name]中。

```javascript
{
    aa : [vnode]
}
```
最终vm.$slots的结果为：

```
{
    default : [vnode],
    aa : [vnode]
}
```
当子组件完成初始化之后，会将子组件的模板编译成渲染函数：

```javascript
with(this){return _c('div',[_t("default")],2)}
```

当我们调用 "_t('default')"的时候，其实调用的是renderSlot('default'):

```javascript
// 这里的props指的就是作用域插槽中子组件的数据通过属性(slotProps)的方式传递给父组件（<slot :slotProps="slotProps"></slot>）
function renderSlot (name,fallback,props,bindObject) {
    // 作用域插槽
    var scopedSlotFn = this.$scopedSlots[name];
    var nodes;
    // 如果是作用域插槽，或者vue2.6版本以上的v-slot语法（统一了作用域插槽和普通插槽的语法）
    if (scopedSlotFn) { // scoped slot
        props = props || {};
        if (bindObject) {
            if (!isObject(bindObject)) {
                warn(
                    'slot v-bind without argument expects an Object',
                    this
                );
            }
            props = extend(extend({}, bindObject), props);
        }
        nodes = scopedSlotFn(props) || fallback;
    } else {
        // 普通插槽，直接从$slots中，取出插槽内容
        nodes = this.$slots[name] || fallback;
    }
    
    var target = props && props.slot;
    if (target) {
        return this.$createElement('template', { slot: target }, nodes)
    } else {
        return nodes
    }
}
```
通过调用这个方法，就能获取到插槽内容了，当获取到插槽内容，再调用_c函数

```javascript
_c('div',['hello andy'],2)
```
这样我们就把slot插入到子组件中了，接下来就是将组件渲染成真是DOM。

**这里我们需要注意一点，调用renderSlot方法，内部会对普通插槽和作用域插槽做不同的处理了，如果是作用域插槽或者新的v-slot插槽语法，那么就会调用scopedSlotFn方法，如果是旧的插槽语法，那么就直接通过插槽名称从this.$slots中取出相应的插槽内容，作用域插槽或者新的v-slot语法的插槽存放在this.$scopedSlots中，旧的插槽语法的普通插槽存放在this.$slots中**

- 1、vue2.6版本以上的作用域插槽和普通插槽都统一了插槽语法
如果我们使用的是v-slot语法，那么不管是作用域插槽还是普通插槽，都会调用scopedSlotFn方法，这个方法其实就是normalizeScopedSlot方法内部中的normalize函数
```javascript
function normalizeScopedSlot(normalSlots, key, fn) {
    var normalized = function () {
      // fn其实就是render函数中的渲染子元素的方法
      // 类似于{scopedSlots:_u([{key:"header",fn:function(){return [_c('div',[_v("header")]),_v(" "),_c('div',[_v("1111")])]}
      // 调用fn，就会返回所有的子节点，并返回
      var res = arguments.length ? fn.apply(null, arguments) : fn({});
      res = res && typeof res === 'object' && !Array.isArray(res)
        ? [res] // single vnode
        : normalizeChildren(res);
      return res && (
        res.length === 0 ||
        (res.length === 1 && res[0].isComment) // #9658
      ) ? undefined
        : res
    };
    // 定义属性
    if (fn.proxy) {
      Object.defineProperty(normalSlots, key, {
        get: normalized,
        enumerable: true,
        configurable: true
      });
    }
    return normalized
}
```

### 总结

- 1、解析父组件，将父组件的插槽保存在子组件的外壳节点的children中。
- 2、将外壳节点的children转移到子组件的选项对象的_renderChildren属性上。
- 3、将子组件的选项对象的_renderChildren属性转移到子组件实例的$slots上。
- 4、解析子组件，会将子组件内部的<slot>标签转为_t函数，执行_t函数，获取对应的插槽内容。

### 插槽编译源码：

```javascript
function processSlotContent (el) {
    // 获取插槽的作用域，如果是之前的方式，那么会发出警告
    // 这里主要是获取scope，slot-scope属性
    /*
        1、如果存在scope，那么表示用的是之前的作用域插槽方式，那么会报警告
        2、后来的作用域插槽我们都是使用slot-scope属性来表示，并不会使用scope
        3、插槽作用域保存在el.slotScope上
    */
    var slotScope;
    if (el.tag === 'template') {
      slotScope = getAndRemoveAttr(el, 'scope');
      /* istanbul ignore if */
      if (slotScope) {
        warn$2(
          "the \"scope\" attribute for scoped slots have been deprecated and " +
          "replaced by \"slot-scope\" since 2.5. The new \"slot-scope\" attribute " +
          "can also be used on plain elements in addition to <template> to " +
          "denote scoped slots.",
          el.rawAttrsMap['scope'],
          true
        );
      }
      el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope');
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
      /* istanbul ignore if */
      if (el.attrsMap['v-for']) {
        warn$2(
          "Ambiguous combined usage of slot-scope and v-for on <" + (el.tag) + "> " +
          "(v-for takes higher priority). Use a wrapper <template> for the " +
          "scoped slot to make it clearer.",
          el.rawAttrsMap['slot-scope'],
          true
        );
      }
      el.slotScope = slotScope;
    }

    // 处理slot="xxx"的情况
    /*
        1、获取slot属性值
        2、如果slotTarget存在，如果slotTarget是""，那么默认就是"default"
        3、获取动态绑定的slot属性值
        4、如果解析的是这种：<div slot="footer">footer</div>，那么就将处理后的slot添加到el.attrs数组中
        el.attrs：[
            {
                dynamic: undefined
                end: 159
                name: "slot"
                start: 146
                value: ""footer""
            }
        ]
    */
    var slotTarget = getBindingAttr(el, 'slot');
    if (slotTarget) {
      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
      el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot']);
      // preserve slot as an attribute for native shadow DOM compat
      // only for non-scoped slots.
      if (el.tag !== 'template' && !el.slotScope) {
        // getRawBindingAttr方法获取的就是从el.rawAttrsMap中保存的原始的解析slot的数据，格式为：
        /*
            {
                slot : {
                    end: 159
                    name: "slot"
                    start: 146
                    value: "footer"
                },
                class : {
                    end: 170
                    name: "class"
                    start: 160
                    value: "aa"
                }
            }
        */
        addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'));
      }
    }

    // 2.6 v-slot syntax
    // 这个是vue2.6版本新增的插槽语法
    /**
        1、首先是判断插槽的用法是否非法，主要存在两种非法的情况
        第一种是插槽的新语法和旧语法不能在同一个标签中混用
        第二种是插槽只能出现在组件内部的根目录级别上
    */ 
    {
      if (el.tag === 'template') {
        // v-slot on <template>
        // 针对<template v-slot:xxx></template>这种语法
        // 获取绑定的slot，获取的值为：
        /*
            {
                end: 65
                name: "v-slot:header"
                start: 49
                value: ""
            }
        */
        var slotBinding = getAndRemoveAttrByRegex(el, slotRE);
        if (slotBinding) {
          {
            // 如果存在slot的旧的语法，那么就会报警告，不允许在同一个标签中新语法v-slot和旧语法slot混用
            if (el.slotTarget || el.slotScope) {
              warn$2(
                "Unexpected mixed usage of different slot syntaxes.",
                el
              );
            }
            // 如果存在父节点，如果父节点不是一个组件，那么就会报警告
            // <template v-slot>只能出现在组件内部的根目录
            if (el.parent && !maybeComponent(el.parent)) {
              warn$2(
                "<template v-slot> can only appear at the root level inside " +
                "the receiving component",
                el
              );
            }
          }
          // 获取插槽名称，可能是静态的插槽，也可能是动态绑定的插槽
          var ref = getSlotName(slotBinding);
          var name = ref.name;
          var dynamic = ref.dynamic;
          el.slotTarget = name;
          el.slotTargetDynamic = dynamic;
          el.slotScope = slotBinding.value || emptySlotScopeToken; // force it into a scoped slot for perf
        }
      } else {
        // v-slot on component, denotes default slot
        // 当被提供的内容只有默认插槽时，组件的标签才可以被当作插槽的模板来使用
        
        // 获取绑定的slot
        /*
            判断：
            1、如果v-slot不是在组件的标签上，那么就报警告，v-slot只能用在component或者<template>上
            2、如果存在slot的旧的语法，那么就会报警告，不允许在同一个标签中新语法v-slot和旧语法slot混用
            3、当存在其他具名插槽时，为避免作用域模糊，默认插槽也应使用<template>语法
        */
        var slotBinding$1 = getAndRemoveAttrByRegex(el, slotRE);
        if (slotBinding$1) {
          {
            if (!maybeComponent(el)) {
              warn$2(
                "v-slot can only be used on components or <template>.",
                slotBinding$1
              );
            }
            if (el.slotScope || el.slotTarget) {
              warn$2(
                "Unexpected mixed usage of different slot syntaxes.",
                el
              );
            }
            if (el.scopedSlots) {
              warn$2(
                "To avoid scope ambiguity, the default slot should also use " +
                "<template> syntax when there are other named slots.",
                slotBinding$1
              );
            }
          }
          // add the component's children to its default slot
          // 将组件的children子节点添加到默认插槽中
          var slots = el.scopedSlots || (el.scopedSlots = {});
          var ref$1 = getSlotName(slotBinding$1);
          var name$1 = ref$1.name;
          var dynamic$1 = ref$1.dynamic;
          // 创建一个存放组件的子节点的插槽容器，标签为template
          var slotContainer = slots[name$1] = createASTElement('template', [], el);
          slotContainer.slotTarget = name$1;
          slotContainer.slotTargetDynamic = dynamic$1;
          slotContainer.children = el.children.filter(function (c) {
            if (!c.slotScope) {
              c.parent = slotContainer;
              return true
            }
          });
          // 插槽容器的插槽作用域
          slotContainer.slotScope = slotBinding$1.value || emptySlotScopeToken;
          // remove children as they are returned from scopedSlots now
          el.children = [];
          // 标记el为非普通格式，以便生成数据
          el.plain = false;
        }
      }
    }
}
```