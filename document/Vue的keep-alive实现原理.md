# Vue的keep-alive实现原理

最近使用vuejs来重构公司移动端项目，经常会遇到一种场景：在一个列表页面，点击某个列表项，就会跳转到列表项的详细页，当我们再点击返回按钮，返回到列表页面时，要保存列表页面的状态。这个时候我们可以使用keep-alive来解决这样一个场景，keep-alive会保存当前页面的状态，而不会重新渲染。

### 什么是keep-alive？

keep-alive是一个抽象组件，它自身不会渲染一个DOM元素，也不会出现在父组件链中，使用keep-alive包裹动态组件时，会缓存不活动的组件实例，而不是销毁它们。

### keep-alive源码

```javascript
var KeepAlive = {
    // 组件名
    name: 'keep-alive',
    // 抽象组件的标识
    abstract: true,
    // 组件接收的prop
    props: {
        // 缓存白名单
        include: patternTypes,
        // 缓存黑名单
        exclude: patternTypes,
        // 最大缓存组件实例的数量
        max: [String, Number]
    },
    
    // 组件的created生命周期钩子
    created: function created () {
        // 在组件实例被创建后，会初始化两个对象，
        // cache用来保存需要缓存的组件
        this.cache = Object.create(null);
        // 保存缓存组件对应的key
        this.keys = [];
    },
    
    // 组件的destroyed生命周期钩子
    destroyed: function destroyed () {
        for (var key in this.cache) {
            pruneCacheEntry(this.cache, key, this.keys);
        }
    },
    
    // 组件的mounted生命周期钩子
    mounted: function mounted () {
        var this$1 = this;
        // 当组件挂载后，调用$watch方法监听include和exclude的变化
        this.$watch('include', function (val) {
            pruneCache(this$1, function (name) { return matches(val, name); });
        });
        this.$watch('exclude', function (val) {
            pruneCache(this$1, function (name) { return !matches(val, name); });
        });
    },
    
    // 组件的render渲染函数
    render: function render () {
        // 获取包裹在keep-alive组件的子组件。
        // 比如：<keep-alive><test></test></keep-alive>
        var slot = this.$slots.default;
        // 获取第一个子组件
        var vnode = getFirstComponentChild(slot);
        // 获取子组件实例选项对象
        var componentOptions = vnode && vnode.componentOptions;
        if (componentOptions) {
            // 获取组件名
            var name = getComponentName(componentOptions);
            var ref = this;
            var include = ref.include;
            var exclude = ref.exclude;
            // 匹配include，exclude中的组件名，如果不存在，那么就直接返回组件
            if (
                // not included
                (include && (!name || !matches(include, name))) ||
                // excluded
                (exclude && name && matches(exclude, name))
            ) {
                return vnode
            }
        
            var ref$1 = this;
            var cache = ref$1.cache;
            var keys = ref$1.keys;
            // 设置key值
            var key = vnode.key == null
            ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
            : vnode.key;
            // 如果组件实例已经被保存在缓存中，那么就通过key获取对应的组件实例。
            // 如果缓存中不存在，那么就保存在缓存中，以key作为键，以组件实例作为值。
            // 将key保存在keys数组中
            if (cache[key]) {
                vnode.componentInstance = cache[key].componentInstance;
                // make current key freshest
                // 先删除keys中的key，然后再添加key到keys中
                // 这样做的目的应该是保持key对应的组件是最新鲜的
                remove(keys, key);
                keys.push(key);
            } else {
                cache[key] = vnode;
                keys.push(key);
                // 如果你设置了能够缓存组件实例的最大数量，那么这里就会判断，如果缓存的组件实例数超过了max值
                // 那么就会删除最近最久未使用的实例。
                // keys[0]这个key就是最久未使用的
                if (this.max && keys.length > parseInt(this.max)) {
                    pruneCacheEntry(cache, keys[0], keys, this._vnode);
                }
            }
            // 设置第一个子组件的data的keepAlive为true
            vnode.data.keepAlive = true;
        }
        // 返回第一个子组件
        return vnode || (slot && slot[0])
    }
};
```
