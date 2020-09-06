# Vue渲染之render
我们将模板编译完之后，就会生成render函数，调用render函数会生成vnode虚拟节点。

我们来举一个简单的例子看一下具体的流程是怎么样的

```html
<div id="app">
    <div :name="name">{{num}}</div>
</div>

new Vue({
    el : '#app',
    data : {
        num : 111,
        name : 'andy'
    }
});
```
模板编译之后，最终生成的render函数如下：

```javascript
with (this) {
    return _c(
        'div' , 
        {
            attrs : {"id" : "app"}
        },
        [
            _c(
            'div',
            {
              arrs : {"name" : "andy"}  
            },
            [
                _v(_s(num))
            ])
        ]
    )
}


```
上面代码中模板编译之后得到的render函数，我们看到代码中有_c,_v,_s，这些函数表示的是什么呢？通过源码我们发现：

- _s指的就是toString函数，也就是说，会把数据转为字符串，如果数据是对象或者数组的话，那么会调用JSON.stringify()方法，将对象转为字符串，如果是基本类型的数据，那么直接调用String()方法转为字符串。

```javascript
target._s = toString;
function toString (val) {
    return val == null
      ? ''
      : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
        ? JSON.stringify(val, null, 2)
        : String(val)
}
```
- _v指的是createTextVNode函数，这个函数主要是用来创建文本节点。
- _c指的是createElement函数，这个函数主要用来创建元素节点。

```javascript
vm._c = function (a, b, c, d) { 
    return createElement(vm, a, b, c, d, false); 
};
```
createElement函数才是我们渲染的重点

```javascript
function createElement (
    context,
    tag,
    data,
    children,
    normalizationType,
    alwaysNormalize
) {
    // 主要是对参数进行处理，重新赋值
    // 如果data是一个数组或者基本类型，那么data表示的是children也就是传入的子节点，所以需要对参数重新进行赋值，以保证参数准确
    if (Array.isArray(data) || isPrimitive(data)) {
        normalizationType = children;
        children = data;
        data = undefined;
    }
    if (isTrue(alwaysNormalize)) {
        normalizationType = ALWAYS_NORMALIZE;
    }
    return _createElement(context, tag, data, children, normalizationType)
}
```
```javascript
// 创建节点
function _createElement (
    context,
    tag,
    data,
    children,
    normalizationType
  ) {
  // 创建vnode节点
   vnode = new VNode(
      config.parsePlatformTagName(tag), data, children,
      undefined, undefined, context
    );
}
```
所以我们可以看到，调用render函数，最后就是创建vnode。
```javascript
{
    tag : 'div',
    data : {
        attrs : {
            "id" : "app"
        }
    },
    children : [
        {
            tag : 'div',
            data : {
                attrs : {
                    "name" : "andy"
                }
            },
            children : [
                {
                    tag : undefined,
                    data : undefined,
                    children : undefined
                    text : 111
                }
            ]
        }
    ]
}
```
如果我们是通过v-for来遍历生成vnode，比如：

```
<div>
    <span v-for="index in 3">{{index}}</span>
</div>
```
通过编译，得到的render函数是这样的：

```javascript
with(this){return _c('div',{attrs:{"id":"app"}},_l((3),function(index){return _c('div',[_v(_s(index))])}),0)}
```
我们发现这里有一个_l方法，这个方法就是renderList方法

```javascript
target._l = renderList;
// val是遍历的对象（数组，数字，对象，字符串）
// render是渲染函数
// 也就是上面的function(index){return _c('div',[_v(_s(index))])}
function renderList (
    val,
    render
  ) {
    var ret, i, l, keys, key;
    if (Array.isArray(val) || typeof val === 'string') {
    // 如果是数组或者字符串，那么就遍历这个数组或字符串并调用render
      ret = new Array(val.length);
      for (i = 0, l = val.length; i < l; i++) {
        ret[i] = render(val[i], i);
      }
    } else if (typeof val === 'number') {
    // 如果值是一个数字
      ret = new Array(val);
      for (i = 0; i < val; i++) {
        ret[i] = render(i + 1, i);
      }
    } else if (isObject(val)) {
    // 如果值是一个对象，并且是一个迭代器对象
      if (hasSymbol && val[Symbol.iterator]) {
        ret = [];
        var iterator = val[Symbol.iterator]();
        var result = iterator.next();
        while (!result.done) {
          ret.push(render(result.value, ret.length));
          result = iterator.next();
        }
      } else {
      // 值是一个普通对象
        keys = Object.keys(val);
        ret = new Array(keys.length);
        for (i = 0, l = keys.length; i < l; i++) {
          key = keys[i];
          ret[i] = render(val[key], key, i);
        }
      }
    }
    // 如果值不属于上面的几种情况，那么就直接返回一个空数组
    if (!isDef(ret)) {
      ret = [];
    }
    (ret)._isVList = true;
    // 返回vnode元素的数组
    return ret
}
```
所以render之后生成的vnode是这样的：
```javascript
{
    tag : 'div',
    children : [
        {
            tag : 'span',
            data : undefined,
            children : [
                {
                    tag : undefined,
                    text : 1
                }
            ]
        },
        {
            tag : 'span',
            data : undefined,
            children : [
                {
                    tag : undefined,
                    text : 2
                }
            ]
        },
        {
            tag : 'span',
            data : undefined,
            children : [
                {
                    tag : undefined,
                    text : 3
                }
            ]
        }
    ]
}
```