# Vue的mixins

混入 (mixin) 提供了一种非常灵活的方式，来分发Vue组件中的可复用功能。一个混入对象可以包含任意组件选项。当组件使用混入对象时，所有混入对象的选项将被“混合”进入该组件本身的选项。

### 处理data混入

Vue在处理data混入的时候，如果混入的data与组件本身的data存在同名的属性，那么Vue会优先使用组件本身的属性，而不会使用混入的属性。

```javascript

function mergeData (to, from) {
    if (!from) { return to }
    var key, toVal, fromVal;
    
    var keys = hasSymbol ? Reflect.ownKeys(from) : Object.keys(from);
    
    for (var i = 0; i < keys.length; i++) {
        key = keys[i];
        if (key === '__ob__') { continue }
        toVal = to[key];
        fromVal = from[key];
        // 如果不存在这个属性，那么就会重新设置属性
        // 如果存在同名的属性，那么就会忽略混入进来的属性，而使用组件data的属性
        if (!hasOwn(to, key)) {
            set(to, key, fromVal);
        } else if (
            // 如果存在这个属性，并且属性的值都是对象
            // 那么就递归调用mergeData函数，继续合并对象属性
            toVal !== fromVal &&
            isPlainObject(toVal) &&
            isPlainObject(fromVal)
        ) {
            mergeData(toVal, fromVal);
        }
    }
    // 最终返回合并后的对象
    return to
}
```
通过上面的代码中，我们可以看到，如果混入的data的属性与组件的data的属性同名，那么会使用组件的data的属性。

### 处理生命周期钩子的混入

Vue在处理生命周期钩子混入的时候，会将混入的生命周期钩子和组件的生命周期钩子合并成一个数组，混入的生命周期钩子先调用，组件的生命周期钩子后调用。

```javascript
function mergeHook (parentVal,childVal) {
    // 如果组件与mixin存在相同的生命周期钩子，那么会调用合并钩子
    var res = childVal
    ? parentVal
    ? parentVal.concat(childVal)
    : Array.isArray(childVal)
    ? childVal
    : [childVal]
    : parentVal;
    return res
    ? dedupeHooks(res)
    : res
}

// 删除重复
function dedupeHooks (hooks) {
    var res = [];
    for (var i = 0; i < hooks.length; i++) {
        if (res.indexOf(hooks[i]) === -1) {
            res.push(hooks[i]);
        }
    }
    return res
}

// 组件的生命周期钩子在合并的时候都会调用mergeHook函数，来合并钩子
LIFECYCLE_HOOKS.forEach(function (hook) {
    strats[hook] = mergeHook;
});
```
在混入生命周期钩子的时候，会先把生命周期钩子转为数组形式（[createdFn]），如果存在钩子那么就合并钩子。

### 处理methods，props，computed，inject的混入

这几个混入都有一个共同点，就是都是对象，所以对于这些对象的混入，Vue的处理方式是，如果出现同名属性，那么会覆盖同名属性，就使用组件的属性

```javascript
strats.props =
strats.methods =
strats.inject =
strats.computed = function (parentVal,childVal,vm,key) {
    if (childVal && "development" !== 'production') {
        assertObjectType(key, childVal, vm);
    }
    // 如果组件本身不存在，那么就直接返回混入
    if (!parentVal) { return childVal }
    
    var ret = Object.create(null);
    extend(ret, parentVal);
    if (childVal) { extend(ret, childVal); }
    return ret
};
```
### 处理watch的混入

Vue处理watch的混入和处理生命周期钩子的混入类似，会将同名的属性合并成一个数组，然后顺序调用，最后调用的就是组件本身的watch的属性

```javascript
strats.watch = function (parentVal,childVal,vm,key) {
    if (parentVal === nativeWatch) { parentVal = undefined; }
    if (childVal === nativeWatch) { childVal = undefined; }
    if (!childVal) { return Object.create(parentVal || null) }
    {
    assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = {};
    extend(ret, parentVal);
    for (var key$1 in childVal) {
        var parent = ret[key$1];
        var child = childVal[key$1];
        if (parent && !Array.isArray(parent)) {
            parent = [parent];
        }
        ret[key$1] = parent
        ? parent.concat(child)
        : Array.isArray(child) ? child : [child];
    }
    return ret
};
```