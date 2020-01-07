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
    !node.if && !node.for && 
    !isBuiltInTag(node.tag) &&
    isPlatformReservedTag(node.tag) &&
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
### markStatic$1函数

markStatic$1函数主要做了以下几件事情：
- 1、调用isStatic函数，判断当前节点是否为静态节点。
- 2、遍历节点的所有子节点，如果子节点不是静态的，那么父节点也不是静态的。

```javascript
function markStatic$1 (node) {
    // 调用isStatic函数，判断当前节点是否为静态节点
    node.static = isStatic(node);
    // 如果是正常的html标签或者自定义标签(组件)
    if (node.type === 1) {
      // 如果是组件，并不是html标签，那么不要将组件插槽内容设置为静态
      // 这样就避免了组件无法更改插槽节点，静态插槽内容无法热加载
      // 所以如果是一个组件，那么就会直接return
      // 节点是正常的html标签
      // 节点的标签是slot
      // 节点存在inline-template属性
      // 满足这三个条件中的一个就会往下走，继续进行处理
        if (
            !isPlatformReservedTag(node.tag) &&
            node.tag !== 'slot' &&
            node.attrsMap['inline-template'] == null
        ) {
            return
        }
        // 遍历节点的所有子节点，调用MarkStatic$1函数，标记子节点是否为静态节点
        // 如果子节点不是静态节点，那么父节点也不是静态节点
        for (var i = 0, l = node.children.length; i < l; i++) {
            var child = node.children[i];
            markStatic$1(child);
            if (!child.static) {
                node.static = false;
            }
        }
        // 如果节点存在v-if/v-else-if/v-else指令，那么就遍历节点的ifConditions属性，该属性保存了v-if/v-else-if/v-else节点，然后调用markStatic$1函数，继续遍历if条件中的每一个节点中的所有的子节点
        // 如果子节点不是静态的，那么父节点node也不是静态的
        if (node.ifConditions) {
            for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
                var block = node.ifConditions[i$1].block;
                markStatic$1(block);
                if (!block.static) {
                    node.static = false;
                }
            }
        }
    }
}
```
### markStaticRoots函数

markStaticRoots函数主要作用就是标记静态根节点。这里说的根节点指的是只要存在子节点，我们就可以把他理解成一个根节点，应该是算是一个区域根节点。如果找到一个根节点是静态根节点后，那么就不会再继续往下面递归查找了，直接return了。

```javascript
function markStaticRoots (node, isInFor) {
    if (node.type === 1) {
        if (node.static || node.once) {
            node.staticInFor = isInFor;
        }
        // 判断根静态是静态的条件是：该节点是静态的，并且存在子节点，并且子节点不仅仅只是一个文本节点
        // 如果满足条件，那么就标记这个节点为静态根节点，否则为false，不是静态根节点
        // 如果找到一个根节点是静态根节点后，那么就不会再继续往下面递归查找了，直接return了
        if (node.static && node.children.length && !(
            node.children.length === 1 &&
            node.children[0].type === 3
        )) {
            node.staticRoot = true;
            return
        } else {
            node.staticRoot = false;
        }
        // 如果存在子节点，遍历子节点，查找谁是静态根节点，如果是的话，就设置staticRoot为true
        if (node.children) {
            for (var i = 0, l = node.children.length; i < l; i++) {
                markStaticRoots(node.children[i], isInFor || !!node.for);
            }
        }
        if (node.ifConditions) {
            for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
                markStaticRoots(node.ifConditions[i$1].block, isInFor);
            }
        }
    }
}
```
我们会发现，markStatic$1函数的作用是递归遍历每一个节点，判断节点是否为静态节点，如果是静态节点，那么标记该节点（设置该节点的static属性为true）。markStaticRoots函数的作用是遍历经过判断是否为静态节点处理后的所有节点，如果节点是静态的，并且存在子节点而且子节点不仅仅是一个文本节点，那么就表示这个节点为静态根节点。

也就是说，markStatic$1是为markStaticRoots服务的。只有先判断所有节点是否为静态节点之后，才能更快的找出静态根节点，一旦找到静态根节点，就不会往下继续递归遍历子节点了。