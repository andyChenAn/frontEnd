# Vue的diff流程
Vue的diff流程应该是从createPatchFunction函数开始，这个函数内部包含了很多其他diff过程中需要用到的函数。
```javascript
function createPatchFunction() {
    // 省略代码...
    return function patch(oldVnode, vnode, hydrating, removeOnly) {
        // 如果当前节点树不存在，那么表示当前节点已经被销毁
        // 那么就会调用destroy生命周期钩子函数
        if (isUndef(vnode)) {
            if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
            return
        }

        var isInitialPatch = false;
        var insertedVnodeQueue = [];
        
        // 没有旧节点，那么直接生成新节点
        if (isUndef(oldVnode)) {
            isInitialPatch = true;
            createElm(vnode, insertedVnodeQueue);
        } else {
            // 存在旧节点，并且新旧节点是一样的，那么就会对比新旧节点，找出不同的地方进行更新
            var isRealElement = isDef(oldVnode.nodeType);
            if (!isRealElement && sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
            } else {
                // 新旧节点不一样，那么就创建新节点
                var oldElm = oldVnode.elm;
                var parentElm = nodeOps.parentNode(oldElm);
                createElm(
                    vnode,
                    insertedVnodeQueue,
                    oldElm._leaveCb ? null : parentElm,
                    nodeOps.nextSibling(oldElm)
                );

                // 递归更新当前节点的父节点
                if (isDef(vnode.parent)) {
                    var ancestor = vnode.parent;
                    var patchable = isPatchable(vnode);
                    while (ancestor) {
                        for (var i = 0; i < cbs.destroy.length; ++i) {
                            cbs.destroy[i](ancestor);
                        }
                        ancestor.elm = vnode.elm;
                        if (patchable) {
                            for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                                cbs.create[i$1](emptyNode, ancestor);
                            }
                            var insert = ancestor.data.hook.insert;
                            if (insert.merged) {
                                // start at index 1 to avoid re-invoking component mounted hook
                                for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                                    insert.fns[i$2]();
                                }
                            }
                        } else {
                            registerRef(ancestor);
                        }
                        ancestor = ancestor.parent;
                    }
                }

                // 删除旧节点
                if (isDef(parentElm)) {
                    removeVnodes([oldVnode], 0, 0);
                } else if (isDef(oldVnode.tag)) {
                    invokeDestroyHook(oldVnode);
                }
            }
        }
        invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
        return vnode.elm
    }
}
```
patch函数做了以下几件事情：
- 1、没有旧节点，那么直接生成新节点
- 2、存在旧节点，并且新旧节点是同一个节点，那么执行diff，找出不一样的地方进行更新
- 3、存在旧节点，并且新旧节点不是同一节点，那么就删除旧节点，创建新节点

### patchVnode函数
当新旧节点是同一个节点时，那么就会调用patchVnode函数来执行diff操作。

```javascript
function patchVnode(
    oldVnode,
    vnode,
    insertedVnodeQueue,
    ownerArray,
    index,
    removeOnly
) {
    if (oldVnode === vnode) {
        return
    }

    if (isDef(vnode.elm) && isDef(ownerArray)) {
        // clone reused vnode
        vnode = ownerArray[index] = cloneVNode(vnode);
    }

    var elm = vnode.elm = oldVnode.elm;

    if (isTrue(oldVnode.isAsyncPlaceholder)) {
        if (isDef(vnode.asyncFactory.resolved)) {
            hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
        } else {
            vnode.isAsyncPlaceholder = true;
        }
        return
    }

    // 复用静态节点，如果是静态节点，那么直接就返回
    if (isTrue(vnode.isStatic) &&
        isTrue(oldVnode.isStatic) &&
        vnode.key === oldVnode.key &&
        (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
    ) {
        vnode.componentInstance = oldVnode.componentInstance;
        return
    }

    var i;
    var data = vnode.data;
    if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
        i(oldVnode, vnode);
    }

    var oldCh = oldVnode.children;
    var ch = vnode.children;
    if (isDef(data) && isPatchable(vnode)) {
        // 更新节点的数据
        /*
            0: ƒ updateAttrs(oldVnode, vnode)
            1: ƒ updateClass(oldVnode, vnode)
            2: ƒ updateDOMListeners(oldVnode, vnode)
            3: ƒ updateDOMProps(oldVnode, vnode)
            4: ƒ updateStyle(oldVnode, vnode)
            5: ƒ update(oldVnode, vnode)
            6: ƒ updateDirectives(oldVnode, vnode)
        */
        for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
        if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
    }
    // 如果新节点不是文本节点
    if (isUndef(vnode.text)) {
        // 并且新旧节点都存在子节点
        if (isDef(oldCh) && isDef(ch)) {
            // 并且新旧节点的子节点不同，那么就调用updateChildren更新子节点
            if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
        } else if (isDef(ch)) {
            // 新节点存在子节点，旧节点不存在子字节
            // 直接全部新建子节点，新建是指创建出所有新DOM，并且添加进父节点的
            {
                checkDuplicateKeys(ch);
            }
            if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
            addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
        } else if (isDef(oldCh)) {
            // 旧节点存在子节点，新节点不存在子节点
            // 删除旧节点中的子节点
            removeVnodes(oldCh, 0, oldCh.length - 1);
        } else if (isDef(oldVnode.text)) {
            // 旧节点是文本节点，新节点的文本为空，那么直接设置为空
            nodeOps.setTextContent(elm, '');
        }
    } else if (oldVnode.text !== vnode.text) {
        // 如果是文本节点，并且新旧节点文本不同，那么就重新设置新的文本
        nodeOps.setTextContent(elm, vnode.text);
    }
    if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
    }
}
```
patchVnode函数做了以下几件事情：
- 1、判断新节点是否为文本节点
  - 如果新节点是文本节点，那么直接更新文本。
- 2、判断新旧节点是否存在子节点
  - 如果新节点不是文本节点，并且新旧节点都存在子节点，那么调用updateChildren更新子节点。
  - 如果新节点存在子节点，旧节点不存在子字节，那么直接创建子节点，并添加到父节点上。
  - 如果旧节点存在子节点，新节点不存在子节点，那么删除旧节点中的所有子节点。
  -  旧节点是文本节点，新节点的文本为空，那么直接设置为空。

### updateChildren函数
当新旧节点存在子节点的时候，会调用该函数来对比子节点。
```javascript
function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
    // 旧节点的起始索引
    var oldStartIdx = 0;
    // 新节点的起始索引
    var newStartIdx = 0;
    // 旧节点的末尾索引
    var oldEndIdx = oldCh.length - 1;
    // 旧节点的第一个节点
    var oldStartVnode = oldCh[0];
    // 旧节点的末尾节点
    var oldEndVnode = oldCh[oldEndIdx];
    // 新节点的末尾索引
    var newEndIdx = newCh.length - 1;
    // 新节点的第一个节点
    var newStartVnode = newCh[0];
    // 新节点的末尾节点
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

    var canMove = !removeOnly;

    {
        checkDuplicateKeys(newCh);
    }

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (isUndef(oldStartVnode)) {
            // 如果旧节点树的起始节点不存在(该节点被设置为undefined，后面的代码有)
            // 那么就更新旧节点树的起始节点与起始位置
            // Vnode has been moved left
            // 也就是说，该节点已经向左移动了
            oldStartVnode = oldCh[++oldStartIdx]; 
        } else if (isUndef(oldEndVnode)) {
            // 如果旧节点树的末尾节点不存在(该节点被设置为undefined)
            // 那么就更新旧节点的末尾节点和末尾位置
            // 也就是说，该节点已经向右移动了
            oldEndVnode = oldCh[--oldEndIdx];
        } else if (sameVnode(oldStartVnode, newStartVnode)) {
            // 如果旧节点树的第一个节点与新节点树的第一个节点相同
            // 那么就将这两个节点进行对比
            // 然后将新旧节点的开始索引向后移动一位
            patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
            oldStartVnode = oldCh[++oldStartIdx];
            newStartVnode = newCh[++newStartIdx];
        } else if (sameVnode(oldEndVnode, newEndVnode)) {
            // 如果旧节点树的末尾节点与新节点的末尾节点相同
            // 那么就将这两个节点进行对比
            // 然后将新旧节点的末尾索引向前移动一位
            patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
            oldEndVnode = oldCh[--oldEndIdx];
            newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldStartVnode, newEndVnode)) { 
            // Vnode moved right
            // 如果旧节点树的起始节点与新节点树的末尾节点相同，也就是说，节点树的第一个节点移动到最后一个位置上了
            // 然后将这两个节点进行对比
            // 然后将旧节点树的第一个子节点插入到最后
            // 更新旧节点的起始节点和更新 新节点的末尾节点
            patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
            canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
            oldStartVnode = oldCh[++oldStartIdx];
            newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldEndVnode, newStartVnode)) { 
            // Vnode moved left
            // 如果旧节点的末尾节点和新节点的起始节点相同，也就是说，节点树的末尾节点移动到第一个位置上了
            // 然后将两个节点进行对比
            // 然后将旧节点树的末尾节点插入到旧节点树的起始节点位置
            // 更新旧节点的末尾节点和更新 新节点的起始节点
            patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
            canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
            oldEndVnode = oldCh[--oldEndIdx];
            newStartVnode = newCh[++newStartIdx];
        } else {
            // 新旧节点存在，但是不相同时
            // 如果oldKeyToIdx没有，那么就创建一个旧节点树中，所有子节点的key与索引的映射关系
            // 说白了就是将旧节点树上的所有还没有比对过的子节点创建一个节点中的key与节点位置的映射表
            if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
            // 判断新节点的key是否存在于旧节点树中的映射表中
            idxInOld = isDef(newStartVnode.key)
                ? oldKeyToIdx[newStartVnode.key]
                : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
            // 如果不存在，那么表示这是一个新节点，那么就创建一个新元素
            // 如果存在，那么表示节点位置发生了移动，然后找到发生位置移动的节点
            if (isUndef(idxInOld)) { // New element
                createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
            } else {
                vnodeToMove = oldCh[idxInOld];
                // 如果旧节点树的这个子节点与新节点树的起始节点相同，那么就对比这两个节点，并将旧节点树中的这个节点设置为undefined
                // 然后将位置发生移动的这个节点插入到旧节点树的起始节点的前面
                if (sameVnode(vnodeToMove, newStartVnode)) {
                    patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
                    oldCh[idxInOld] = undefined;
                    canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
                } else {
                    // 如果旧节点树的这个节点与新节点树的起始节点不相同，比如key一样，但是元素不一样，那么就把这个节点当做一个新的节点，所以就创建一个新节点
                    createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
                }
            }
            // 更新新节点树的起始节点和起始位置
            newStartVnode = newCh[++newStartIdx];
        }
    }
    // 如果oldStartIdx大于oldEndIdx，那么表示新节点树的子节点要多于旧节点树的子节点数量
    if (oldStartIdx > oldEndIdx) {
        // 获取新节点树的子节点，并添加节点到相应的位置上
        refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
        addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else if (newStartIdx > newEndIdx) {
        // 如果newStartIdx大于newEndIdx，那么表示新节点树的子节点要少于旧节点树的子节点数量
        // 那么就删除多于的子节点
        removeVnodes(oldCh, oldStartIdx, oldEndIdx);
    }
}
```
#### 这里有以下几种对比更新的方式：
- 1、新头和旧头比较
- 2、新尾和旧尾比较
- 3、旧头和新尾比较
- 4、新头和旧尾比较
- 5、逐个查找比较

##### 新头和旧头比较
如果新头和旧头节点相同，那么就不会移动节点位置，同样会调用patchVnode更新节点，如果存在子节点，那么也会对比子节点，然后更新oldStartIdx和newStartIdx，接着从前往后比较下一个新旧节点。
##### 新尾和旧尾比较
如果新尾和旧尾节点相同，那么就不会移动节点位置，同样会调用patchVnode更新节点，如果存在子节点，那么也会对比子节点，然后更新oldEndIdx和newEndIdx，接着从后往前比较下一个新旧节点。
##### 旧头和新尾比较
如果旧头和新尾节点相同，那么表示旧节点树的第一个节点从头部跑到了末尾，这个时候我们就需要移动节点位置，同样会调用pathVnode更新节点，如果存在子节点，那么也会对比子节点，然后更新oldStartIdx和newEndIdx，旧节点树和新节点树就一个从前往后，一个从后往前一一对比下一个新旧节点。那节点是怎么移动的呢？就是通过调用insertBefore来移动节点位置，其实也就是在旧节点树的最后一个节点的下一个节点前面插入移动的这个节点即可。
```javascript
canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
```
##### 新头和旧尾比较
如果新头和旧尾节点相同，那么表示旧节点树的最后一个节点从末尾跑到头部去了，这个时候我们就需要移动节点位置，同样会调用patchVnode更新节点，如果存在子节点，那么也会对比子节点，然后更新oldEndIdx和newStartIdx，旧节点树和新节点树就一个从后往前，一个从前往后一一对比下一个新旧节点。那节点是怎么移动的呢？就是通过调用insertBefore来移动节点位置，其实也就是在旧节点树的第一个节点前面插入移动的这个节点即可。
```javascript
canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
```
##### 逐个查找比较
如果两个新旧节点不满足上面四种情况，那么就会创建一个旧节点树的map表，这个map表是一个旧节点树中的节点key与节点位置的映射表，格式为：
```
{
    vnode1.key1 : index1,
    vnode2.key2 : index2,
    ...
}
```
查找的流程是：
- 1、创建一个旧节点树的map表
- 2、从新节点树中拿出一个节点，判断它的key是否存在于map表中
- 3、如果不存在，那么表示这是一个新节点，那么就新建节点，并将新节点插入到oldStartVnode前面。
- 4、如果存在，那么继续比较两个新旧节点是否相同
  - 4.1、如果相同，那么将节点移动到oldStartVnode前面。
  - 4.2、如果不相同，那么就新建节点，并将新节点插入到oldStartVnode前面。

#### 处理剩余节点
当我们比较完之后，可能新旧节点树中还有一些剩余的节点没有被处理。这里会存在两种情况，一种是新节点树遍历完了，一种是旧节点树遍历完了。

- 1、新节点树遍历完了，表示旧节点树可能还有剩余节点没有处理，那么我们就会删除剩余的节点。
- 2、旧节点树遍历完了，表示新节点树可能还有剩余的节点没有处理，那么我们就会新建这些节点。那么新建的这些节点插入在什么位置呢？

```javascript
refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
```
newEndIdx表示的是新节点树的最后一个节点位置，如果newCh[newEndIdx+1]存在，那么表示newEndIdx更新过，也就是说newEndIdx移动过，那么会将新建的节点插入到refElm的前面，如果newCh[newEndIdx+1]不存在，那么表示newEndIdx没有更新过，一直是最后一个，也就是说newEndIdx没有移动过，那么就会将新建的节点插入到该新节点树的末尾。