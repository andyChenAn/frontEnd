# Vue模板编译之parse
Vue内部调用parse方法，会将template模板字符串，转为ast。

```javascript
var ast = parse(template.trim(), options);
```

```javascript
function parse (template,options) {
    // 这个是用来缓存模板中解析的每个节点ast
    var stack = [];
    var preserveWhitespace = options.preserveWhitespace !== false;
    var whitespaceOption = options.whitespace;
    // 保存根节点
    var root;
    // 当前解析的标签的父节点
    var currentParent;
    var inVPre = false;
    var inPre = false;
    var warned = false;
    
    // 解析html标签
    parseHTML(template, {
        start: function start (tag, attrs, unary, start$1, end) {
        
        },
        end: function end (tag, start, end$1) {
        
        },
        chars: function chars (text, start, end) {
        
        },
        comment: function comment (text, start, end) {
        
        }
    });
    return root
}
```
我们来看一下parseHTML，具体做了什么？

```javascript
function parseHTML (html, options) {
    var stack = [];
    var index = 0;
    var last, lastTag;
    while (html) {
        last = html;
        // 确保解析的不是script，style，textarea标签里的内容
        if (!lastTag || !isPlainTextElement(lastTag)) {
            // 匹配标签的起始位置
            var textEnd = html.indexOf('<');
            // 如果模板的第一个字符是"<"
            if (textEnd === 0) {
            
            // 如果是注释标签："<!-- 这是注释节点 -->"
            if (comment.test(html)) {
                // 获取注释标签的尾标签的位置
                var commentEnd = html.indexOf('-->');
                if (commentEnd >= 0) {
                    if (options.shouldKeepComment) {
                        options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3);
                    }
                    // 移动index的位置，并且截取html
                    advance(commentEnd + 3);
                    continue
                }
            }
    
            // 匹配条件注释
            if (conditionalComment.test(html)) {
                var conditionalEnd = html.indexOf(']>');
                
                if (conditionalEnd >= 0) {
                    // 移动index的位置，并且截取html
                    advance(conditionalEnd + 2);
                    continue
                }
            }
    
            // 匹配到doctype，过滤掉doctype节点
            var doctypeMatch = html.match(doctype);
            if (doctypeMatch) {
                advance(doctypeMatch[0].length);
                continue
            }
    
            // 匹配到结束标签
            var endTagMatch = html.match(endTag);
            if (endTagMatch) {
                var curIndex = index;
                // 移动index的位置，并且截取html
                advance(endTagMatch[0].length);
                // 解析结束标签
                parseEndTag(endTagMatch[1], curIndex, index);
                continue
            }
    
            // 匹配开始标签，并且处理匹配到的结果
            var startTagMatch = parseStartTag();
            if (startTagMatch) {
                handleStartTag(startTagMatch);
                if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
                    advance(1);
                }
                continue
            }
        }
        
        // 匹配普通文本
        var text = (void 0), rest = (void 0), next = (void 0);
        if (textEnd >= 0) {
            rest = html.slice(textEnd);
            while (
                !endTag.test(rest) &&
                !startTagOpen.test(rest) &&
                !comment.test(rest) &&
                !conditionalComment.test(rest)
            ) {
                // 如果普通文本中存在"<"，那么把<当做普通文本
                next = rest.indexOf('<', 1);
            if (next < 0) { break }
                textEnd += next;
                rest = html.slice(textEnd);
            }
            text = html.substring(0, textEnd);
        }
        if (textEnd < 0) {
            text = html;
        }
        if (text) {
            advance(text.length);
        }
        if (options.chars && text) {
            options.chars(text, index - text.length, index);
        }
    }
    // 省略代码
}
```
#### parseStartTag函数
parseStartTag函数主要用于解析开始标签，该函数做了以下几件事情：

- 1、匹配到标签的头部
- 2、循环匹配标签中的属性或者动态属性(id="app" , :data-name="name")。需要使用while循环，是因为标签可能会存在多个属性，并且标签有可能会同时存在静态属性和动态属性。
- 3、每次成功匹配都会向前移动index的位置，并且截取html。
- 4、匹配标签的尾部(">"或者"/>")，并且设置match的end值为index，表示当前开始标签已经匹配结束了。

所以我们发现handleStartTag函数函数，其实就是处理开始标签，比如：
```html
<div id="box" class="box" :data-name="name">
```
上面这段代码就是处理一个开始标签，里面会处理开始标签的头部，静态属性，动态绑定属性，开始标签的尾部。等到所以这些匹配完了，那么就表示这个开始标签已经被解析完了。

```javascript
function parseStartTag () {
    // 匹配到开始标签，比如："<div"
    var start = html.match(startTagOpen);
    if (start) {
        var match = {
            tagName: start[1],
            attrs: [],
            start: index  // index的初始值为0
        };
        // 移动index位置，并且截取html
        advance(start[0].length);
        var end, attr;
        // startTagClose：这个正则表达式用于匹配标签的尾部，也就是"/> 或者>"
        // dynamicArgAttribute：这个正则表达式用于匹配标签的动态绑定的属性
        // attribute：这个正则表达式用于匹配标签的静态属性
        // 这个循环，主要用于匹配标签中的静态属性和动态绑定的属性
        // 如果匹配到标签的尾部，那么表示这个标签的所有的静态属性和动态属性都已经匹配完了，那么就会退出循环
        // 把匹配到的属性保存在match对象的attrs中。
        while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
            attr.start = index;
            advance(attr[0].length);
            attr.end = index;
            match.attrs.push(attr);
        };
        // 匹配到标签尾部，那么移动index位置，并且把这次match的end值设置为index，表示当前开始标签已经匹配结束了
        if (end) {
            match.unarySlash = end[1];
            advance(end[0].length);
            match.end = index;
            return match
        }
    }
}
```
#### handleStartTag函数

handleStartTag函数主要做了以下几件事情：

- 1、遍历从“开始标签”中解析出来的所有属性，对属性进行重新组装。
- 2、如果该标签不是闭合标签，那么就将组装后的数据保存在stack中。
- 3、调用start函数。

```javascript
function handleStartTag (match) {
    var tagName = match.tagName;
    // ...省略代码
    
    // 遍历属性，将解析出来的属性数据进行重新组装
    var l = match.attrs.length;
    var attrs = new Array(l);
    for (var i = 0; i < l; i++) {
        var args = match.attrs[i];
        var value = args[3] || args[4] || args[5] || '';
        var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines;
        attrs[i] = {
            name: args[1],
            value: decodeAttr(value, shouldDecodeNewlines)
        };
        if (options.outputSourceRange) {
          attrs[i].start = args.start + args[0].match(/^\s*/).length;
          attrs[i].end = args.end;
        }
    }
    
    // 将数据保存在stack数组中
    // 更新lastTag变量的值
    if (!unary) {
        stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end });
        lastTag = tagName;
    }
    // 调用start方法
    if (options.start) {
        options.start(tagName, attrs, unary, match.start, match.end);
    }
}
```
#### parseEndTag函数

parseEndTag函数主要做了以下几件事情：

- 1、查找与当前标签类型相同的，最近的头标签。
- 2、闭合标签

```javascript
function parseEndTag (tagName, start, end) {
    var pos, lowerCasedTagName;
    if (start == null) { start = index; }
    if (end == null) { end = index; }

    // 查找与当前标签类型相同的，最近的头标签
    // 这里的查找方式就是遍历stack，我们知道在处理头标签的时候，会将解析好的头标签中的数据（标签名和属性）保存在stack中。
    // 这里我们发现遍历stack的方式是从后向前遍历，为什么呢？那是因为你第一个匹配到的尾标签所对应的头标签就是stack中的最后一个。
    if (tagName) {
        lowerCasedTagName = tagName.toLowerCase();
        for (pos = stack.length - 1; pos >= 0; pos--) {
            if (stack[pos].lowerCasedTag === lowerCasedTagName) {
                break
            }
        }
    } else {
        // If no tag name is provided, clean shop
        pos = 0;
    }

    if (pos >= 0) {
        // 闭合标签，我们首先找到了头标签的位置，更新stack中保存的头标签的end属性，其实就是把end属性的值更新为匹配到的尾标签的位置。
        // 这样我们就闭合了这个标签。
        for (var i = stack.length - 1; i >= pos; i--) {
            if (i > pos || !tagName && options.warn) {
                options.warn(
                ("tag <" + (stack[i].tag) + "> has no matching end tag."),
                { start: stack[i].start, end: stack[i].end }
                );
            }
            if (options.end) {
                options.end(stack[i].tag, start, end);
            }
        }
        // 从stack中删除匹配的尾标签所对应的头标签
        // 也就是说，我已经匹配到这个完整的标签了，所以才移除stack中的头标签
        // 并且更新lastTag的值。
        stack.length = pos;
        lastTag = pos && stack[pos - 1].tag;
    } else if (lowerCasedTagName === 'br') {
        if (options.start) {
            options.start(tagName, [], true, start, end);
        }
    } else if (lowerCasedTagName === 'p') {
        if (options.start) {
            options.start(tagName, [], false, start, end);
        }
        if (options.end) {
            options.end(tagName, start, end);
        }
    }
}
```
#### end方法

该方法主要做的事情就是闭合标签，其实也就是更新保存在stack中的头标签的end值，将end的值更新为匹配到的尾标签的位置，这样我们就闭合了这个标签。

#### start方法

start方法主要做了以下几件事情：

- 1、创建ast节点，并设置节点的相关属性。
- 2、解析节点的v-for，v-if，v-once指令。

```javascript
function start (tag, attrs, unary, start$1, end) {
    // 创建ast节点
    var element = createASTElement(tag, attrs, currentParent);
    // 设置ast节点属性
    if (options.outputSourceRange) {
        element.start = start$1;
        element.end = end;
        element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
            cumulated[attr.name] = attr;
            return cumulated
        }, {});
    }

    // 如果节点还没有被处理，那么就处理节点
    // processFor：指的是解析节点中的v-for指令
    // processIF：指的是解析节点中的v-if指令
    // processOnce：指的是解析节点中的v-once指令
    if (!element.processed) {
        processFor(element);
        processIf(element);
        processOnce(element);
    }
    if (!root) {
        root = element;
        {
            checkRootConstraints(root);
        }
    }
    // 如果不是单标签，那么就会把这个节点保存在stack中，并且currentParent的值。
    if (!unary) {
        currentParent = element;
        stack.push(element);
    } else {
        closeElement(element);
    }
}
```

#### processFor函数

processFor函数的主要作用就是获取节点中的v-for指令表达式，然后解析这个指令，并且将解析的结果保存在节点中。

```javascript
function processFor (el) {
    var exp;
    // 获取v-for指令的值，然后解析v-for指令。得到一个对象。
    // 格式为：{ alias : xxx , for : xxx , iterator1 : xxx }
    // 比如：v-for="(item , index) in num"，那么alias : item，for ：num，iterator1 : index
    // 把解析后的结果都保存到节点中
    if ((exp = getAndRemoveAttr(el, 'v-for'))) {
        var res = parseFor(exp);
        if (res) {
            extend(el, res);
        } else {
            warn$2(
                ("Invalid v-for expression: " + exp),
                el.rawAttrsMap['v-for']
            );
        }
    }
}
```
#### processIf函数

processIf函数的主要作用是获取v-if，v-else-if，v-else指令的值，处理这些指令。

- 1、获取v-if指令，设置节点的if属性，并将指令表达式和节点保存在节点的ifConditions数组中。
- 2、获取v-else指令，设置节点的else属性。
- 3、获取v-else-if指令，设置节点的elseif属性。

```javascript
function processIf (el) {
    // 获取v-if指令
    var exp = getAndRemoveAttr(el, 'v-if');
    if (exp) {
        el.if = exp;
        addIfCondition(el, {
            exp: exp,
            block: el
        });
    } else {
        // 获取v-else指令
        if (getAndRemoveAttr(el, 'v-else') != null) {
            el.else = true;
        }
        // 获取v-else-if指令
        var elseif = getAndRemoveAttr(el, 'v-else-if');
        if (elseif) {
            el.elseif = elseif;
        }
    }
}
```
当我们匹配到尾标签并处理尾标签的时候，会调用options.end方法，在闭合标签后，会调用closeElement函数。这个函数里面其中就会判断当前闭合的这个节点中，是否存在elseif或者else属性，如果存在，那么就会调用processIfConditions函数。

```javascript
if (element.elseif || element.else) {
    processIfConditions(element, currentParent);
}
```

#### processIfConditions函数

processIfConditions函数主要作用就是，找到当前节点的前一个节点（同级节点），如果前一个节点存在，并且存在if属性，那么就把带有v-else-if或v-else的节点，挂载到带有v-if的节点上。

```javascript
function processIfConditions (el, parent) {
    var prev = findPrevElement(parent.children);
    if (prev && prev.if) {
        addIfCondition(prev, {
            exp: el.elseif,
            block: el
        });
    } else {
        warn(// ...省略代码)
    }
}
```
比如：

```html
<div id="app">
    <span v-for="(item , index) in num" :key="index">
        <em v-if="index == 1" class="a">{{item}}</em>
        <em v-else-if="index == 0" class="b">{{item}}</em>
        <em v-else class="c">{{item}}</em>
    </span>
</div>
```
结果：

```javascript
{
    // ... 省略
    tag : 'em',
    if: "index == 1"
    ifConditions: [
        0: {exp: "index == 1", block: {…}}
        1: {exp: "index == 0", block: {…}}
        2: {exp: undefined, block: {…}}
    ]
}
```
所以我们会发现，我们在写代码的时候，如果存在v-if，v-else-if，v-else，那么这三个都是紧紧相连在一起的，不能分开写，不然就会报错。因为如果中间有存在其他标签的话，那么就会找不到前一个存在v-if的节点，那么就直接报错了。

#### findPrevElement函数

findPrevElement函数主要的作用就是查找当前节点的同级节点。

```javascript
// children指的是，当前节点的父节点中的所有子节点
// 从后向前遍历子节点，如果子节点是一个标签节点，那么就返回这个节点，如果不是标签节点，并且该节点不是一个空白节点，那么就报错
function findPrevElement (children) {
    var i = children.length;
    while (i--) {
        if (children[i].type === 1) {
            return children[i]
        } else {
        if (children[i].text !== ' ') {
            warn$2(
            "text \"" + (children[i].text.trim()) + "\" between v-if and v-else(-if) " +
            "will be ignored.",
            children[i]
            );
        }
        children.pop();
        }
    }
}
```

#### processAttrs函数

这个函数是用来处理节点属性的，主要是节点中的attrsList字段。attrsList中保存的是除了class和style（包括动态绑定的class和style）之外的标签属性。

```javascript
// el：表示需要处理的当前标签节点
function processAttrs (el) {
    // 获取节点的属性，除了class和style之外的属性
    var list = el.attrsList;
    var i, l, name, rawName, value, modifiers, syncGen, isDynamic;
    // 遍历这个属性列表
    for (i = 0, l = list.length; i < l; i++) {
        // 属性名
        name = rawName = list[i].name;
        // 属性值
        value = list[i].value;
        // 如果属性名中存在 "v-" , ":" , " @"这三种符号，
        // 那么表示这个节点有动态绑定数据的，会设置hasBindings为true
        if (dirRE.test(name)) {
            // 标记这个节点为动态的
            el.hasBindings = true;
            // 获取属性名中的修饰符，比如@click.stop.capture="handleClick"，这个属性名中的修饰符就是stop和capture。
            // 解析修饰符，最终返回的是{ stop : true , capture : true }
            modifiers = parseModifiers(name.replace(dirRE, ''));
            // 如果修饰符存在，那么把修饰符去掉，得到属性名
            if (modifiers) {
                name = name.replace(modifierRE, '');
            }
            
            // 处理带有v-bind（或者:）的属性
            // v-bind属性允许有三种修饰符，.prop，.camel，.sync三种
            if (bindRE.test(name)) {
                // 重新获取属性名，去掉v-bind或者:
                name = name.replace(bindRE, '');
                value = parseFilters(value);
                isDynamic = dynamicArgRE.test(name);
                if (isDynamic) {
                    name = name.slice(1, -1);
                }
                // 属性值如果为空，那么就会报错
                if (value.trim().length === 0) {
                    warn$2(
                      ("The value for a v-bind expression cannot be empty. Found in \"v-bind:" + name + "\"")
                    );
                }
                if (modifiers) {
                    //处理.prop
                    if (modifiers.prop && !isDynamic) {
                        name = camelize(name);
                        if (name === 'innerHtml') { name = 'innerHTML'; }
                    }
                    // 处理.camel，转为驼峰写法
                    if (modifiers.camel && !isDynamic) {
                        name = camelize(name);
                    }
                    // 处理.sync
                    if (modifiers.sync) {
                        syncGen = genAssignmentCode(value, "$event");
                        if (!isDynamic) {
                        addHandler(
                            el,
                            ("update:" + (camelize(name))),
                            syncGen,
                            null,
                            false,
                            warn$2,
                            list[i]
                        );
                        if (hyphenate(name) !== camelize(name)) {
                            addHandler(
                                el,
                                ("update:" + (hyphenate(name))),
                                syncGen,
                                null,
                                false,
                                warn$2,
                                list[i]
                                );
                            }
                        } else {
                            // handler w/ dynamic event name
                            addHandler(
                                el,
                                ("\"update:\"+(" + name + ")"),
                                syncGen,
                                null,
                                false,
                                warn$2,
                                list[i],
                                true // dynamic
                            );
                        }
                    }
                };
                // 添加属性，最后都挂载在节点的attrs属性上，或者节点的props属性上
                if ((modifiers && modifiers.prop) || (
                    !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
                )) {
                    addProp(el, name, value, list[i], isDynamic);
                } else {
                    addAttr(el, name, value, list[i], isDynamic);
                }
            } else if (onRE.test(name)) {
                // 处理v-on/@属性
                // 获取属性名
                name = name.replace(onRE, '');
                isDynamic = dynamicArgRE.test(name);
                if (isDynamic) {
                    name = name.slice(1, -1);
                }
                // 添加事件，保存在节点的events属性上
                /* {
                    !click:    // !号表示的是事件捕获@click.capture
                        dynamic: false
                        end: 119
                        modifiers: {stop: true}
                        start: 86
                        value: "handleClick"
                    }
                */
                addHandler(el, name, value, modifiers, false, warn$2, list[i], isDynamic);
            } else {
                // 其他的"v-"指令处理
                // 其他的"v-xxx"指令会被保存在节点的directives属性上
                name = name.replace(dirRE, '');
                var argMatch = name.match(argRE);
                var arg = argMatch && argMatch[1];
                isDynamic = false;
                if (arg) {
                    name = name.slice(0, -(arg.length + 1));
                    if (dynamicArgRE.test(arg)) {
                        arg = arg.slice(1, -1);
                        isDynamic = true;
                    }
                }
                // 添加指令，保存在节点的directives属性上
                addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i]);
                if (name === 'model') {
                    checkForAliasModel(el, value);
                }
            }
        } 
    }
}
```
上面的代码中，我们可以发现：

- 1、动态绑定的属性(v-bind或者:)被保存在节点的props或者attrs中。
- 2、保存到el.props中的属性，都会转为驼峰写法，那是因为dom属性都是以驼峰写法命名的，而innerHTML这个属性比较特殊，所以会做特别处理。

```javascript
if (modifiers.prop && !isDynamic) {
    name = camelize(name);
    if (name === 'innerHtml') { name = 'innerHTML'; }
}
```
- 3、绑定的属性如果存在修饰符sync，那么子组件内部可以通过this.$emit('update:name' , xxx)的方式来修改父组件的数据，addHandler函数就是把事件名和回调保存在el.events中，这个会在之后的自定义事件绑定的时候再进行处理，最后就会变成这样：

```javascript
@update:name ="function($event){ xxx = $event }"
```
- 4、如果匹配到@或者v-on的时候，那么就属于绑定事件，会直接调用addHandler函数，将事件保存在el.events中。
- 5、如果匹配到带有v-的属性，那么就会被保存到el.directives中。
- 6、普通属性，会被直接保存在el.attrs中。

那这里就会区分什么属性会被保存在el.props中，什么属性会被保存在el.attrs中？

- 1、如果绑定的属性带有修饰符prop，那么这个属性会被保存到el.props中，否则就会被保存到el.attrs中。
- 2、当元素是input,textarea,option,select,progress，绑定的属性是value时，会把属性保存在el.props中。
- 3、当元素是option，绑定的属性是selected时，也会把属性保存在el.props中。
- 4、当元素是input，绑定的属性是checked时，也会把属性保存在el.props中。
- 5、当元素是video，绑定的属性是muted时，也会把属性保存在el.props中。

#### el.props和el.attrs有什么区别？

el.props是直接添加到dom对象的属性上，而不会显示在标签上。el.attrs是添加到dom标签属性上，会显示在标签上的。

### 总结

parse阶段主要是对template的标签以及标签属性进行解析。将解析后的数据保存在当前节点上。

