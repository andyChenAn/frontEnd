# Vue模板编译之generate的节点拼接
generate主要的作用就是生成字符串形式的渲染函数。在生成字符串的过程中，会拼接节点，拼接数据，绑定事件，最终返回一个包含渲染函数和静态渲染函数的对象，我们先看个简单的例子，调用generate函数后，会返回什么样子的字符串：

```html
<div id="app">
    <div :name="name" id="box">{{age}}</div>
</div>
```
```javascript
new Vue({
    el : '#app',
    data : {
        name : 'andy',
        age : 12
    },
});
```
生成的字符串形式的渲染函数为：

```javascript
_c(
    // 标签名
    'div',
    // 数据
    {
        attrs:{"id":"app"}
    },
    // 子节点
    [_c(
        'div',
        {
            attrs:{"name":name,"id":"box"}
        },
        [_v(_s(age))]
    )]
)
```
然后通过调用new Function(上面的字符串)，转成可以执行的函数。最后生成vnode。

我们来看一下generate函数：

```javascript
function generate (ast,options) {
    var state = new CodegenState(options);
    var code = ast ? genElement(ast, state) : '_c("div")';
    return {
        // 通过with来绑定执行上下文
        render: ("with(this){return " + code + "}"),
        staticRenderFns: state.staticRenderFns
    }
}
```
### CodegenState构造函数

```javascript
var CodegenState = function CodegenState (options) {
    this.options = options;
    this.warn = options.warn || baseWarn;
    this.transforms = pluckModuleFunction(options.modules, 'transformCode');
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
    this.directives = extend(extend({}, baseDirectives), options.directives);
    var isReservedTag = options.isReservedTag || no;
    this.maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); };
    this.onceId = 0;
    this.staticRenderFns = [];
    this.pre = false;
    console.log(this , options)
};
```
这个构造函数主要用于初始化实例的编译状态。代码中，其实也就是给实例添加了一个属性。

#### dataGenFns属性
这个属性是一个数组，保存了两个函数。这两个函数是：genData$1和genData
```javascript
function genData$1 (el) {
    var data = '';
    if (el.staticStyle) {
        data += "staticStyle:" + (el.staticStyle) + ",";
    }
    if (el.styleBinding) {
        data += "style:(" + (el.styleBinding) + "),";
    }
    return data
}
```
```javascript
function genData (el) {
var data = '';
    if (el.staticClass) {
        data += "staticClass:" + (el.staticClass) + ",";
    }
    if (el.classBinding) {
        data += "class:" + (el.classBinding) + ",";
    }
    return data
}
```
这两个函数主要是用来处理绑定的style和静态的style，以及绑定的class和静态的class。

#### directives属性
这个属性是一个对象，里面保存了Vue自有指令的处理函数

```javascript
{
    bind: function bind$1(el, dir) {}
    cloak: function noop(a, b, c) {}
    html: function html(el, dir) {}
    model: function model( el, dir, _warn ) {}
    on: function on(el, dir) {}
    text: function text(el, dir) {}
}
```
- v-bind：绑定属性
- v-on： 绑定事件
- v-html：插入html
- v-text：插入文本
- v-model：双向绑定
- v-cloak：隐藏未编译的 Mustache 标签直到实例准备完毕

#### staticRenderFns属性
这个属性是一个数组，里面保存了静态根节点的render函数，每个Vue实例都有这个属性，如果不存在静态根节点，那么这个属性就是一个空数组。

### 拼接节点
我们知道，一个Vue应用中，会有很多种不同类型的节点，比如：静态节点，v-if节点，v-for节点，slot节点，组件节点，子节点等。那我们就会对这些节点进行拼接，而拼接的工作就交给了genElement函数来处理。

```javascript
function genElement (el, state) {
    if (el.staticRoot && !el.staticProcessed) {
        // 静态根节点拼接处理
        return genStatic(el, state)
    } else if (el.once && !el.onceProcessed) {
        // v-once节点拼接处理
        return genOnce(el, state)
    } else if (el.for && !el.forProcessed) {
        // v-for节点拼接处理
        return genFor(el, state)
    } else if (el.if && !el.ifProcessed) {
        // v-if节点拼接处理
        return genIf(el, state)
    } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
        // 子节点拼接处理
        return genChildren(el, state) || 'void 0'
    } else if (el.tag === 'slot') {
        // slot节点拼接处理
        return genSlot(el, state)
    } else {
        // component or element
        // is绑定的组件节点拼接处理
        var code;
        if (el.component) {
            code = genComponent(el.component, el, state);
        } else {
            // 以上拼接处理之外，主要是处理自定义的组件和普通标签
            var data;
            
            // el.plain为true，表示不存在属性，也就是说，如果节点不存在任何属性的话，就不会调用genData$2函数，处理data属性。
            // 如果存在属性，那么就会处理属性，将拼接后的data返回
            if (!el.plain || (el.pre && state.maybeComponent(el))) {
                data = genData$2(el, state);
            }
            
            // 处理完父节点，遍历处理所有子节点
            var children = el.inlineTemplate ? null : genChildren(el, state, true);
            // 拼接渲染函数
            code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
        }
        // 返回渲染函数字符串
        return code
    }
}
```
我们看到上面代码中，都会存在一个xxxProcessed属性，这个属性表示已经进行过某个拼接处理了。

#### 静态根节点拼接处理

```javascript
function genStatic (el, state) {
    // 将staticProcessed设置为true，表示静态根节点拼接已经处理了
    el.staticProcessed = true;
    // 将静态渲染函数字符串添加到staticRenderFns数组中
    state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
    // 返回一个"_m(0)",表示第一个静态渲染函数
    return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
}
```
举个例子：

```html
<div>
    <span>andy</span>
</div>
```
上面是一个静态根节点，所以会调用genStatic函数来拼接静态根节点渲染函数。我们发现，在genStatic函数内部又会调用genElement函数，而此时的el.staticProcessed被设置为true，所以el.staticRoot && !el.staticProcessed为false，不会再走之前的流程，而是直接走到最后的流程，也就是处理data数据以及子节点，最后返回一个拼接完的字符串。以下就是最后走的流程：

```javascript
// el.plain为true，表示不存在属性，也就是说，如果节点不存在任何属性的话，就不会调用genData$2函数，处理data属性。
// 如果存在属性，那么就会处理属性，将拼接后的data返回
if (!el.plain || (el.pre && state.maybeComponent(el))) {
    data = genData$2(el, state);
}
// 处理完父节点，遍历处理所有子节点
var children = el.inlineTemplate ? null : genChildren(el, state, true);
// 拼接渲染函数
code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
```
父节点处理外之后，就是处理子节点：

```html
<span>andy</span>
```
然后在genChildren中又会遍历所有子节点调用genElement，然后又会处理该节点的属性以及子节点，就是这样的递归处理，最后staticRenderFns数组中保存的就是：
```javascript
["with(this){return _c('div',[_c('span',[_v("andy")])])}"]
```
### v-once拼接处理
v-once指令表示的是只渲染一次元素和组件。随后的重新渲染，元素或组件会被当做静态内容并跳过，这可以用于优化更新性能。

```javascript
function genOnce (el, state) {
    el.onceProcessed = true;
    if (el.if && !el.ifProcessed) {
        return genIf(el, state)
    } else if (el.staticInFor) {
        var key = '';
        var parent = el.parent;
        while (parent) {
            if (parent.for) {
                key = parent.key;
                break
            }
            parent = parent.parent;
        }
        if (!key) {
            state.warn(
              "v-once can only be used inside v-for that is keyed. ",
              el.rawAttrsMap['v-once']
            );
            return genElement(el, state)
        }
        return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
    } else {
        // 当做静态节点进行拼接处理
        return genStatic(el, state)
    }
}
```
### v-if拼接处理
genIf函数主要用来处理v-if的节点拼接，而具体的处理是放在genIfConditions函数中进行。genIfConditions函数主要做了以下几件事情：

- 1、在存放条件节点的数组中，从头开始依次取出条件节点
- 2、处理节点是否同时存在v-if和v-once指令的情况，如果一个节点同时存在这两个指令，那么会调用genOnce作为v-once进行节点拼接处理，如果只存在v-if，那么会调用genElement处理节点拼接，每一个节点都使用三元表达式去拼接。
- 3、递归调用genIfConditions处理所有的条件节点

```javascript
function genIf (el,state,altGen,altEmpty) {
    el.ifProcessed = true; 
    return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}

// conditions：存放条件节点的数组
function genIfConditions (conditions,state,altGen,altEmpty) {
    // 当没有条件的时候，就返回_e()，表示空节点
    if (!conditions.length) {
        return altEmpty || '_e()'
    }
    // 从头开始依次取出条件节点
    var condition = conditions.shift();
    // 如果存在条件表达式，那么就会调用genTernaryExp函数和genIfConditions函数
    // 如果不存在表达式，那么就只会调用genTernaryExp函数
    if (condition.exp) {
        return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
    } else {
        return ("" + (genTernaryExp(condition.block)))
    }

    // v-if with v-once should generate code like (a)?_m(0):_m(1)
    // 该函数的主要作用就是处理节点同时带有v-if和v-once节点
    // 如果节点也存在v-once节点，那么就会调用genOnce来进行节点拼接处理
    // 如果节点不存在v-once节点，那么就会调用genElement来进行后续的节点拼接处理
    function genTernaryExp (el) {
      return altGen
        ? altGen(el, state)
        : el.once
          ? genOnce(el, state)
          : genElement(el, state)
    }
}
```
举个例子：

```javascript
<p v-if="name == 'andy'">andy</p>
<div v-else-if="name == 'jack'">jack</div>
<span v-else>peter</span>
```
上面代码中，存在三个条件节点p，div，span。这三个条件节点都存放在p节点的ifConditions中。
```javascript
[
    0: {exp: "name == 'andy'", block: {p节点的ast}}
    1: {exp: "name == 'jack'", block: {div节点的ast}}
    2: {exp: undefined, block: {span节点的ast}}
]
```
首先会取出p节点，发现p节点存在条件表达式，那么就会使用一个三元表达式去拼接

```javascript
(name == 'andy') ? _c('p') : genIfConditions('剩下的节点')
```
当调用genIfConditions函数，又会取出div节点，发现div节点存在条件表达式，那么就又会使用一个三元表达式去拼接

```javascript
(name == 'andy') ? 
_c('p') : 
(name == 'jack') ? 
_c('div') : genIfConditions('剩下的节点')
```
当调用genIfConditions函数，又会取出span节点，发现span节点不存在条件表达式，那么就会直接拼接

```
(name == 'andy') ? _c('p') : (name == 'jack') ? _c('div') : _c('span')
```
上面就是最终得到的一个多元表达式，根据不同的条件执行不同的操作。

### v-for拼接处理

```javascript
function genFor (el,state,altGen,altHelper) {
    var exp = el.for;
    var alias = el.alias;
    var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
    var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';
    el.forProcessed = true;
    return (altHelper || '_l') + "((" + exp + ")," +
      "function(" + alias + iterator1 + iterator2 + "){" +
        "return " + ((altGen || genElement)(el, state)) +
      '})'
}
```
v-for节点的拼接比较简单，举个例子：

```
<div>
    <span v-for="(name , index) in list" :key="index">{{name}}</span>
</div>
```
最后拼接为：

```javascript
_c('div' , _l(list , function (item , index) {
    return _c('span')
}))
```

### 子节点拼接处理

```javascript
function genChildren (el,state,checkSkip,altGenElement,altGenNode) {
    // 获取子节点
    var children = el.children;
    if (children.length) {
        var el$1 = children[0];
        var gen = altGenNode || genNode;
        return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType$1 ? ("," + normalizationType$1) : ''))
    }
}

function genNode (node, state) {
    if (node.type === 1) {
        return genElement(node, state)
    } else if (node.type === 3 && node.isComment) {
        return genComment(node)
    } else {
        return genText(node)
    }
}
```
其实子节点拼接就是遍历所有子节点，逐个处理每一个子节点，然后拼接得到一个新的数组。如果type为1，那么表示节点是一个标签，就调用genElement处理，如果type为2，否则就是文本节点，如果type为2，表示是表达式文本，否则就是普通文本。

举个例子：

```html
<p>
    <span>andy</span>
    <span>jack</span>
</p>
```
拼接结果为：

```
_c('p' , [_c('span') , _c('span')])
```
### 插槽拼接处理

genSlot函数做了以下几件事情：

- 1、处理slot下的子节点
- 2、合并slot上绑定的静态属性和动态属性，并处理合并后的attrs

```javascript
function genSlot (el, state) {
    var slotName = el.slotName || '"default"';
    var children = genChildren(el, state);
    var res = "_t(" + slotName + (children ? ("," + children) : '');
    // 处理绑定在slot上的attrs
    var attrs = el.attrs || el.dynamicAttrs
      ? genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(function (attr) { return ({
          // slot props are camelized
          name: camelize(attr.name),
          value: attr.value,
          dynamic: attr.dynamic
        }); }))
      : null;
    var bind$$1 = el.attrsMap['v-bind'];
    if ((attrs || bind$$1) && !children) {
      res += ",null";
    }
    if (attrs) {
      res += "," + attrs;
    }
    if (bind$$1) {
      res += (attrs ? '' : ',null') + "," + bind$$1;
    }
    return res + ')'
}
```
举个例子：

```javascript
<div>
    <slot :a="name" :b="age">
        <span>12</span>
    </slot>
</div>
```
首先slot中的属性会被合并成这样：

```javascript
[
    {
        name : 'a',
        value : 'name',
        dynamic : false
    },
    {
        name : 'b',
        value : 'age',
        dynamic : false
    }
]
```
然后会调用genProps方法来处理slot上的attrs。

### 组件拼接处理

```javascript
function genComponent (componentName,el,state) {
    var children = el.inlineTemplate ? null : genChildren(el, state, true);
    return ("_c(" + componentName + "," + (genData$2(el, state)) + (children ? ("," + children) : '') + ")")
}
```
这里我们发现处理组件的时候，其实和处理普通标签的方式差不多，这个方法是用来处理 【带有 is 属性】的节点，否则就不会存在el.component这个属性，就不会调用 genComponent。

如果是普通的组件名，而不是通过is来设置组件，那么同样也是走和普通标签一样的流程

```javascript
var data;
if (!el.plain || (el.pre && state.maybeComponent(el))) {
    data = genData$2(el, state);
};
var children = el.inlineTemplate ? null : genChildren(el, state, true);
code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
```
### 总结：
我们通过一个简单的例子来看一下具体是怎么拼接这些节点的

```html
<div>
    <span><em>andy</em></span>
    <p v-if="isShow">hello</p>
    <span v-for="(item , index) in list">{{item}}</span>
    <test />
</div>
```
1、首先会解析最外层的div标签，然后得到字符串：

```javascript
`_c('div'`
```

2、然后会调用genChildren方法，遍历div标签中的所有子节点进行解析

3、处理span节点，这是一个静态根节点，所以会调用genStatic方法，进行解析，然后得到字符串：

```javascript
`_c('div' , [_m(0)`
```

4、处理p节点，会调用genIf方法进行解析，然后得到字符串：

```javascript
`_c('div' , [_m(0) , isShow ? _c(p) : _e()`
```
5、处理span节点，会调用genFor方法进行解析，然后得到字符串：

```javascript
`_c('div' , [_m(0) , isShow ? _c('p') : _e() , _l(list , function (item , index) {return _c('span')})`
```
6、处理test节点，会得到字符串：

```javascript
`_c('div' , [
    _m(0) , 
    isShow ? _c('p') : _e() , 
    _l(list , function (item , index) {return _c('span')} , 
    _c('test')`
```
7、当处理完所有子节点，那么就会拼接末尾的括号，最终得到的字符串：

```javascript
`_c('div' , [
    _m(0) , 
    isShow ? _c('p') : _e() , 
    _l(list , function (item , index) {return _c('span')} , 
    _c('test')
])
`
```
需要注意的是，我们这里都忽略空白节点，没有包括空白节点
