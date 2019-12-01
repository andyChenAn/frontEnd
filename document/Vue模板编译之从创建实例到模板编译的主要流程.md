# Vue模板编译之从创建实例到模板编译的主要流程
我们先来看一下从创建一个Vue实例到模板编译这一过程Vue内部会执行什么？

当我们创建一个Vue实例，首先会执行Vue.prototype._init方法，这个方法的作用就是初始化实例。

```javascript
Vue.prototype._init = function (options) {
    var vm = this;
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    );
    // ...省略代码
    
    // el表示的是，Vue组件要挂载的DOM节点，如果存在，那么就会执行Vue实例的$mount方法，进行挂载
    if (vm.$options.el) {
        vm.$mount(vm.$options.el);
    }
};
```
通过上面的代码，我们可以发现，在_init方法内，在Vue进行一系列初始化之后，就会调用Vue实例的$mount方法。

```javascript
Vue.prototype.$mount = function (el,hydrating) {
    el = el && query(el);
    var options = this.$options;
    // 解析模板，并且将模板转为渲染函数
    if (!options.render) {
        
        // 获取template模板
        var template = options.template;
        if (template) {
            // 如果template是字符串，并且第一个字符是"#"，那么表示template的值时一个id，那么就会通过doucment.querySelect('#id')的方式获取dom，然后通过dom.innerHTML来获取dom中的html。将其作为template模板
            if (typeof template === 'string') {
                if (template.charAt(0) === '#') {
                    template = idToTemplate(template);
                    if (!template) {
                        warn(
                        ("Template element not found or is empty: " +(options.template)),this);
                    }
                }
            // 如果传入的template字段的值时一个DOM元素，那么就直接通过innerHTML获取template模板
            } else if (template.nodeType) {
                template = template.innerHTML;
            } else {
                {
                    warn('invalid template option:' + template, this);
                }
                return this
            }
        // 当template不存在的时候，那么如果存在el字段，那么就拿el的html作为template模板
        } else if (el) {
            template = getOuterHTML(el);
        }
        
        // 将模板字符串转为渲染函数
        if (template) {
            var ref = compileToFunctions(template, {
              outputSourceRange: "development" !== 'production',
              shouldDecodeNewlines: shouldDecodeNewlines,
              shouldDecodeNewlinesForHref: shouldDecodeNewlinesForHref,
              delimiters: options.delimiters,
              comments: options.comments
            }, this);
            var render = ref.render;
            var staticRenderFns = ref.staticRenderFns;
            options.render = render;
            options.staticRenderFns = staticRenderFns;
        }
    }
    // 调用mount
    return mount.call(this, el, hydrating)
};
```
Vue实例的$mount方法，主要做了以下几件事情：
- 1、获取template模板
- 2、生成render函数
- 3、将render和staticRenderFns函数保存在vm.$options上（保存render函数）

上面代码中，我们大概知道Vue内部是调用compileToFunctions方法来将template模板转为渲染函数的。

从源码中我们发现，compileToFunctions函数是通过调用createCompiler函数返回的，createCompiler函数是调用createCompilerCreator函数返回的。

```javascript
var createCompiler = createCompilerCreator(functionbaseCompile(template,options) {
    var ast = parse(template.trim(), options);
    if (options.optimize !== false) {
        optimize(ast, options);
    }
    var code = generate(ast, options);
    return {
        ast: ast,
        render: code.render,
        staticRenderFns: code.staticRenderFns
    }
});
```

```javascript
function createCompilerCreator (baseCompile) {
    return function createCompiler (baseOptions) {
        function compile (template,options) {
            // ...省略代码
        }
        // 返回一个对象，保存了compile函数
        return {
            compile: compile,
            compileToFunctions: createCompileToFunctionFn(compile)
        }
    }
}
```

```javascript
// 调用createCompiler函数，返回一个对象
//        return {
//            compile: compile,
//            compileToFunctions: createCompileToFunctionFn(compile)
//        }
var ref$1 = createCompiler(baseOptions);
var compile = ref$1.compile;
var compileToFunctions = ref$1.compileToFunctions;
```
compileToFunctions方法是通过调用createCompileToFunctionFn函数返回的。
```javascript
function createCompileToFunctionFn (compile) {
    var cache = Object.create(null);
    return function compileToFunctions (template,options,vm) {
        // ...省略代码
        return (cache[key] = res)
    }   
}
```

```javascript
var ref = compileToFunctions(template, {
    outputSourceRange: "development" !== 'production',
    shouldDecodeNewlines: shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: shouldDecodeNewlinesForHref,
    delimiters: options.delimiters,
    comments: options.comments
}, this);
```
上面代码中执行的compileToFunctions函数，其实也就是调用createCompileToFunctionFn函数返回的函数。

从上面代码中，我们发现，调用createCompiler函数，其实返回的就是一个对象：
```javascript
return {
    compile: compile,
    compileToFunctions: createCompileToFunctionFn(compile)
}
```
返回的对象，包含两个属性compile和compileToFunctions，这两个函数的作用大致差不多，都是执行内部的compile函数，那么为什么会多出一个compileToFunctions函数呢？

#### 为什么会多出一个compileToFunctions呢？
这是因为要做模板缓存。compileToFunctions没有直接等于compile，而是把compile传递给createCompileToFunctionFn函数，compileToFunctions的值其实就是createCompileToFunctionFn函数返回的函数。

而createCompileToFunctionFn函数的主要作用就是缓存模板，当模板编译完之后，就会把模板缓存起来。所以模板编译完一次之后，就会被缓存起来，下次再编译的时候就直接从缓存中取，避免了每个实例被编译很多次，从而提高性能。

```javascript
function createCompileToFunctionFn (compile) {
    // 设置缓存
    var cache = Object.create(null);
    return function compileToFunctions (template, options, vm) {
        options = extend({}, options);
        var warn$$1 = options.warn || warn;
        delete options.warn;
        
        // 检查缓存，如果缓存里面有，那么就直接取缓存
        // 缓存时用模板字符串作为key
        var key = options.delimiters
            ? String(options.delimiters) + template
            : template;
        if (cache[key]) {
            return cache[key]
        }
    
        // 编译模板
        var compiled = compile(template, options);
        
        // 将编译后的代码转为函数   
        var res = {};
        var fnGenErrors = [];
        res.render = createFunction(compiled.render, fnGenErrors);
        res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
            return createFunction(code, fnGenErrors)
        });
        // 将编译结果保存在缓存对象中
        return (cache[key] = res)
    }
}
```
#### 缓存是怎么实现的呢？

使用一个cache闭包变量，当实例第一次被编译时，就会被存到这个cache变量中，当实例第二次被编译时，那么就会从cache变量中取。

什么时候实例（组件）会被编译第二次呢？比如你从A页面跳转到B页面，然后又从B页面跳转到A页面，这个时候，A页面这个组件实例就会被编译两次，但是由于我们存在缓存，所以第二次编译模板的时候，就直接从缓存中取，而不需要再进行编译。