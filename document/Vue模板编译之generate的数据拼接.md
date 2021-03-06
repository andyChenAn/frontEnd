# Vue模板编译之generate的数据拼接
节点的数据一般包括：attrs，props，事件等。在节点拼接过程中，最终都会调用genData$2方法去拼接节点数据。

### genData$2方法
这个方法主要就是用来拼接节点数据的。
```javascript
  function genData$2 (el, state) {
    var data = '{';
    // 首先解析指令
    var dirs = genDirectives(el, state);
    // 如果有返回的字符串，那么就拼接上去
    if (dirs) { data += dirs + ','; }

    // 处理节点在v-for循环时，key属性
    if (el.key) {
      data += "key:" + (el.key) + ",";
    }
    // 处理节点上的ref属性
    if (el.ref) {
      data += "ref:" + (el.ref) + ",";
    }
    // 处理<span v-for="item in list" :key="item" ref="ss"></span>
    if (el.refInFor) {
      data += "refInFor:true,";
    }
    // 处理v-pre
    if (el.pre) {
      data += "pre:true,";
    }
    // 处理节点带有is属性，<div is="test"></div>
    if (el.component) {
      data += "tag:\"" + (el.tag) + "\",";
    }
    // module data generation functions
    for (var i = 0; i < state.dataGenFns.length; i++) {
      data += state.dataGenFns[i](el);
    }
    // attributes
    if (el.attrs) {
      data += "attrs:" + (genProps(el.attrs)) + ",";
    }
    // DOM props
    if (el.props) {
      data += "domProps:" + (genProps(el.props)) + ",";
    }
    // event handlers
    if (el.events) {
      data += (genHandlers(el.events, false)) + ",";
    }
    if (el.nativeEvents) {
      data += (genHandlers(el.nativeEvents, true)) + ",";
    }
    // slot target
    // only for non-scoped slots
    if (el.slotTarget && !el.slotScope) {
      data += "slot:" + (el.slotTarget) + ",";
    }
    // scoped slots
    if (el.scopedSlots) {
      data += (genScopedSlots(el, el.scopedSlots, state)) + ",";
    }
    // component v-model
    if (el.model) {
      data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
    }
    // inline-template
    if (el.inlineTemplate) {
      var inlineTemplate = genInlineTemplate(el, state);
      if (inlineTemplate) {
        data += inlineTemplate + ",";
      }
    }
    data = data.replace(/,$/, '') + '}';
    // v-bind dynamic argument wrap
    // v-bind with dynamic arguments must be applied using the same v-bind object
    // merge helper so that class/style/mustUseProp attrs are handled correctly.
    if (el.dynamicAttrs) {
      data = "_b(" + data + ",\"" + (el.tag) + "\"," + (genProps(el.dynamicAttrs)) + ")";
    }
    // v-bind data wrap
    if (el.wrapData) {
      data = el.wrapData(data);
    }
    // v-on data wrap
    if (el.wrapListeners) {
      data = el.wrapListeners(data);
    }
    return data
  }
```
### 指令拼接
在拼接数据的时候，首先会解析指令，拼接指令数据，会调用genDirectives方法，该方法做了以下几件事情：

 - 1、获取节点上绑定的指令
 
 - 2、遍历节点上的所有指令，如果是Vue内部指令，那么就会调用相应的函数进行处理，如果是自定义指令，那么就会拼接成一个对象字符串。

```javascript
function genDirectives (el, state) {
    // 获取节点上绑定的指令，是一个数组
    var dirs = el.directives;
    // 如果不存在指令，那么就直接返回
    if (!dirs) { return }
    var res = 'directives:[';
    var hasRuntime = false;
    var i, l, dir, needRuntime;
    // 遍历节点上的所有指令
    for (i = 0, l = dirs.length; i < l; i++) {
        dir = dirs[i];
        needRuntime = true;
        // 获取到特定的 Vue 指令处理方法
        var gen = state.directives[dir.name];
        // 如果这个方法存在，那么表示这个指令是一个内部指令
        // 对于内部指令会调用对应的方法进行处理
        // 返回的结果，如果是true，那么表示需要把指令的数据解析成一个对象字符串，然后拼接到render函数中。如果返回的是false，那么就不需要解析成一个对象字符串，拼接到render函数上。
        if (gen) {
            needRuntime = !!gen(el, dir, state.warn);
        }
        if (needRuntime) {
            hasRuntime = true;
            res += "{name:\"" + (dir.name) + "\",rawName:\"" + (dir.rawName) + "\"" + (dir.value ? (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : '') + (dir.arg ? (",arg:" + (dir.isDynamicArg ? dir.arg : ("\"" + (dir.arg) + "\""))) : '') + (dir.modifiers ? (",modifiers:" + (JSON.stringify(dir.modifiers))) : '') + "},";
        }
    }
    // 是一个标志位，表示是否需要返回拼接指令的结果
    // 如果指令是一个空数组，那么就不会有返回值，也就是说不会有返回值
    // 那么render字符串就不会有directive
    // 如果指令不是空数组，那么hasRuntime为true，需要返回字符串
    if (hasRuntime) {
        return res.slice(0, -1) + ']'
    }
}
```
#### state.directives
state.directives 是一个数组，包含了 Vue内部指令的处理函数，主要是这几个指令：v-on，v-bind，v-cloak，v-model ，v-text，v-html
#### needRuntime
这个变量是一个标志位，表示是否需要把指令数据解析成一个对象字符串，也就是说这个指令是否需要被拼接在render函数中。

上面代码中，哪些指令需要呢？哪些指令不需要呢？

所有自定义指令都需要解析成对象字符串，然后拼接到render中。

Vue的内部指令有的需要，有的不需要，Vue的内部执行需要先执行该指令相应的方法，如果调用完之后返回true，那么就需要解析成对象字符串，拼接到render上，如果返回false，那么就不需要解析成对象字符串，也不会拼接到render上，所以这也是为什么他需要用一个needRuntime变量。

像v-mode指令就会拼接到render中，v-html，v-text就不会。
#### hasRuntime
是一个标志位，表示是否需要返回拼接指令的结果，如果指令是一个空数组，那么就不会有返回值，也就是说不会有返回值，那么render字符串就不会有directive，如果指令不是空数组，那么hasRuntime为true，需要返回字符串。

### 组件拼接
这里的组件拼接，主要是处理节点带有is属性，会拼接一个tag属性就好了。
```html
<div is="test"></div>
```
结果会被拼接成_c('test' , {tag : 'div'})
### 样式拼接
样式拼接主要是拼接class和style，而拼接class和style的方法是放在state.dataGenFns中，这是一个数组，里面存放着拼接class和style的方法。
#### 拼接class
包括拼接静态class和动态class
```javascript
function genData (el) {
    var data = '';
    // 静态的class
    if (el.staticClass) {
        data += "staticClass:" + (el.staticClass) + ",";
    }
    // 动态的class
    if (el.classBinding) {
        data += "class:" + (el.classBinding) + ",";
    }
    return data
}
```
#### 拼接style
包括拼接静态style和动态style
```javascript
function genData$1 (el) {
    var data = '';
    // 静态style
    if (el.staticStyle) {
        data += "staticStyle:" + (el.staticStyle) + ",";
    }
    // 动态style
    if (el.styleBinding) {
        data += "style:(" + (el.styleBinding) + "),";
    }
    return data
}
```
举个例子：
```html
<div id="app">
    <div class="a" :class="name" style="width:100px;" :style="{color: '#f60'}">hello andy</div>
</div>
```
结果：
```javascript
{
    staticClass:"a",
    class:name,
    staticStyle:{"width":"100px"},
    style:{color: '#f60'}
}
```
### 属性拼接
属性拼接包括attrs和props的拼接，如果属性是放在标签上，那么就会被拼接在attrs上，如果属性是放在dom上，那么就会被拼接到domProps上。
```javascript
// attributes拼接
if (el.attrs) {
    data += "attrs:" + (genProps(el.attrs)) + ",";
}
// DOM props拼接
if (el.props) {
    data += "domProps:" + (genProps(el.props)) + ",";
}
```

```javascript
// 这个方法就是生成相应的属性
function genProps (props) {
  var staticProps = "";
  var dynamicProps = "";
  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    var value = transformSpecialNewlines(prop.value);
    if (prop.dynamic) {
      dynamicProps += (prop.name) + "," + value + ",";
    } else {
      staticProps += "\"" + (prop.name) + "\":" + value + ",";
    }
  }
  staticProps = "{" + (staticProps.slice(0, -1)) + "}";
  if (dynamicProps) {
    return ("_d(" + staticProps + ",[" + (dynamicProps.slice(0, -1)) + "])")
  } else {
    return staticProps
  }
}
```
举个例子：

```html
<div id="app">
    <div name="name" :age="12" :address.prop="address">hello andy</div>
</div>
```
结果：

```javascript
{
    attrs:{"name":"name","age":12},
    domProps:{"address":address}
}
```
而且页面中渲染出来的DOM也没有address属性，那是因为address属性是保存在dom上，而不是attr上。
```html
<div id="app">
    <div name="name" age="12">hello andy</div>
</div>
```
如果我们想获取到address，我们可以这样
```javascript
vm.$refs.box.address
```
### 普通slot拼接
普通的slot拼接，是直接拼接上slot这个属性就好了。

```javascript
if (el.slotTarget && !el.slotScope) {
    data += "slot:" + (el.slotTarget) + ",";
  }
```
### 作用域slot拼接
这个不太看得懂
### 组件的v-model拼接
v-model其实就是绑定了一个value属性和一个input事件。
```javascript
if (el.model) {
    data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
}
```
举个例子：
```html
<div id="app">
    <test v-model="name"></test>
</div>
```
结果：
```javascript
{
    model:{
        value:name,
        callback:function ($$v) {name=$$v},
        expression:"name"
    }
}
```
