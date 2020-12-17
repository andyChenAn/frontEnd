# Vue的双向数据绑定(v-model)
双向数据绑定：指的是数据的变化能影响到DOM的变化，DOM的变化也能影响到数据的变化。

在Vue中，我们可以使用v-model指令，在表单元素`<input>`，`<select>`和`<textarea>`上或者自定义的组件上创建双向数据绑定。

v-model指令可以带三个修饰符(modifiers)，lazy，number，trim。

### v-model在input上是使用
在Vue内部中，v-model指令是保存在directives$1.model中
```javascript
var directives$1 = {
    model: model,
    text: text,
    html: html,
};
```
例子：
```html
<input v-model="value" type="text">
```
```javascript
/**
el : 模板编译的标签元素
dir ： 编译后的指令对象，这里指的是v-mode指令
_warn : 函数
*/
function model(el, dir, _warn) {
    warn$1 = _warn;
    // 指令的值，也就是v-model="value"中的"value"。
    var value = dir.value;
    // 指令的修饰符，主要用trim，number，lazy
    var modifiers = dir.modifiers;
    // 标签，这里指的是input标签
    var tag = el.tag;
    // input标签的类型，这里是"type"
    var type = el.attrsMap.type;
    
    // 不能在<input type="file" />中使用v-model，需要使用@change事件来代替
    // <input v-model="value" type="file">这样写法就会报下面的警告
    {
      if (tag === "input" && type === "file") {
        warn$1(
          "<" + el.tag + ' v-model="' + value + '" type="file">:\n' + "File inputs are read only. Use a v-on:change listener instead.",
          el.rawAttrsMap["v-model"]
        );
      }
    }

    if (el.component) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false;
    } else if (tag === "select") {
      genSelect(el, value, modifiers);
    } else if (tag === "input" && type === "checkbox") {
      genCheckboxModel(el, value, modifiers);
    } else if (tag === "input" && type === "radio") {
      genRadioModel(el, value, modifiers);
    } else if (tag === "input" || tag === "textarea") {
      // 如果是input标签(type为text)或者textarea标签
      genDefaultModel(el, value, modifiers);
    } else if (!config.isReservedTag(tag)) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false;
    } else {
      warn$1(
        "<" +
        el.tag +
        ' v-model="' +
        value +
        '">: ' +
        "v-model is not supported on this element type. " +
        "If you are working with contenteditable, it's recommended to " +
        "wrap a library dedicated for that purpose inside a custom component.",
        el.rawAttrsMap["v-model"]
      );
    }

    // ensure runtime directive metadata
    return true;
}
```
标签是input，所以会调用genDefaultModel方法
```javascript
function genDefaultModel(el, value, modifiers) {
    // input标签的type类型
    var type = el.attrsMap.type;
    
    // 冲突处理，如果使用了v-mode，那么就不能使用:value或者v-bind:value
    {
      var value$1 = el.attrsMap["v-bind:value"] || el.attrsMap[":value"];
      var typeBinding = el.attrsMap["v-bind:type"] || el.attrsMap[":type"];
      if (value$1 && !typeBinding) {
        var binding = el.attrsMap["v-bind:value"] ? "v-bind:value" : ":value";
        warn$1(
          binding +
          '="' +
          value$1 +
          '" conflicts with v-model on the same element ' +
          "because the latter already expands to a value binding internally",
          el.rawAttrsMap[binding]
        );
      }
    }
    
    // 指令的修饰符
    var ref = modifiers || {};
    var lazy = ref.lazy;
    var number = ref.number;
    var trim = ref.trim;
    // 如果指令的修饰符lazy为false并且input标签的type不是range
    // 那么needCompositionGuard为true，表示可以使用文本合成事件(compositionstart,compositionupdate,compositionend事件)
    var needCompositionGuard = !lazy && type !== "range";
    
    // lazy如果为true，那么就使用change事件
    // lazy如果为false，那么就使用input事件
    // 默认是使用input事件，所以我们再文本框中输入内容的时候，只要标签的值发生变化，那么就会被触发
    // 如果使用change事件，那么就是在input标签的值发生改变并且失去焦点的时候就会被触发
    var event = lazy ? "change" : type === "range" ? RANGE_TOKEN : "input";
    
    // 当存在trim修饰符时，就调用trim()方法，去掉左右两边的空白字符
    // 当存在number修饰符时，就调用toNumber方法，转为数字
    var valueExpression = "$event.target.value";
    if (trim) {
      valueExpression = "$event.target.value.trim()";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }
    
    // 这里主要做的事情就是解析value，并生成相应的代码
    var code = genAssignmentCode(value, valueExpression);
    // 如果没有使用修饰符lazy，那么code会是
    // if($event.target.composing)return;name=$event.target.value
    if (needCompositionGuard) {
      code = "if($event.target.composing)return;" + code;
    }
    // 给el添加props属性，props是一个数组，
    addProp(el, "value", "(" + value + ")");
    addHandler(el, event, code, null, true);
    if (trim || number) {
      addHandler(el, "blur", "$forceUpdate()");
    }
}
```

```javascript
// 生成代码
/**
* value值存在以下几种情况
* - test
* - test[key]
* - test[test1[key]]
* - test["a"][key]
* - xxx.test[a[a].test1[key]]
* - test.xxx.a["asa"][test1[key]]
*/
function genAssignmentCode(value, assignment) {
    // 将v-model="value"中的value进行解析，最终返回：
    /*
        {
            exp : "xxx",
            key : 'xxx' | null
        }
    */
    /* 如果value值是一个基础类型，并不是一个对象，那么key就是null
    比如：v-model="value"，那么res={exp : name , key : null}
    返回的就是：value=$event.target.value
    比如：v-model="obj['name']"，那么res={exp : obj , key : name}
    返回的就是："$set(obj , name , $event.target.value)" 
    */
    var res = parseModel(value);
    if (res.key === null) {
      return value + "=" + assignment;
    } else {
      return "$set(" + res.exp + ", " + res.key + ", " + assignment + ")";
    }
}
```

```javascript
// 添加事件处理器，其实就是添加到el.events中
/*
el : 标签元素
name ： 事件名称
value：事件处理器的主体代码
modifiers：事件修饰符
*/
function addHandler(el, name, value, modifiers, important, warn, range, dynamic) {
    modifiers = modifiers || emptyObject;
    // 当点击鼠标右键和鼠标中间键，分别使用contextmenu事件和mouseup事件来代替
    if (modifiers.right) {
      if (dynamic) {
        name = "(" + name + ")==='click'?'contextmenu':(" + name + ")";
      } else if (name === "click") {
        name = "contextmenu";
        delete modifiers.right;
      }
    } else if (modifiers.middle) {
      if (dynamic) {
        name = "(" + name + ")==='click'?'mouseup':(" + name + ")";
      } else if (name === "click") {
        name = "mouseup";
      }
    }

    // 是否存在capture修饰符
    if (modifiers.capture) {
      delete modifiers.capture;
      name = prependModifierMarker("!", name, dynamic);
    }
    // 是否存在once修饰符
    if (modifiers.once) {
      delete modifiers.once;
      name = prependModifierMarker("~", name, dynamic);
    }
    // 是否存在passive修饰符
    if (modifiers.passive) {
      delete modifiers.passive;
      name = prependModifierMarker("&", name, dynamic);
    }
    
    // 如果存在native修饰符，那么表示是一个原生事件，就会被保存在el.nativeEvents中，在自定义组件的时候，我们会用到比如：<test @click.native="handleClick" />
    // 如果没有native修饰符，那么就保存在el.events中，自定义事件也都是保存在这里
    var events;
    if (modifiers.native) {
      delete modifiers.native;
      events = el.nativeEvents || (el.nativeEvents = {});
    } else {
      events = el.events || (el.events = {});
    }
    // 事件处理器，如果存在修饰符的话，那么把修饰符也保存在newHandler上
    var newHandler = rangeSetItem({ value: value.trim(), dynamic: dynamic }, range);
    if (modifiers !== emptyObject) {
      newHandler.modifiers = modifiers;
    }
    
    // 获取当前事件下面的处理器
    // 哪个事件处理器重要，就把哪个放在前面
    var handlers = events[name];
    /* istanbul ignore if */
    if (Array.isArray(handlers)) {
      important ? handlers.unshift(newHandler) : handlers.push(newHandler);
    } else if (handlers) {
      events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
    } else {
      events[name] = newHandler;
    }

    el.plain = false;
}
```
通过上面的代码中，我们可以看到，v-mode在处理input的时候，做了以下几件事情：

##### 预输入延迟更新
指的是当我们在输入框中输入中文的时候，在输入框中其实填充的是英文字母，只有当我们按下空格键之后，然后才将中文填充到输入框中，默认情况下，会触发input事件，所以当我们输入中文的时候，也是会触发input事件，但是填充的内容并不是我们想要的，这个时候我们就需要先阻止input事件触发，而Vue内部就会使用compositionstart和compositionend来处理这个。

当绑定指令的元素被插入到父节点时，会触发inserted，而inserted方法中就绑定了compositionstart和compositionend事件。
```javascript
el.addEventListener("compositionstart", onCompositionStart);
el.addEventListener("compositionend", onCompositionEnd);

function onCompositionStart(e) {
    e.target.composing = true;
}

function onCompositionEnd(e) {
    if (!e.target.composing) {
      return;
    }
    e.target.composing = false;
    trigger(e.target, "input");
}

function trigger(el, type) {
    var e = document.createEvent("HTMLEvents");
    e.initEvent(type, true, true);
    el.dispatchEvent(e);
}
```
所以，当我们输入中文的时候，首先会触发compositionstart事件，这个时候e.target.composing=true;然后会触发input事件，而input事件处理器就是：
```javascript
if (needCompositionGuard) { 
  code = "if($event.target.composing)return;" + code;
}
```
当执行代码的时候，$event.target.composing为true，所以就直接返回，因为并不是我们想要的东西，所以就直接返回了。当我们按下空格键的时候，会填充中文，这个时候会触发compositionend事件，在这个事件中会将event.target.composing=false，并且调用trigger(e.target , "input")方法，触发input事件，而这个时候因为event.target.composing=false,所以会执行后面的操作。

##### lazy修饰符
```javascript
var event = lazy ? "change" : type === "range" ? RANGE_TOKEN : "input";
```
如果存在lazy修饰符，那么就使用change事件，如果不存在，那么就使用input事件，默认是绑定input事件。如果你设置了lazy，那么就相当于输入框中的内容发生改变，并且失去焦点的时候就会触发change事件
##### trim修饰符
trim修饰符就是去掉value值两边的空格
```javascript
var valueExpression = "$event.target.value";
if (trim) {
  valueExpression = "$event.target.value.trim()";
}
```
获取输入框的值，并且调用trim方法，删除两边的空格。

##### number修饰符
number修饰符就是将value值转为number类型，如果value是一个字符串，那么就返回这个字符串
```javascript
if (number) {
  valueExpression = "_n(" + valueExpression + ")";
}
```
如果存在trim修饰符或者number修饰符，当失去焦点的时候，都会调用$forceUpdate强制重新渲染组件。为什么需要再重新渲染呢？比如，你输入的内容后存在空格，当你失去焦点的时候，强制重新渲染的话，那么获取到的值就是没有空格的。

### v-model在select中的使用
当绑定v-model的select标签插入到父节点时，就会触发指令的inserted钩子方法，我们就会去设置selectedIndex
```javascript
if (vnode.tag === "select") {
    // 省略代码...
    setSelected(el, binding, vnode.context);
    el._vOptions = [].map.call(el.options, getValue);
}
```

```javascript
function setSelected(el, binding, vm) {
    actuallySetSelected(el, binding, vm);
}
function actuallySetSelected(el, binding, vm) {
    // v-mode指令绑定的值
    var value = binding.value;
    // 是否可以多选
    var isMultiple = el.multiple;
    var selected, option;
    // 遍历所有的select元素下面所有的option，如果option的value和v-model绑定的value值相等，那么就设置el.selectedIndex = i。
    for (var i = 0, l = el.options.length; i < l; i++) {
      option = el.options[i];
      if (isMultiple) {
        selected = looseIndexOf(value, getValue(option)) > -1;
        if (option.selected !== selected) {
          option.selected = selected;
        }
      } else {
        if (looseEqual(getValue(option), value)) {
          if (el.selectedIndex !== i) {
            el.selectedIndex = i;
          }
          return;
        }
      }
    }
    // 如果v-model绑定的值与select元素下的所有的option的value值都不相等，那么默认selectedIndex为-1，那么表示没有元素被选中
    if (!isMultiple) {
      el.selectedIndex = -1;
    }
}
```
当select标签更新后，就会调用指令的componentUpdate钩子方法
```javascript
function componentUpdated (el, binding, vnode) {
  if (vnode.tag === 'select') {
    // 当select标签更新后，又会设置一遍selectedIndex
    setSelected(el, binding, vnode.context);
    
    // 之前保存的旧的options的所有value的数组
    var prevOptions = el._vOptions;
    // 当前保存的options的所有value的数组
    var curOptions = el._vOptions = [].map.call(el.options, getValue);
    // 当options变化时，并且和旧的options的value都不相同，那么就需要重新设置
    if (curOptions.some(function (o, i) { return !looseEqual(o, prevOptions[i]); })) {
      var needReset = el.multiple
        ? binding.value.some(function (v) { return hasNoMatchingOption(v, curOptions); })
        // 绑定值变化了，并且绑定值匹配不到option的value
        : binding.value !== binding.oldValue && hasNoMatchingOption(binding.value, curOptions);
      if (needReset) {
        trigger(el, 'change');
      }
    }
  }
}
```
componentUpdated方法会执行两个操作，一个是更新selectedIndex，一个是更新绑定的值（也就是触发change事件，来更新绑定的值）。

触发change事件的条件是：
- 1、options改变了，并且和之前的options每个都不相同
- 2、绑定值也变化了
- 3、新绑定值无法在新options中匹配到对应值

满足上面的三个条件就会触发change事件，比如：

```html
<div id="app">
	<select v-model="selectedNum">
		<option :value="num" v-for="num in nums" :key="num">{{num}}</option>
	</select>
</div>
```

```javascript
let app = document.getElementById('app');
const vm = new Vue({
	el : app,
	data : {
		nums : [1,2,3],
		selectedNum : ''
	},
	created () {
		setTimeout(() => {
			this.selectedNum = 8;
			this.nums = [4,5,6];
		} , 5000)
	}
});
```
上面代码中，5秒钟后，绑定的值被设置为8，而新的options的值是[4,5,6]，8根本就不存在于[4,5,6]中，所以会触发change事件，又会执行：

```
var $$selectedVal = Array.prototype.filter.call($event.target.options,function(o){return o.selected}).map(function(o){var val = "_value" in o ? o._value : o.value;return val}); selectedNum=$event.target.multiple ? $$selectedVal : $$selectedVal[0]
```
这个时候，因为options不存在新绑定值，selectedNum就是undefined了。

所以如果用户没有选择任何option，但是绑定值和options都变了，并且绑定值与新的options又不匹配，那么这个绑定值就没什么用，所以就直接触发change事件，更新绑定值为undefined了。
