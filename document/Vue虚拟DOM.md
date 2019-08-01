# Vue虚拟DOM
在Vue中，虚拟DOM实际上就是一个VNode对象。

```javascript
var VNode = function VNode (
    tag,
    data,
    children,
    text,
    elm,
    context,
    componentOptions,
    asyncFactory
) {
    // 当前节点的标签名
    this.tag = tag;
    // 当前节点对应的属性对象
    this.data = data;
    // 当前节点的子节点，是一个数组
    this.children = children;
    // 当前节点的文本
    this.text = text;
    // 虚拟DOM对应的真实DOM节点
    this.elm = elm;
    // 当前节点的命名空间
    this.ns = undefined;
    // 当前节点的编译作用域
    this.context = context;
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    // 节点的key属性
    this.key = data && data.key;
    // 组件的options选项
    this.componentOptions = componentOptions;
    // 当前节点对应的组件实例
    this.componentInstance = undefined;
    // 当前节点的父节点
    this.parent = undefined;
    // 是否为原生html或只是普通文本，innerHTML的时候为true，textContent的时候为false
    this.raw = false;
    // 是否为静态节点
    this.isStatic = false;
    // 是否作为根节点插入
    this.isRootInsert = true;
    // 是否为注释节点
    this.isComment = false;
    // 是否为克隆节点
    this.isCloned = false;
    // 是否有v-once指令
    this.isOnce = false;
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
};
```
那么在Vue中，调用哪些方法会创建虚拟DOM呢？

- 1、createEmptyVNode：创建一个空的节点（虚拟DOM）
- 2、createTextVNode：创建一个文本节点（虚拟DOM）
- 3、cloneVNode：克隆一个节点（虚拟DOM）
- 4、createComponent：创建一个组件节点（虚拟DOM）
- 5、createElement：创建一个普通元素节点（虚拟DOM）
