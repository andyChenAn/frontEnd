# Vue的过滤器
Vue文档中，过滤器可以用在两个地方：双花括号插值和`v-bind`表达式。过滤器应该被添加在javascript表达式的尾部，由"管道"符号表示：
```
<!-- 在双花括号中 -->
{{name | normalize}}

<!-- 在v-bind中 -->
<div :id="id | formatId"></div>
```
我们在Vue源码中，也可以看到在`parseText`和`processAttrs`中分别都调用了`parseFilters`方法来解析filters。而`parseText`则是解析文本，也就是在解析双花括号中，会去判断是否存在过滤器，而`processAttrs`则是处理标签上的属性，也就是说在处理v-bind属性的时候，会判断是否存在过滤器。这也和文档中的说明一一对应了起来。

Vue的过滤器，我们需要知道两件事情，第一件就是过滤器是怎么解析的？第二件就是过滤器是怎么被调用的？

### 解析过滤器
在Vue源码中，解析过滤器是通过调用parseFilters方法来解析
```javascript
function parseFilters (exp) {
    var inSingle = false;
    var inDouble = false;
    var inTemplateString = false;
    var inRegex = false;
    var curly = 0;
    var square = 0;
    var paren = 0;
    var lastFilterIndex = 0;
    var c, prev, i, expression, filters;

    for (i = 0; i < exp.length; i++) {
      prev = c;
      c = exp.charCodeAt(i);
      if (inSingle) {
        if (c === 0x27 && prev !== 0x5C) { inSingle = false; }
      } else if (inDouble) {
        if (c === 0x22 && prev !== 0x5C) { inDouble = false; }
      } else if (inTemplateString) {
        if (c === 0x60 && prev !== 0x5C) { inTemplateString = false; }
      } else if (inRegex) {
        if (c === 0x2f && prev !== 0x5C) { inRegex = false; }
      } else if (
        // 这里匹配的是"|"
        c === 0x7C && // pipe
        exp.charCodeAt(i + 1) !== 0x7C &&
        exp.charCodeAt(i - 1) !== 0x7C &&
        !curly && !square && !paren
      ) {
        if (expression === undefined) {
          // first filter, end of expression
          lastFilterIndex = i + 1;
          expression = exp.slice(0, i).trim();
        } else {
          pushFilter();
        }
      } else {
        // 省略代码...
      }
    }
    
    if (expression === undefined) {
      expression = exp.slice(0, i).trim();
    } else if (lastFilterIndex !== 0) {
      pushFilter();
    }
    // 将过滤器添加到一个filters数组中
    function pushFilter () {
      (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
      lastFilterIndex = i + 1;
    }
    
    // 调用wrapFilter方法来包装过滤器
    if (filters) {
      for (i = 0; i < filters.length; i++) {
        expression = wrapFilter(expression, filters[i]);
      }
    }

    return expression
}
```
```javascript
// exp:指的是过滤器前面的表达式
// filter：指的是过滤器
function wrapFilter (exp, filter) {
    // 查看过滤器是是否存在其他参数，比如：{{name | normalize('andy')}}
    // 如果不存在其他参数，那么直接返回"_f(filter)(exp)"
    // 如果存在其他参数，那么就返回"_f(filter)(exp , args)"
    var i = filter.indexOf('(');
    if (i < 0) {
      // _f: resolveFilter
      return ("_f(\"" + filter + "\")(" + exp + ")")
    } else {
      var name = filter.slice(0, i);
      var args = filter.slice(i + 1);
      return ("_f(\"" + name + "\")(" + exp + (args !== ')' ? ',' + args : args))
    }
}
```
通过上面代码中，我们发现Vue中的过滤器是通过调用parseFilter方法来解析过滤器，其实就是解析这样的代码：
```
name | normalize
```
最终被解析为："_f('normalize')(name)"

##### resolveFilter方法
该方法其实就是在this.$options.filters中查找是否存在相应的filter过滤器，如果存在，那么就返回。

### 调用过滤器
我们举个简单的例子：

```javascript
_s(_f("normalize")(name))
```
当执行渲染函数的时候，遇到_f("normalize")，会返回在Vue中定义的filters中的normalize方法，最终就是长这个样子
```javascript
toString(function normalize (name) {
	return name;
}('andy'))
```
上面代码中，会先调用normalize方法，所以会调用定义在filters字段中的normalize方法，并将'andy'传入。返回的值是name，然后调用toString('andy')。最终就得到了过滤器的结果。并渲染到页面上。
