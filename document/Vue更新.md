# Vue更新
当我们修改Vue中的一个数据时，就会触发Vue组件的更新，而这个更新是异步的（通过Promise来实现）。更新过程主要就是对比新节点和旧节点过程，找出需要更新的地方进行更新。对比的方式是同层级的节点进行对比，得到变化，然后更新变化的视图。

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/vue/4.png)

在对比的过程中，如果两个节点被认为是同一个节点，那么会进行深度的比较，得到最小差异，否则直接删除旧的DOM节点，创建新的DOM节点。

## sameVNode方法
该方式是用来比较两个节点是否为同一个节点

```javascript
/*
    判断两个节点是否为同一个节点需要满足以下条件：
    1、节点的key相同
    2、节点的tag（当前节点的标签名）相同
    3、节点的isComment（是否为注释节点）相同
    4、节点的data是否同时有定义或者同时未定义
    5、如果两个节点是input，那么要判断input的type是否相同
*/
function sameVnode (a, b) {
    return (
        a.key === b.key && (
            (
                a.tag === b.tag &&
                a.isComment === b.isComment &&
                isDef(a.data) === isDef(b.data) &&
                sameInputType(a, b)
            ) || (
                isTrue(a.isAsyncPlaceholder) &&
                a.asyncFactory === b.asyncFactory &&
                isUndef(b.asyncFactory.error)
            )
        )
    )
}

/*
    判断当标签是<input>的时候，type的类型是否相同
*/
function sameInputType (a, b) {
    if (a.tag !== 'input') { return true }
    var i;
    // 获取两个input标签的type值
    var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
    var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
    return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
}
```
我们可以看到，只有当两个节点的key，tag，isComment相同，并且两个节点的data都同时有定义或者同时未定义，并且如果节点的标签名是input，那么还要判断input的type是否相同，当满足这些条件时，才能证明两个节点相同。

当两个节点相同时，就可以调用patchVnode方法，去对比同层级中的节点。

patchVnode方法主要做了以下几件事情：

- 1、如果新节点和旧节点都是静态节点，并且新旧节点的key相同，并且新节点是旧节点克隆出来的或者是新节点标记了v-once属性，那么就只要替换ele和componentInstance即可。
- 2、如果新节点和旧节点都存在子节点，那么就调用updateChildren方法，对子节点进行diff操作。
- 3、如果旧节点没有子节点而新节点有子节点，那么先清空旧节点的文本内容，然后为新节点插入子节点。
- 4、如果新节点没有子节点而旧节点有子节点，那么就移除旧节点的所有子节点。
- 5、如果新节点和旧节点都没有子节点，但是旧节点有文本内容，那么会清空旧节点的文本内容。
- 6、如果新节点和旧节点都没有子节点，但是新节点和旧节点都有文本内容，那么会替换文本内容。

```javascript
0: ƒ updateAttrs(oldVnode, vnode)
1: ƒ updateClass(oldVnode, vnode)
2: ƒ updateDOMListeners(oldVnode, vnode)
3: ƒ updateDOMProps(oldVnode, vnode)
4: ƒ updateStyle(oldVnode, vnode)
5: ƒ update(oldVnode, vnode)
6: ƒ updateDirectives(oldVnode, vnode)
```
## updateAttrs方法
该方法主要是更新节点的属性
```javascript
function updateAttrs (oldVnode, vnode) {
    var opts = vnode.componentOptions;
    if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
        return
    }
    // 如果旧的节点和新的节点都不存在任何属性，那么就直接返回，不用执行后面的更新操作
    if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
        return
    }
    var key, cur, old;
    var elm = vnode.elm;
    // 旧节点的属性
    var oldAttrs = oldVnode.data.attrs || {}; 
    // 新节点的属性
    var attrs = vnode.data.attrs || {};
    // clone observed objects, as the user probably wants to mutate it
    if (isDef(attrs.__ob__)) {
        attrs = vnode.data.attrs = extend({}, attrs);
    }
    // 遍历新节点的所有属性，如果新旧节点的属性值不同（有可能是重新修改属性，有可能是删除属性），那么就进行更新
    // 节点属性的更新主要是调用setAttribute和removeAttribute方法
    for (key in attrs) {
        cur = attrs[key];
        old = oldAttrs[key];
        if (old !== cur) {
            setAttr(elm, key, cur);
        }
    }
    // #4391: in IE9, setting type can reset value for input[type=radio]
    // #6666: IE/Edge forces progress value down to 1 before setting a max
    /* istanbul ignore if */
    // 兼容IE浏览器
    if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
        setAttr(elm, 'value', attrs.value);
    }
    // 遍历旧节点的所有属性
    for (key in oldAttrs) {
        if (isUndef(attrs[key])) {
            if (isXlink(key)) {
                elm.removeAttributeNS(xlinkNS, getXlinkProp(key));
            } else if (!isEnumeratedAttr(key)) {
                elm.removeAttribute(key);
            }
        }
    }
}
```
## updateClass方法
该方法用来更新节点的class属性

```javascript
function updateClass (oldVnode, vnode) {
    // 新节点的对应的标签元素
    var el = vnode.elm;
    // 新节点的数据
    var data = vnode.data;
    // 旧节点的数据
    var oldData = oldVnode.data;
    // 如果新节点或旧节点的数据中不存在class，那么就直接返回，不需要执行后面的更新操作
    if (
        isUndef(data.staticClass) &&
        isUndef(data.class) && (
        isUndef(oldData) || (
        isUndef(oldData.staticClass) &&
        isUndef(oldData.class)
        )
        )
    ) {
        return
    }
    
    // 为新节点生成新的class
    var cls = genClassForVnode(vnode);

    // 将transition的class合并到新节点的class上
    var transitionClass = el._transitionClasses;
    if (isDef(transitionClass)) {
        cls = concat(cls, stringifyClass(transitionClass));
    }
    
    // 设置class
    if (cls !== el._prevClass) {
        el.setAttribute('class', cls);
        // 当设置完之后，将当前的class重新赋值为prevClass
        el._prevClass = cls;
    }
}
```
## updateDOMListeners方法
该方法是用来更新节点的事件监听器
```javascript
function updateDOMListeners (oldVnode, vnode) {
    // 如果新节点和旧节点都不存在事件监听器，那么就直接返回，不用更新
    if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
        return
    }
    // 新节点的事件监听器
    var on = vnode.data.on || {};
    // 旧节点的事件监听器
    var oldOn = oldVnode.data.on || {};
    target$1 = vnode.elm;
    normalizeEvents(on);
    // 重新绑定事件监听器
    updateListeners(on, oldOn, add$1, remove$2, createOnceHandler$1, vnode.context);
    target$1 = undefined;
}
```
## updateDOMProps方法
该方法主要是更新DOM元素属性
```javascript
function updateDOMProps (oldVnode, vnode) {
    // 如果新节点和旧节点不存在DOM属性，那么就不需要更新，直接返回
    if (isUndef(oldVnode.data.domProps) && isUndef(vnode.data.domProps)) {
        return
    }
    var key, cur;
    var elm = vnode.elm;
    // 旧节点的DOM属性
    var oldProps = oldVnode.data.domProps || {};
    // 新节点的DOM属性
    var props = vnode.data.domProps || {};
    if (isDef(props.__ob__)) {
        props = vnode.data.domProps = extend({}, props);
    }
    // 遍历旧节点的DOM属性，如果新节点中不存在旧节点的DOM属性，那么就直接删除
    for (key in oldProps) {
        if (!(key in props)) {
            elm[key] = '';
        }
    }
    // 遍历新节点的DOM属性
    for (key in props) {
        // 新节点的DOM属性值
        cur = props[key];
        // 如果新节点存在textContext或者innerHTML属性，那么忽略新节点的子节点
        if (key === 'textContent' || key === 'innerHTML') {
            if (vnode.children) { vnode.children.length = 0; }
            if (cur === oldProps[key]) { continue }
            if (elm.childNodes.length === 1) {
                elm.removeChild(elm.childNodes[0]);
            }
        }
        // 如果是value属性
        if (key === 'value' && elm.tagName !== 'PROGRESS') {
            // store value as _value as well since
            // non-string values will be stringified
            elm._value = cur;
            // avoid resetting cursor position when value is the same
            var strCur = isUndef(cur) ? '' : String(cur);
            if (shouldUpdateValue(elm, strCur)) {
                elm.value = strCur;
            }
        } else if (key === 'innerHTML' && isSVG(elm.tagName) && isUndef(elm.innerHTML)) {
            // IE doesn't support innerHTML for SVG elements
            svgContainer = svgContainer || document.createElement('div');
            svgContainer.innerHTML = "<svg>" + cur + "</svg>";
            var svg = svgContainer.firstChild;
            while (elm.firstChild) {
                elm.removeChild(elm.firstChild);
            }
            while (svg.firstChild) {
                elm.appendChild(svg.firstChild);
            }
        } else if (
            cur !== oldProps[key]
        ) {
            // some property updates can throw
            // e.g. `value` on <progress> w/ non-finite value
            try {
                elm[key] = cur;
            } catch (e) {}
        }
    }
}
```
## updateStyle方法
该方法主要用来更新节点的style

```javascript
function updateStyle (oldVnode, vnode) {
    var data = vnode.data;
    var oldData = oldVnode.data;
    // 如果新旧节点不存在style，那么就直接返回，不用更新
    if (isUndef(data.staticStyle) && isUndef(data.style) &&
        isUndef(oldData.staticStyle) && isUndef(oldData.style)
    ) {
        return
    }
    
    var cur, name;
    var el = vnode.elm;
    // 旧节点的静态的style，比如: style="color : #fff";
    var oldStaticStyle = oldData.staticStyle;
    // 旧节点绑定的style，比如：:style
    var oldStyleBinding = oldData.normalizedStyle || oldData.style || {};
    
    // if static style exists, stylebinding already merged into it when doing normalizeStyleData
    var oldStyle = oldStaticStyle || oldStyleBinding;
    
    var style = normalizeStyleBinding(vnode.data.style) || {};
    
    // store normalized style under a different key for next diff
    // make sure to clone it if it's reactive, since the user likely wants
    // to mutate it.
    vnode.data.normalizedStyle = isDef(style.__ob__)
    ? extend({}, style)
    : style;
    
    var newStyle = getStyle(vnode, true);
    // 设置新节点的style
    for (name in oldStyle) {
        if (isUndef(newStyle[name])) {
            setProp(el, name, '');
        }
    }
    for (name in newStyle) {
        cur = newStyle[name];
        if (cur !== oldStyle[name]) {
            // ie9 setting to null has no effect, must use empty string
            setProp(el, name, cur == null ? '' : cur);
        }
    }
}
```
