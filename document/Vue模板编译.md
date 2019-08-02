# Vue模板编译
Vue会将我们编写的字符串模板转为ast，具体是调用parseHTML方法，将模板字符串放在一个while循环中，然后一段一段的截取，把截取到的每一段字符串进行解析，直到最后全部截完了。

我们来举个例子，字符串模板是这样的
```html
<div id="app">
    <div @click="handle" class="box" style="font-size: 20px;color: #f60;">{{name}}</div>
</div>
```
## parseHTML方法
```javascript
function parseHTML (html, options) {
    var stack = [];
    var expectHTML = options.expectHTML;
    var isUnaryTag$$1 = options.isUnaryTag || no;
    var canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || no;
    // 游标
    var index = 0;
    var last, lastTag;
    // 循环，一段一段的截取模板字符串
    while (html) {
        last = html;
        // 确保不是script/style标签之间的内容
        if (!lastTag || !isPlainTextElement(lastTag)) {
            // 匹配"<"开始标签，这里需要注意并不是所有以"<"开头的都是开始标签，像结束标签，注释标签，Doctype标签，条件注释，这些都是以"<"开始，所有我们需要先过滤掉这些内容
            var textEnd = html.indexOf('<');
            // 处理模板字符串一开始就是“<”的情况
            if (textEnd === 0) {
                // Comment:
                // 如果是注释内容，那么就会将<!-- XX -->注释内容过滤掉。
                // 当这里调用advance(commentEnd + 3);其实就是将游标移动到"-->"的后面。这样就过滤掉了注释内容
                if (comment.test(html)) {
                    // 找到注释节点的结束标签
                    var commentEnd = html.indexOf('-->');
                    if (commentEnd >= 0) {
                        if (options.shouldKeepComment) {
                          options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3);
                        }
                        // 从找到结束标签的位置开始，+3，其实就是加上结束标签的长度，这样我们就可以过滤掉注释节点的所有内容
                        advance(commentEnd + 3);
                        continue
                    }
                }
            
                // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
                // 如果是条件注释内容，一般我们在兼容IE时候，会出现
                // 类似于这种<![if !IE]>
                if (conditionalComment.test(html)) {
                    var conditionalEnd = html.indexOf(']>');
                    
                    if (conditionalEnd >= 0) {
                        advance(conditionalEnd + 2);
                        continue
                    }
                }
            
                // Doctype:
                // 如果是Doctype内容，那么就过滤掉注释内容
                var doctypeMatch = html.match(doctype);
                if (doctypeMatch) {
                    advance(doctypeMatch[0].length);
                    continue
                }
            
                // End tag:
                // 如果是结束标签
                var endTagMatch = html.match(endTag);
                if (endTagMatch) {
                  var curIndex = index;
                  advance(endTagMatch[0].length);
                  parseEndTag(endTagMatch[1], curIndex, index);
                  continue
                }
            
                // Start tag:
                // 如果是开始标签，那么就解析开始标签，这里调用parseStartTag()方法，其实就是匹配到标签的开始部分内容
                var startTagMatch = parseStartTag();
                if (startTagMatch) {
                    
                    handleStartTag(startTagMatch);
                    if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
                    advance(1);
                    }
                    continue
                }
            }
        
            var text = (void 0), rest = (void 0), next = (void 0);
            // 当截掉一段模板字符串之后，再匹配元素的开始标签"<"，这个时候可能会有空格的情况或者是文本的情况，所以不会是一上来就匹配到，所以会先调用字符串的slice方法，把空格或者文本过滤掉
            if (textEnd >= 0) {
                // 过滤掉空格，得到一个没有空格的模板字符串
                rest = html.slice(textEnd);
                while (
                    !endTag.test(rest) &&
                    !startTagOpen.test(rest) &&
                    !comment.test(rest) &&
                    !conditionalComment.test(rest)
                ) {
                // < in plain text, be forgiving and treat it as text
                    next = rest.indexOf('<', 1);
                    if (next < 0) { break }
                    textEnd += next;
                    rest = html.slice(textEnd);
                }
                // 将空格截取出来
                text = html.substring(0, textEnd);
            }
        
            if (textEnd < 0) {
                text = html;
            }
            
            // 更新游标，并且在模板字符串中截掉空格
            if (text) {
                advance(text.length);
            }
            // 处理文本字符
            if (options.chars && text) {
                options.chars(text, index - text.length, index);
            }
        } else {
            var endTagLength = 0;
            var stackedTag = lastTag.toLowerCase();
            var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
            var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
                endTagLength = endTag.length;
                if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
                    text = text
                    .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
                    .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
                }
                if (shouldIgnoreFirstNewline(stackedTag, text)) {
                    text = text.slice(1);
                }
                if (options.chars) {
                    options.chars(text);
                }
                return ''
            });
            index += html.length - rest$1.length;
            html = rest$1;
            parseEndTag(stackedTag, index - endTagLength, index);
        }
    
        if (html === last) {
            options.chars && options.chars(html);
            if (!stack.length && options.warn) {
                options.warn(("Mal-formatted tag at end of template: \"" + html + "\""), { start: index + html.length });
            }
            break
        }
    }
    // Clean up any remaining tags
    parseEndTag();
}
```
## parseStartTag方法
调用这个方法用来解析开始标签，主要包括标签元素，标签元素里的Vue特性，元素的属性，并且截取相应的模板字符串，更新游标位置
```javascript
// 这个方法就是解析一个元素的开始标签中的所有内容，包括标签元素，vue特性，元素属性
function parseStartTag () {
    // 匹配到开始标签的内容，这里就是匹配到了"<div"
    var start = html.match(startTagOpen);
    // 如果匹配成功，那么就相关信息保存早match对象中
    if (start) {
        var match = {
            tagName: start[1],  // 标签元素
            attrs: [],  // 标签元素的属性
            start: index  // 匹配开始标签内容的位置
        };
        // 调用advance方法，移动游标到length的位置，并且截取length之后的模板字符串
        advance(start[0].length);
        var end, attr;
        // 第一个正则是匹配当前标签的结束部分，开始标签的开始部分是"<"，那么结束部分就是">"或者"/>"
        // 第二个正则是匹配符合vue的特性
        // 第三个正则是匹配元素上的属性
        // 如果标签的结束部分没有匹配到，并且存在vue特性或者标签属性，那么我们将匹配到的内容保存在match上，同时更新游标以及截取相应的模板字符串长度
        // 如果匹配到标签的结束部分，那么while循环结束
        // 这个循环的主要作用就是用来匹配标签元素上的vue特性和标签元素本身的属性
        while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
            attr.start = index;
            advance(attr[0].length);
            attr.end = index;
            match.attrs.push(attr);
        }
        // 当匹配到标签的结束部分，那么更新游标并且截取相应的模板字符串
        // 到这里其实match里面保存了一个元素的开始标签部分的所有信息
        // 主要包括：一个元素的开始标签的起始位置和结束位置，一个元素的vue特性以及元素的属性
        if (end) {
            match.unarySlash = end[1];
            advance(end[0].length);
            match.end = index;
            return match
        }
    }
}
```
## handleStartTag方法
```javascript
function handleStartTag (match) {
    var tagName = match.tagName;
    var unarySlash = match.unarySlash;

    if (expectHTML) {
        if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
            parseEndTag(lastTag);
        }
        if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
            parseEndTag(tagName);
        }
    }

    var unary = isUnaryTag$$1(tagName) || !!unarySlash;
    
    // 处理标签元素的Vue特性或元素属性，遍历元素所有的特性或属性，并将值保存在attrs数组中。
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
    
    // 将解析后的值保存在stack数组中，并更新lastTag值。
    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end });
      lastTag = tagName;
    }
    
    if (options.start) {
        options.start(tagName, attrs, unary, match.start, match.end);
    }
}
```
## parseEndTag方法
该方法

```javascript
function parseEndTag (tagName, start, end) {
    var pos, lowerCasedTagName;
    if (start == null) { start = index; }
    if (end == null) { end = index; }

    // 找到距离这个结束标签最近的开始标签，其实也就是查找与这个结束标签对应的开始标签
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
        // Close all the open elements, up the stack
        for (var i = stack.length - 1; i >= pos; i--) {
            if (i > pos || !tagName &&
                options.warn
            ) {
                options.warn(
                    ("tag <" + (stack[i].tag) + "> has no matching end tag."),
                    { start: stack[i].start, end: stack[i].end }
                );
            }
            // 调用end方法，对这个标签元素进行处理
            if (options.end) {
                options.end(stack[i].tag, start, end);
            }
        }
    
        // Remove the open elements from the stack
        // 当元素处理完之后，就从这个stack数组中移除
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
当模板字符串解析完成之后，会得到一个element ast，也就是我们将一个模板转化成了一个ast，ast本身就是一个对象。结构如下：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/vue/3.png)

## 总结
1、通过while循环，一段一段的截取模板字符串，而截取的思路是如下：

```html
<div id="app">
    <div @click="handle" class="box" style="font-size: 20px;color: #f60;">{{name}}</div>
</div>
```

```html
id="app">
    <div @click="handle" class="box" style="font-size: 20px;color: #f60;">{{name}}</div>
</div>
```

```html
>
    <div @click="handle" class="box" style="font-size: 20px;color: #f60;">{{name}}</div>
</div>
```

```html
@click="handle" class="box" style="font-size: 20px;color: #f60;">{{name}}</div>
</div>
```

```html
>{{name}}</div>
</div>
```

```html
</div>
</div>
```

```html
</div>
```
2、对截取的字符串做解析，主要是处理标签元素，标签的属性，以及标签的文本内容。
