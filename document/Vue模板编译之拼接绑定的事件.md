# Vue模板编译之拼接绑定的事件
事件分为组件原生事件和事件，组件原生事件指的就是在组件上绑定原生DOM事件。
```javascript
if (el.events) {
    data += (genHandlers(el.events, false)) + ",";
  }
  if (el.nativeEvents) {
    data += (genHandlers(el.nativeEvents, true)) + ",";
  }
```
### genHandlers
当你传入 isNative为true的时候，该事件即为组件原生DOM事件，需要拼接在nativeOn:{} 字符串上，否则，就是事件，拼接在 on:{} 字符串上。
```javascript
function genHandlers (events,isNative) {
  var prefix = isNative ? 'nativeOn:' : 'on:';
  var staticHandlers = "";
  var dynamicHandlers = "";
  for (var name in events) {
    var handlerCode = genHandler(events[name]);
    if (events[name] && events[name].dynamic) {
      dynamicHandlers += name + "," + handlerCode + ",";
    } else {
      staticHandlers += "\"" + name + "\":" + handlerCode + ",";
    }
  }
  staticHandlers = "{" + (staticHandlers.slice(0, -1)) + "}";
  if (dynamicHandlers) {
    return prefix + "_d(" + staticHandlers + ",[" + (dynamicHandlers.slice(0, -1)) + "])"
  } else {
    return prefix + staticHandlers
  }
}
```
### 键盘配置
```javascript
// 键盘与code的映射
var keyCodes = {
    esc: 27,
    tab: 9,
    enter: 13,
    space: 32,
    up: 38,
    left: 37,
    right: 39,
    down: 40,
    'delete': [8, 46]
};

// 键盘与键盘名的映射
var keyNames = {
    esc: ['Esc', 'Escape'],
    tab: 'Tab',
    enter: 'Enter',
    space: [' ', 'Spacebar'],
    up: ['Up', 'ArrowUp'],
    left: ['Left', 'ArrowLeft'],
    right: ['Right', 'ArrowRight'],
    down: ['Down', 'ArrowDown'],
    'delete': ['Backspace', 'Delete', 'Del']
};
```
### 修饰符配置
stop和prevent修饰符是直接拼接在事件回调函数中的，其他的修饰符就需要调用genGuard函数，来给事件回调拼接触发条件
```javascript
var modifierCode = {
    stop: '$event.stopPropagation();',
    prevent: '$event.preventDefault();',
    self: genGuard("$event.target !== $event.currentTarget"),
    ctrl: genGuard("!$event.ctrlKey"),
    shift: genGuard("!$event.shiftKey"),
    alt: genGuard("!$event.altKey"),
    meta: genGuard("!$event.metaKey"),
    left: genGuard("'button' in $event && $event.button !== 0"),
    middle: genGuard("'button' in $event && $event.button !== 1"),
    right: genGuard("'button' in $event && $event.button !== 2")
};
```
### genGuard函数
该函数的作用就是给事件回调拼接触发条件，如果满足条件就触发，如果不满足条件就不触发
```javascript
var genGuard = function (condition) { return ("if(" + condition + ")return null;"); };
```
如果我们使用了ctrl修饰符，那么就是：
```javascript
if (!$event.ctrlKey) {
    return null
}
```
上面代码中，如果按下的键盘不是ctrl，那么就不会执行事件回调
### 拼接修饰符
我们调用genKeyFilter来拼接修饰符
```javascript
if (keys.length) {
    code += genKeyFilter(keys);
}
function genKeyFilter (keys) {
    return (
        "if(!$event.type.indexOf('key')&&" +
        (keys.map(genFilterCode).join('&&')) + ")return null;"
    )
}
```
keys是一个数组，里面保存的是添加的按键修饰符，可以是数字，也可以是键名。比如：
```html
<button @click.enter="handleClick">click</button>
```
keys的值就是：
```javascript
['enter']
```
然后遍历keys，调用genFilterCode函数来处理每个键值。

```javascript
function genFilterCode (key) {
    // 如果key是数字，那么keyVal就是数字，如果不是数字，那么调用parseInt时就会是NaN
    var keyVal = parseInt(key, 10);
    // 如果key是数字，那么就直接返回$event.keyCode != keyVal;
    if (keyVal) {
        return ("$event.keyCode!==" + keyVal)
    }
    // 如果key不是数字，那么获取对应的键名和键名对应的数字
    var keyCode = keyCodes[key];
    var keyName = keyNames[key];
    return (
        "_k($event.keyCode," +
        (JSON.stringify(key)) + "," +
        (JSON.stringify(keyCode)) + "," +
        "$event.key," +
        "" + (JSON.stringify(keyName)) +
        ")"
    )
}
```
如果参数key是一个数字，那么就直接返回字符串，比如key为13

```javascript
return "$event.keyCode !== 13"
```
如果参数key是一个键名，那么调用parseInt时，会被转为NaN，于是就会往下执行，并且从keyCodes和keyNames对象中，取出key的值，比如key是"enter"，那么：
```javascript
var keyCode = 13;
var keyName = "Enter";
```
这里我们需要注意的是，key不一定要存在Vue自己定义的keyCodes和keyNames中，所以这个时候有可能取不到任何值，也就是说，keyCode和keyName可能是undefined。

genFilterCode的返回值是：
```javascript
_k(
    $event.keyCode,
    key,
    keyCode,
    $event.key,
    keyName
)
```
_k方法中，带有5个参数：

$event是一个事件对象，$event.keyCode指的是按键的code。

$event.key指的是按键的名。

key指的是绑定的键名或键值。

keyCode指的是key在keyCodes对象中对应的值（键值）

keyName指的是key在keyNames对象中对应的值（键名）

_k函数其实就是checkKeyCodes函数：

```javascript
function checkKeyCodes(eventKeyCode,key,builtInKeyCode,eventKeyName,builtInKeyName) {
    var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
    // 如果这个键只在Vue内部定义的keyCode中，不在自定义的keyCode中
    if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
        return isKeyNotMatch(builtInKeyName, eventKeyName)
    // 如果这个键只在自定义的keyCode中，不在Vue内部定义的keyCode中
    } else if (mappedKeyCode) {
        return isKeyNotMatch(mappedKeyCode, eventKeyCode)
    // 既不在Vue内部定义的keyCode中，也不在自定义的keyCode中
    // 原始的键名，也就是指你按下键盘哪个键，它就是哪个键名
    } else if (eventKeyName) {
        return hyphenate(eventKeyName) !== key
    }
}
```
checkKeyCodes函数就是检查key。

#### config.keyCodes
这个表示自己自定义的键值对。
```javascript
Vue.config.keyCodes = {
    vv : 86,
    upup : [38 , 87]
}
```
#### isKeyNotMatch函数
该函数用来检查按下的键，是否"不和"配置(Vue内部配置的或者自己自定义配置的)的键值对匹配。如果不匹配那么就返回true，否则返回false。

```javascript
// expect指的是配置的键名
// actual指的是事件对象获取到的键名
function isKeyNotMatch (expect, actual) {
    // 如果配置的键名是一个数组，那么就看配置的键名中是否包含实际按下的键名
    if (Array.isArray(expect)) {
        return expect.indexOf(actual) === -1
    } else {
        return expect !== actual
    }
}
```
比如按下的键是enter，Vue内部配置了{enter: 'Enter'}，那么expect就是"Enter"，actual就是在事件对象中获取的键名，也是"Enter"，所以按下的键名和配置的键名相匹配，那么就会返回false，也就是checkKeyCode返回false，回调执行过滤条件为false，那么就不会执行return null，那么就会往下执行

举个例子：

```
<button @click.ctrl="handleClick">click</button>
```
上面代码中，当我们点击按钮+按下alt键时，不会执行handleClick，因为按下的键名和配置中的键名不匹配，所以isKeyNotMatch函数会返回true，也就是checkKeyCode返回true，那么回调执行过滤条件为true，那么就会return null。不会执行回调之后的代码，所以只有当按下ctrl+点击按钮是才会触发执行handleClick。
#### hyphenate函数
这个函数的作用是将大写字母转为小写，并且添加一个中线连接符，比如：
```
hyphenate(aB)会被转为a-b
```
会把驼峰命名改为：-命名的方式。也就是说不支持驼峰命名的写法。
#### checkKeyCodes函数的匹配顺序

- 1、先匹配Vue内部定义的键值对
- 2、其次匹配自己自定义的键值对
- 3、匹配原始的键值对

举个例子：

```html
<input type="text" @keydown.a.b="handleClick">
```
像上面代码中，只有在输入框中按下键盘中的a或者b键才会触发handleClick。

### genHandler函数
该函数主要用来处理修饰符的。
```javascript
function genHandler (handler) {
    // 如果没有绑定回调，那么就返回一个空函数
    if (!handler) {
        return 'function(){}'
    }
    // 如果绑定的是一个回调数组，那么就遍历每一个执行genHandler
    if (Array.isArray(handler)) {
        return ("[" + (handler.map(function (handler) { return genHandler(handler); }).join(',')) + "]")
    }

    var isMethodPath = simplePathRE.test(handler.value);
    var isFunctionExpression = fnExpRE.test(handler.value);
    var isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''));

    // 如果没有修饰符
    if (!handler.modifiers) {
      if (isMethodPath || isFunctionExpression) {
        return handler.value
      }
      return ("function($event){" + (isFunctionInvocation ? ("return " + (handler.value)) : handler.value) + "}") // inline statement
    } else {
      var code = '';
      var genModifierCode = '';
      var keys = [];
      for (var key in handler.modifiers) {
        if (modifierCode[key]) {
          genModifierCode += modifierCode[key];
          // left/right
          if (keyCodes[key]) {
            keys.push(key);
          }
        } else if (key === 'exact') {
          var modifiers = (handler.modifiers);
          genModifierCode += genGuard(
            ['ctrl', 'shift', 'alt', 'meta']
              .filter(function (keyModifier) { return !modifiers[keyModifier]; })
              .map(function (keyModifier) { return ("$event." + keyModifier + "Key"); })
              .join('||')
          );
        } else {
          keys.push(key);
        }
      }
      if (keys.length) {
        code += genKeyFilter(keys);
      }
      // Make sure modifiers like prevent and stop get executed after key filtering
      if (genModifierCode) {
        code += genModifierCode;
      }
      var handlerCode = isMethodPath
        ? ("return " + (handler.value) + "($event)")
        : isFunctionExpression
          ? ("return (" + (handler.value) + ")($event)")
          : isFunctionInvocation
            ? ("return " + (handler.value))
            : handler.value;
      return ("function($event){" + code + handlerCode + "}")
    }
}
```
