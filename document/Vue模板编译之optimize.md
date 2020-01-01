# Vue编译模板之optimize
当template模板通过调用parse方法之后，会得到一个ast，然后会调用optimize方法进行优化。

### optimize的作用是什么？

遍历生成的模板AST树，检测纯静态的子树，即永远不需要更改的DOM。
一旦我们检测到这些子树，我们可以:

- 1、把它们变成常数，这样我们就不需要了在每次重新渲染时为它们创建新的节点
- 2、在修补过程中完全跳过它们。

所以我们会发现，optimize方法内部会遍历这颗AST树，如果这棵树的一个节点属于静态的，那么就会给这个节点设置一个static属性，并设置值为true。

```javascript
el.static = true;
```

### 如何判断一个节点是一个静态节点呢？

Vue主要是通过isStatic函数来判断

```javascript
node.static = isStatic(node);
```

那isStatic函数主要做了以下几件事情：

- 1、判断节点的type属性值，如果为2，那么表示节点是一个表达式节点，会返回false，表示这个节点不是一个静态节点。如果为3，那么表示节点是一个纯文本节点，会返回true，表示这个节点是一个静态节点。
- 2、如果节点的type属性值为1，那么表示该节点是一个普通节点，那么就会继续判断：
  - 1、如果该节点设置了v-pre指令，表示节点不用解析，那么会返回true，表示是一个静态节点。
  - 2、如果该节点没有设置动态绑定，那么会返回true，并且该节点没有v-if、v-for、v-else指令，那么会返回true，并且该节点的名称不是slot或者component，那么会返回true（slot或者component都是需要动态编译的），并且该节点的标签名属于一个正常的HTML标签，并且该节点的父辈以上的节点不能是template标签或者不能带有v-for指令，并且该节点的所有属性都是在type,tag,attrsList,attrsMap,plain,parent,children,attrs属性范围内，都是静态属性，同时满足上面的条件，那么说明这个节点是一个静态节点。

```javascript
function isStatic (node) {
    if (node.type === 2) { // expression
        return false
    }
    if (node.type === 3) { // text
        return true
    }
    // 如果设置了v-pre指令，那么表示不用解析
    // 如果节点没有设置动态绑定，会返回true
    // 如果节点没有v-if,v-for,v-else指令，会返回true
    // 如果节点不是slot，component，那么会返回true
    // 如果节点是一个正常的html标签，那么会返回true
    // 并且节点的父辈以上的节点不能是template标签或者不能带有v-for指令，那么会返回true
    // 如果节点的所有属性都是在type,tag,attrsList,attrsMap,plain,parent,children,attrs属性范围内，都是静态属性，那么会返回true
    return !!(node.pre || (
    !node.hasBindings && 
    !node.if && !node.for && // not v-if or v-for or v-else
    !isBuiltInTag(node.tag) && // not a built-in
    isPlatformReservedTag(node.tag) && // not a component
    !isDirectChildOfTemplateFor(node) &&
    Object.keys(node).every(isStaticKey)
    ))
}
```

#### optimize函数

```javascript
function optimize (root, options) {
    if (!root) {
        return 
    }
    // 调用genStaticKeysCached函数，生成用于判断节点是否存在静态属性的函数isStaticKey。
    isStaticKey = genStaticKeysCached(options.staticKeys || '');
    // 当前节点是否是正常的html标签
    isPlatformReservedTag = options.isReservedTag || no;
    
    markStatic$1(root);
    markStaticRoots(root, false);
}
```

##### genStaticKeysCached函数、cached函数、genStaticKeys$1函数

我们首先看一下genStaticKeysCached函数是怎么来的？

```javascript
var genStaticKeysCached = cached(genStaticKeys$1);
```
genStaticKeysCached函数其实就是调用cached函数的返回结果。


然后我们来看一下genStaticKeys$1函数：

```javascript
function genStaticKeys$1 (keys) {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
    (keys ? ',' + keys : '')
  )
}
```
这个genStaticKeys$1函数的作用就是通过调用makeMap函数，创建一个包含type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap以及"keys"的映射表，并且设置这些属性的值为true，所以最终genStaticKeys$1函数类似是这样的：

```javascript
var map = {
    type : true,
    tag : true,
    attrsList : true,
    plain : true,
    staticStyle : true,
    staticClass : true,
    // ...省略
};
function genStaticKeys$1 () {
    return function (val) {
        return map[val];
    }
}
```

最后我们看一下cached函数：

```javascript
function cached (fn) {
    // 一个缓存对象
    var cache = Object.create(null);
    return (function cachedFn (str) {
        var hit = cache[str];
        return hit || (cache[str] = fn(str))
    })
}
```
cached函数的作用是，创建一个缓存对象，然后从缓存中取str，如果没有，那么就会调用genStaticKeys$1函数，并将调用genStaticKeys$1函数的结果赋值给cache对应的属性。所以调用cached函数之后返回的结果为：

```javascript
var map = {
    type : true,
    tag : true,
    attrsList : true,
    plain : true,
    staticStyle : true,
    staticClass : true,
    // ...省略
};
var genStaticKeysCached = function cachedFn (str) {
    var hit = cache[str];
    return hit || (cache[str] = function (val) {
        return map[val];
    })
}
```

所以调用完genStaticKeysCached之后得到的结果一下：

```javascript
var isStaticKey = function (val) {
    return map[val];
};
//或者
var isStaticKey = hit;
```