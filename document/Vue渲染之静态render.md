# Vue渲染之静态render
静态render主要是用来渲染那些不会改变的节点，也就是说，没有绑定动态数据的节点。所以不管你渲染多少次，这个静态render的执行结果都不会改变，所以静态render的作用就是当判断出某一个节点属于静态节点时，那么就会静态render方法来渲染，并将结果保存，下一次需要重新渲染的时候，如果该节点是静态节点，那么就直接从缓存中取出，而不需要重新渲染。

举个例子：

```html
<!-- 静态节点 没有绑定动态数据 -->
<div>
    <span>234</span>
</div>
<!-- 静态节点 -->
```
所以在编译节点，会判断是否存在静态节点，我们可以看到，div已经div下面的子节点都是静态的，那么表示div是一个静态根节点，当生成render函数的时候，就会生成静态render函数。生成的静态render函数保存在staticRenderFns中，staticRenderFns是一个数组，因为静态节点可能会有多个，所以需要保存多个静态render，渲染的时候，也就是遍历这个staticRenderFns中的所有静态render。
```javascript
state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
```
这里生成的静态render就是这样的

```javascript
with(this){return _m(0)}
```
_m函数指的就是renderStatic函数

```javascript
function renderStatic (index,isInFor) {
    // 先从缓存中取，如果缓存中有，那么直接返回tree
    var cached = this._staticTrees || (this._staticTrees = []);
    var tree = cached[index];
    if (tree && !isInFor) {
      return tree
    }
    
    // 缓存中没有，那么就调用对应的静态render，生成vnode节点
    tree = cached[index] = this.$options.staticRenderFns[index].call(
      this._renderProxy,
      null,
      this
    );
    // 标记静态节点
    markStatic(tree, ("__static__" + index), false);
    return tree
}

function markStatic (tree,key,isOnce) {
    if (Array.isArray(tree)) {
        for (var i = 0; i < tree.length; i++) {
            if (tree[i] && typeof tree[i] !== 'string') {
                markStaticNode(tree[i], (key + "_" + i), isOnce);
            }
        }
    } else {
        markStaticNode(tree, key, isOnce);
    }
}

function markStaticNode (node, key, isOnce) {
    node.isStatic = true;
    node.key = key;
    node.isOnce = isOnce;
}
```
当 Vue 检测到该 Vnode.isStatic=true，便不会比较这部分内容从而减少比对时间。