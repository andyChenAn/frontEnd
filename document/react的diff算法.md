# react的diff算法
[这篇文章很详细，介绍diff算法](https://zhuanlan.zhihu.com/p/20346379)

**注意：两棵树：workInProgress和workInProgress.alternate**

### tree diff
两棵树只会对同一层次的节点进行比较。

### component diff
- 如果是同类型组件，那么就按照原来的策略一层一层的比较虚拟DOM树
- 如果是不同类型组件，那么就会创建一个新的组件来替换之前的组件（包括子元素）
```
function updateElement(returnFiber, current$$1, element, expirationTime) {
    // 如果两个组件的类型相同，那么只需要更新props就可以了
    // 如果两个组件的类型不同，那么就需要重新创建
    if (current$$1 !== null && current$$1.elementType === element.type) {
        // Move based on index
        var existing = useFiber(current$$1, element.props, expirationTime);
        existing.ref = coerceRef(returnFiber, current$$1, element);
        existing.return = returnFiber;
        {
            existing._debugSource = element._source;
            existing._debugOwner = element._owner;
        }
      return existing;
    } else {
        // Insert
        var created = createFiberFromElement(element, returnFiber.mode, expirationTime);
        created.ref = coerceRef(returnFiber, current$$1, element);
        created.return = returnFiber;
        return created;
    }
}
```