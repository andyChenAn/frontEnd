# Vue创建实例时会做哪些事情
Vue的生命周期分为以下几个阶段：
- 1、创建实例阶段
- 2、挂载阶段
- 3、更新阶段
- 4、销毁阶段

## 创建实例阶段
创建Vue实例阶段又可以分为创建实例前和创建实例后。创建实例前，会调用beforeCreate生命周期钩子，创建实例后，会调用created生命周期钩子。
```javascript
vm._self = vm;
// 初始化生命周期
initLifecycle(vm);
// 初始化事件
initEvents(vm);
// 初始化渲染函数
initRender(vm);
// 调用beforeCreate生命周期函数
callHook(vm, 'beforeCreate');
// 在初始化数据之前先处理依赖注入的数据
initInjections(vm); // resolve injections before data/props
// 初始化数据
initState(vm);
// 在初始化数据之后，再处理给其子孙组件提供的依赖
initProvide(vm); // resolve provide after data/props
// 创建Vue实例完成，调用created生命周期函数
callHook(vm, 'created');
```
#### beforeCreate生命周期钩子函数
当beforeCreate生命周期钩子函数调用的时候，我们是不能获取到data数据的。因为此时还没有将data数据挂载到Vue实例上。从上面代码中我们可以看到，beforeCreate生命周期函数调用的时候，vue已经对生命周期、事件、渲染函数进行了初始化。所以我们来看一下initLifecycle，initEvents，initRender这三个函数都执行了什么。
- **1、initLifecycle函数**

initLifecycle函数，主要作用是初始化生命周期相关的属性，以及设置vue实例的父组件，子组件，根组件，以及注册了ref引用的组件。
```javascript
function initLifecycle (vm) {
    var options = vm.$options;
    
    // 查找第一个非抽象组件parent
    // 如果存在父组件，并且父组件不是一个抽象组件，那么就循环，直到找到第一个父组件不是抽象组件，那么就将这个组件赋值给parent变量
    // 我们可以看一下while循环，如果父组件是一个抽象组件，并且该组件还有父组件，那么就继续寻找他的父组件，直到找到第一个非抽象组件的父组件为止。
    // 当找到父组件，那么就将当前组件添加到父组件的$chilren属性中。
    var parent = options.parent;
    if (parent && !options.abstract) {
      while (parent.$options.abstract && parent.$parent) {
        parent = parent.$parent;
      }
      // 将当前组件添加到父组件的$children属性中
      parent.$children.push(vm);
    }
    
    // 将父组件赋值给当前组件的$parent属性，这样我们可以通过$parent属性来查找到该组件的父组件
    // 通过组件的$children属性，我们可以找到该组件所有的子组件。
    vm.$parent = parent;
    // 设置组件的根组件
    vm.$root = parent ? parent.$root : vm;
    
    // 组件下的所有子组件
    vm.$children = [];
    // 添加了ref引用的子组件
    vm.$refs = {};
    
    vm._watcher = null;
    // 表示keep-alive中组件状态，如被激活，该值为false,反之为true。
    vm._inactive = null;
    vm._directInactive = false;
    // 当前组件是否完成挂载
    vm._isMounted = false;
    // 当前组件是否被销毁
    vm._isDestroyed = false;
    // 当前组件正在被销毁，介于beforeDestroy和destroyed之间，还没有销毁完成
    vm._isBeingDestroyed = false;
}
```
- **2、initEvents函数**

initEvents函数主要做的是，创建一个空对象，并且将这个空对象赋值给当前组件的_events属性，并且设置当前组件的 _hasHookEvent 属性为false。说白了，这里就是初始化一个事件属性用来保存当前组件所有的事件监听器。
```javascript
function initEvents (vm) {
    // 创建一个空对象，用来保存当前组件的事件监听器
    vm._events = Object.create(null);
    vm._hasHookEvent = false;
    // init parent attached events
    var listeners = vm.$options._parentListeners;
    if (listeners) {
        updateComponentListeners(vm, listeners);
    }
}
```
- **3、initRender函数**

initRender函数主要作用是，初始化渲染函数。该方法主要是：1、处理插槽，2、绑定当前实例到createElement上，3、绑定组件的$attrs和$listeners属性，将其设置为响应式。

```javascript
function initRender (vm) {
    vm._vnode = null; 
    vm._staticTrees = null; 
    var options = vm.$options;
    
    // 父组件
    var parentVnode = vm.$vnode = options._parentVnode; 
    
    // 获取父组件的渲染上下文
    var renderContext = parentVnode && parentVnode.context;
    
    // 处理插槽和作用域插槽
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
    vm.$scopedSlots = emptyObject;
    
    // 将createElement绑定到当前Vue实例，以便可以获取当前渲染上下文
    vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
    vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };
    
    // $attrs:包含了父作用域中不作为prop被识别的特性绑定。当一个组件没有声明任何prop时，这里会包含所有父作用域的绑定（class和style除外），并且可以通过v-bind="$attrs"传入内部组件
    // $listeners:包含了父作用域中的（不含.native修饰器的）v-on事件监听器，它可以通过v-on="$listeners"传入内部组件。
    // 所以$attrs和$listeners都必须是响应式的
    // 调用defineReactive$$1，就是将$attrs和$listeners设置为响应式
    var parentData = parentVnode && parentVnode.data;
    {
        defineReactive$$1(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
            !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
        }, true);
        defineReactive$$1(vm, '$listeners', options._parentListeners || emptyObject, function () {
            !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
        }, true);
    }
} 
```
- **4、resolveSlots函数**

resolveSlots函数，主要是用来处理组件插槽，最终会返回一个对象，对象的数据格式如下：

```javascript
{
    default : [VNode],
    name1 : [VNode1],
    name2 : [VNode2]
}
```
```javascript
// children参数：指的是当前组件的所有子组件
// context参数：当前组件的父组件的渲染上下文
function resolveSlots (children,context) {
    // 如果没有子组件，那么就返回一个空对象
    if (!children || !children.length) {
        return {}
    }
    
    // 初始化插槽内容
    var slots = {};
    
    // 遍历当前组件下的所有子组件
    for (var i = 0, l = children.length; i < l; i++) {
        var child = children[i];
        var data = child.data;

        // 如果这个子节点被解析为Vue的插槽节点，那么就删除这个子组件上的slot特性，因为该子组件上的这个特性已经被作为Vue插槽，那么需要删除
        if (data && data.attrs && data.attrs.slot) {
            delete data.attrs.slot;
        }
        
        // 只有在相同的渲染上下文中渲染组件时，才应该使用具名插槽
        // 如果渲染上下文不相同，那么就定义一个默认的插槽
        if ((child.context === context || child.fnContext === context) &&
            data && data.slot != null
        ) {
            var name = data.slot;
            var slot = (slots[name] || (slots[name] = []));
            if (child.tag === 'template') {
                slot.push.apply(slot, child.children || []);
            } else {
                slot.push(child);
            }
        } else {
            (slots.default || (slots.default = [])).push(child);
        }
    }
    // 忽略仅仅只包含空白的插槽，包括注释节点，文本为空的节点
    for (var name$1 in slots) {
        if (slots[name$1].every(isWhitespace)) {
            delete slots[name$1];
        }
    }
    return slots
}
```
通过上面我们可以了解到，在调用beforeCreate生命周期钩子前，会做哪些事情。我们再来看一下在调用created生命周期钩子前，会做什么？

#### created生命周期钩子

- **1、initInjections函数**

initInjections函数主要作用是，初始化组件依赖注入的数据。

```javascript
function initInjections (vm) {

// 处理当前组件从父组件那里接收到的依赖注入的数据，返回的是一个对象
var result = resolveInject(vm.$options.inject, vm);
    if (result) {
        // 设置shouldObservew标志位为false
        toggleObserving(false);
        // 将组件依赖的数据挂载到组件实例上，但是当我们去修改依赖的数据时，就会警告，不能直接修改依赖的数据
        Object.keys(result).forEach(function (key) {
            {
                defineReactive$$1(vm, key, result[key], function () {
                    warn(
                        "Avoid mutating an injected value directly since the changes will be " +
                        "overwritten whenever the provided component re-renders. " +
                        "injection being mutated: \"" + key + "\"",
                        vm
                    );
                });
            }
        });
        // 重新设置shouldObservew标志位为true
        toggleObserving(true);
    }
}
```
- **2、resolveInject函数**

resolveInject函数的主要作用就是，处理当前组件从父组件那里接收到的依赖注入的数据。

```javascript

function resolveInject (inject, vm) {
    if (inject) {
        // inject is :any because flow is not smart enough to figure out cached
        
        // 创建一个空对象，用来保存依赖注入的数据
        var result = Object.create(null);
        
        // 获取依赖注入的数据对象的键
        var keys = hasSymbol
        ? Reflect.ownKeys(inject)
        : Object.keys(inject);
        
        // 遍历所有的键
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];

            // 防止依赖注入的数据对象是可响应式的，如果是可响应的，那么就跳过
            if (key === '__ob__') { 
                continue 
            }
            // from 属性是在可用的注入内容中搜索用的 key (字符串或 Symbol)，也就是说，通过from我们可以找到注入的key对应的值
            var provideKey = inject[key].from;
            
            // 从当前组件开始遍历依次向上查找父组件中的provide对象中的key对应的值
            var source = vm;
            while (source) {
                // 是否存在provide，并且provide对象上是否存在key
                // 如果存在，那么就取出key对应的值，保存在result中，并退出循环
                // 如果没有找到，那么就查找当前组件父组件上的provide，直到所有的父组件都查找完为止
                if (source._provided && hasOwn(source._provided, provideKey)) {
                    result[key] = source._provided[provideKey];
                    break
                }
                source = source.$parent;
            }
            
            // 如果当前组件的祖先组件都没有provide，那么就查看一下是否存在默认值，将默认值保存在result中
            // 默认值可以是函数，如果是函数，那么就必须调用这个函数，将返回值作为默认值，默认自也可以是其他任何类型的值
            if (!source) {
                if ('default' in inject[key]) {
                    var provideDefault = inject[key].default;
                    result[key] = typeof provideDefault === 'function'
                    ? provideDefault.call(vm)
                    : provideDefault;
                } else {
                    warn(("Injection \"" + key + "\" not found"), vm);
                }
            }
        }
        return result
    }
}
```
- **3、initState函数**

initState函数主要作用是，初始化组件的状态。其中包括初始化props，初始化methods，初始化data，初始化computed，初始化watch。

```javascript
function initState (vm) {
    vm._watchers = [];
    var opts = vm.$options;
    // 初始化组件的props
    if (opts.props) { 
        initProps(vm, opts.props); 
    }
    // 初始化组件的方法
    if (opts.methods) { 
        initMethods(vm, opts.methods); 
    }
    if (opts.data) {
        initData(vm);
    } else {
        observe(vm._data = {}, true /* asRootData */);
    }
    // 初始化computed
    if (opts.computed) { 
        initComputed(vm, opts.computed); 
    }
    if (opts.watch && opts.watch !== nativeWatch) {
        initWatch(vm, opts.watch);
    }
}
```
- **4、initProps函数**

initProps函数主要作用是，初始化组件的props。将组件接收到的props挂载到当前组件实例上，但是我们不能直接修改props数据，我们可以将props的值，赋值给data或者computed属性，然后去操作data或者computed。

```javascript
function initProps (vm, propsOptions) {
    // 获取组件实例的props数据
    var propsData = vm.$options.propsData || {};
    var props = vm._props = {};
    var keys = vm.$options._propKeys = [];
    var isRoot = !vm.$parent;
    if (!isRoot) {
        toggleObserving(false);
    }
    // 遍历props对象的属性
    var loop = function ( key ) {
        keys.push(key);
        // 验证prop是否合法
        var value = validateProp(key, propsOptions, propsData, vm);
        /* istanbul ignore else */
        {
            var hyphenatedKey = hyphenate(key);
            if (isReservedAttribute(hyphenatedKey) ||
                config.isReservedAttr(hyphenatedKey)) {
              warn(
                ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
                vm
              );
            }
            // 将props对象的数据挂载到当前组件实例，但是我们不能直接修改prop
            defineReactive$$1(props, key, value, function () {
                if (!isRoot && !isUpdatingChildComponent) {
                    warn(
                      "Avoid mutating a prop directly since the value will be " +
                      "overwritten whenever the parent component re-renders. " +
                      "Instead, use a data or computed property based on the prop's " +
                      "value. Prop being mutated: \"" + key + "\"",
                      vm
                    );
                }
            });
        }

        if (!(key in vm)) {
            proxy(vm, "_props", key);
        }
    };
    
    // 遍历props对象
    for (var key in propsOptions) loop( key );
    toggleObserving(true);
}
```
- **5、initMethods函数**

initMethods函数主要作用是，初始化实例方法，绑定实例方法的this，判断实例方法是否合法。

```javascript
function initMethods (vm, methods) {
    var props = vm.$options.props;
    // 遍历所有的组件实例方法，验证方法名的合法性
    for (var key in methods) {
      {
        if (typeof methods[key] !== 'function') {
            warn(
                "Method \"" + key + "\" has type \"" + (typeof methods[key]) + "\" in the component definition. " +
                "Did you reference the function correctly?",
                vm
            );
        }
        if (props && hasOwn(props, key)) {
            warn(
                ("Method \"" + key + "\" has already been defined as a prop."),
                vm
            );
        }
        if ((key in vm) && isReserved(key)) {
            warn(
                "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
                "Avoid defining component methods that start with _ or $."
            );
        }
      }
      // 绑定组件实例方法的this
      vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm);
    }
}
```
- **6、initComputed函数**

initComputed函数主要作用是，初始化computed计算属性。

```javascript
function initComputed (vm, computed) {
    // 创建一个空对象
    var watchers = vm._computedWatchers = Object.create(null);
    // computed properties are just getters during SSR
    // 是否是服务端渲染，如果是服务端渲染，那么计算属性只能获取，不能修改
    var isSSR = isServerRendering();
    
    // 遍历计算属性
    for (var key in computed) {
        var userDef = computed[key];
        // 设置计算属性的getter，如果计算属性是一个函数，那么getter就是这个函数，也就是说当我们访问这个计算属性的时候，就会调用这个函数，返回一个值。如果不是一个函数，那么就会把这个值得get作为计算属性的getter
        var getter = typeof userDef === 'function' ? userDef : userDef.get;
        if (getter == null) {
            warn(
                ("Getter is missing for computed property \"" + key + "\"."),
                vm
            );
        }
        
        if (!isSSR) {
            // 为计算属性创建内部监听器
            watchers[key] = new Watcher(
                vm,
                getter || noop,
                noop,
                computedWatcherOptions
            );
        }
        
        // 在组件实例上定义计算属性，验证计算属性的合法性
        if (!(key in vm)) {
            defineComputed(vm, key, userDef);
        } else {
            if (key in vm.$data) {
                warn(("The computed property \"" + key + "\" is already defined in data."), vm);
            } else if (vm.$options.props && key in vm.$options.props) {
                warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
            }
        }
    }
}
```
- **7、initData函数**

initDate函数主要作用是，初始化组件data数据。

```javascript
function initData (vm) {
    var data = vm.$options.data;
    // 如果data是一个函数，那么就调用这个函数，将返回的结果保存在data中
    data = vm._data = typeof data === 'function'
        ? getData(data, vm)
        : data || {};
    // 如果data不是对象，那么就设置为空对象，data必须是一个对象
    if (!isPlainObject(data)) {
        data = {};
        warn(
            'data functions should return an object:\n' +
            'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
            vm
        );
    }
    // 将数据代理到_data上，并且验证data的key的合法性
    var keys = Object.keys(data);
    var props = vm.$options.props;
    var methods = vm.$options.methods;
    var i = keys.length;
    while (i--) {
      var key = keys[i];
      {
        if (methods && hasOwn(methods, key)) {
          warn(
            ("Method \"" + key + "\" has already been defined as a data property."),
            vm
          );
        }
      }
      if (props && hasOwn(props, key)) {
        warn(
          "The data property \"" + key + "\" is already declared as a prop. " +
          "Use prop default value instead.",
          vm
        );
      } else if (!isReserved(key)) {
        proxy(vm, "_data", key);
      }
    }
    // 观察数据
    observe(data, true /* asRootData */);
}
```
- **8、initProvide函数**

initProvide函数的主要作用是，初始化provide数据。provide可以是一个函数，或一个对象，如果是一个函数，那么必须返回一个对象。

```javascript
function initProvide (vm) {
    var provide = vm.$options.provide;
    if (provide) {
        vm._provided = typeof provide === 'function'
        ? provide.call(vm)
        : provide;
    }
}
```
基本上执行完上面的步骤之后，就会调用created生命周期钩子，表示Vue实例已经创建完了。