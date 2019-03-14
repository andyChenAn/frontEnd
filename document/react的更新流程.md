# react的更新流程
当我们调用react组件的setState方法时，就会执行react的更新流程，它只会更新组件有改动的部分。

setState方法是Component类的一个原型方法，而我们在创建react组件的时候，都会继承Component类，所以每个react组件都具有这个方法
```javascript
class App extends Component {
    constructor (props) {
        super(props);
    }
}
```
而setState方法是在react这个库中，不是在react-dom的库中，我们知道react这个库主要做的事情就是创建React元素。当创建完React元素，再调用ReactDOM的render方法来进行初始化渲染。

既然两个库都是分开的，那么当调用setState方法时，react-dom库中是怎么来进行更新的？我们可以看一下这段代码：
```
// react库中代码
Component.prototype.setState = function (partialState, callback) {
    // 省略...
    this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
```
其实当我们调用setState方法时，内部调用的是this.updater.enqueueSetState。

```javascript
function constructClassInstance () {
    //代码省略...
    // 调用组件的构造函数，返回一个组件实例
    var instance = new ctor(props, context);
    var state = workInProgress.memoizedState = instance.state !== null && instance.state !== undefined ? instance.state : null;
    adoptClassInstance(workInProgress, instance);
    //代码省略...
}

function adoptClassInstance(workInProgress, instance) {
    // 将classComponentUpdater对象挂载到实例的updater属性上。
    instance.updater = classComponentUpdater;
    workInProgress.stateNode = instance;
    set(instance, workInProgress);
    {
        instance._reactInternalInstance = fakeInternalInstance;
    }
}
```
当我们调用ReactDOM.render方法进行初始化渲染的时候，在这个初始化的过程中，其中就会调用到constructClassInstance，该方法组件是初始化组件实例，并将组件的state属性保存到FiberNode的memoizedState上，然后调用adoptClassInstance方法。

adoptClassInstance方法，主要就是将classComponentUpdater对象挂载到实例的updater属性上。这样当我们调用setState方法时，内部执行this.updater.enqueueSetState方法，从而就会调用classComponentUpdater中的enqueueSetState方法。所以当我们调用this.setState方法时，其实就是执行classComponentUpdater.enqueueSetState方法。

##### enqueueSetState

```javascript
// 这个方法接受三个参数
// inst ：表示的是组件实例
// payload ：表示的是调用setState传入的第一个参数（即：要更新的数据）
// callback ： 表示的是调用setState传入的第二个参数
enqueueSetState: function (inst, payload, callback) {
    // 获取对应组件实例的FiberNode
    var fiber = get(inst);
    // 当前时间
    var currentTime = requestCurrentTime();
    // 过期时间
    var expirationTime = computeExpirationForFiber(currentTime, fiber);
    // 创建一个update对象
    var update = createUpdate(expirationTime);
    // 将需要更新的数据挂载到update对象的payload属性上
    update.payload = payload;
    // 如果有传入callback参数，那么将callback参数挂载到update的callback属性上
    if (callback !== undefined && callback !== null) {
        {
            warnOnInvalidCallback$1(callback, 'setState');
        }
        update.callback = callback;
    }
    
    flushPassiveEffects();
    // 将update放到update队列中
    enqueueUpdate(fiber, update);
    scheduleWork(fiber, expirationTime);
}
```
##### updateQueue
updateQueue是一个普通的对象，包含以下主要属性：

属性名 | 类型 | 描述
---|---|---|
baseState | Object | 表示更新前的基础状态
firstUpdate | Update | 表示第一个update对象引用，总体是一个单链表结构
lastUpdate | Update | 表示最后一个update对象引用，总体是一个单链表结构
firstEffect | Update | 表示第一个包含副作用(callback)的update对象的引用
lastEffect | Update | 表示最后一个包含副作用(callback)的update对象引用

##### appendUpdateToQueue
当我们调用enqueueUpdate方法时，该方法内部会调用appendUpdateToQueue方法

```javascript
function appendUpdateToQueue(queue, update) {
  // 如果queue对象的lastUpdate属性为空，那么表示updateQueue队列是空的，那么我们将update对象挂载到updateQueue的firstUpdate和lastUpdate属性上，表示第一个更新的对象和最后一个更新的对象都是同一个
  // 如果之前的updateQueue队列不为空，那么就将update对象挂载到updateQueue的最后一个update对象的下一个，并且更新updateQueue的lastUpdate为当前的update对象
  if (queue.lastUpdate === null) {
    // Queue is empty
    queue.firstUpdate = queue.lastUpdate = update;
  } else {
    queue.lastUpdate.next = update;
    queue.lastUpdate = update;
  }
}
```
##### 测试用例：

```javascript
import React, { Component } from 'react';

class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            count : 0
        }
    }
    add = (evt) => {
        this.setState({
            count : this.state.count + 1
        })
    }
    render () {
        return (
            <div>
                <p>{this.state.count}<span>3245</span></p>
                <button onClick={this.add}>add</button>
            </div>
        )
    }
}

export default App;
```
当我们首次渲染完之后，再点击按钮时，会触发add事件回调函数，然后会执行setState方法，setState方法内部主要就是创建一个update对象，然后将这个update对象挂载到updateQueue中，当事件回调函数执行完之后，才会执行具体的组件更新操作。
```javascript
if (!isBatchingUpdates && !isRendering) {
  performSyncWork();
}
```
当执行完事件回调函数之后，这个时候事件回调已经执行完了，所以isBatchingUpdates是false，而当页面首次渲染完之后，isRendering也是fasle（页面也没有进行其他渲染），所以这个时候就会执行performSyncWork方法，处理组件更新。
```
performSyncWork方法—>performWork方法—>performWorkOnRoot方法—>renderRoot方法—>workLoop方法—>performUnitOfWork方法—>beginWork方法

当循环调用performUnitOfWork方法完之后，就会调用completeUnitOfWork方法
```
我们发现这里更新组件的方式和组件在进行第一次初始化的时候类似。这里主要的更新工作都是在==beginWork方法==中进行。
### beginWork
在beginWork方法中，主要是做以下几件事情（这里以上面的例子为例来说明）：
- 判断fiberNode的tag值，根据不同的tag值，做相应的处理。不同的tag值，代表不同的React元素类型。从上面的例子中，我们看出App是一个classComponent，所以会调用updateClassComponent方法。
- updateClassComponent方法内部会判断当前的FiberNode是否存在stateNode属性，如果不存在，表示该组件是第一次渲染，如果存在，那么表示该组件不是第一次渲染，而是调用setState方法来执行组件更新操作，这个时候会调用updateClassInstance方法。
- 从命名中我们可以看出，updateClassInstance方法就是更新组件实例。内部主要是通过fiberNode.updateQueue获取当前fiberNode的更新队列，然后调用processUpdateQueue方法，来更新队列中的数据。
- processUpdateQueue方法内部，先是克隆一个updateQueue的副本，然后获取updateQueue中的firstUpdate对象（update对象里面的payload属性就保存了调用setState方法需要更新的数据），然后循环遍历firstUpdate对象（注意：update对象是一个单链表结构，里面有一个next属性，表示的是下一个update对象，当更新完第一个update对象，那么就会通过update.next获取下一个update对象，直到update.next的值为null）
- 具体的update更新是执行getStateFromUpdate方法，在getStateFromUpdate方法内部，通过判断update对象的tag值来执行相应的更新（update对象有四种更新类型，当前有0~3，分别是UpdateState、ReplaceState、ForceUpdate、CaptureUpdate），这里的更新主要是调用_assign({}, prevState, partialState)方法，将对象进行合并，返回一个合并后的新对象。当更新完update对象后，又会判断调用setState方法时，有没有传入第二个参数（即回调函数），如果有，那么会将这个update添加到updateQueue的firstEffect和lastEffect上。
- 通过update.next获取下一个update对象，执行上面的操作，直到update.next的值为null为止。
- 当所有的update更新完之后，就会将更新后的数据赋值给updateQueue.baseState，清空updateQueue中的firstUpdate，lastUpdate。并将更新后的数据赋值给fiberNode.memoizedState，将currentlyProcessingQueue赋值为null，表示当前正在处理的队列已经处理完了。
- 处理完updateQueue之后，那么表示更新数据的操作就已经执行完了，这个时候就会调用getDerivedStateFromProps生命周期钩子。
- 然后调用checkShouldComponentUpdate方法来检查是否需要更新组件，如果组件存在shouldComponentUpdate方法，内部会调用生命周期函数shouldComponentUpdate方法，这里如果调用shouldComponentUpdate方法，就必须返回一个结果（一般是true或false），如果没有返回结果，那么会抛出异常，默认是返回true，需要更新组件。
- 如果需要更新组件，那么shouldUpdate值为true，那么就会调用componentWillUpdate生命周期钩子。
- 最后会更新组件实例的props，state，context。
- 然后调用finishClassComponent方法，这个方法内部会判断shouldUpdate的值，如果是false，那么表示组件不需要更新，直接调用bailoutOnAlreadyFinishedWork，并返回，如果为true，那么就会调用组件市里的render方法，返回一个React元素。

beginWork方法，主要做的工作就是计算数据更新。当所有的更新都做完之后，那么才会进入到diff阶段，找出元素中更新的部分进行更新。

### reconcileChildrenArray方法
该方法表示的是协调当前元素节点下面的子元素是数组的情况，比如说当前元素下面包含多个子元素。我们来看一下源码部分（重点部分）：
```javascript
for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
    } else {
        nextOldFiber = oldFiber.sibling;
    }
    // ...代码省略
    // 调用updateSlot方法，更新Fiber，其实内部就是重新创建了一个新的FiberNode，返回的是一个新的FiberNode。
    var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], expirationTime);
    
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
    
    // 一开始遍历的时候，previousNewFiber是null，所以previousNewFiber的值就是第一个返回的新的FiberNode，之后每次返回的新的FiberNode都是previousNewFiber的兄弟节点
    if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
    } else {
        previousNewFiber.sibling = newFiber;
    }
    // 更新previousNewFiber为当前的新的FiberNode
    previousNewFiber = newFiber;
    // 更新oldFiber
    oldFiber = nextOldFiber;
}

// 如果oldFiber为null，那么表示更多的子元素了，我们可以选择一条更便捷的路，因为其余的新的子元素都将是插入到元素中
if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
        // 调用createChild方法来创建一个新的子FiberNode
        var _newFiber = createChild(returnFiber, newChildren[newIdx], expirationTime);
    
        if (!_newFiber) {
          continue;
        }
        // 如果是插入元素的话，那么这个lastPlacedIndex还是在原来的位置上面
        lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);
    
        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = _newFiber;
        } else {
          previousNewFiber.sibling = _newFiber;
        }
    
        previousNewFiber = _newFiber;
    }
    // 当协调完所有子元素后，就返回协调完后的新的FiberNode，这里其实我们可以通过FiberNode.siblings去查看所有的兄弟节点
    return resultingFirstChild;
} 


// returnFiber：父FiberNode
// oldFiber：旧的子元素
// newChild：新的子元素
// expirationTime：过期时间
function updateSlot(returnFiber, oldFiber, newChild, expirationTime) {
    // 获取旧的子元素的key值，如果没有，默认为null，用来与新的子元素的key值进行比较，如果相同，那么表示是同一个子元素
    var key = oldFiber !== null ? oldFiber.key : null;
    // 文本节点是没有key的，直接更新节点就可以了
    if (typeof newChild === 'string' || typeof newChild === 'number') {
        if (key !== null) {
            return null;
        }
        return updateTextNode(returnFiber, oldFiber, '' + newChild, expirationTime);
    }
    // 如果新的子元素是一个对象，那么就会根据子元素的$$typeof判断这个新的子元素是react.element还是react.portal，
    // 如果是react.element，那么就会判断就的子元素和新的子元素的key是否相同，如果相同，那么表示是同一个元素，并且新的子元素的type不是fragment，那么就会调用updateElement方法来更新这个react元素
    //updateElement方法内部主要是调用useFiber方法，useFiber方法主要是调用workProgress方法将新的peddingProps属性传入，来重新创建一个fiberNode，并返回
    if (typeof newChild === 'object' && newChild !== null) {
        switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE:
            {
                if (newChild.key === key) {
                  if (newChild.type === REACT_FRAGMENT_TYPE) {
                        return updateFragment(returnFiber, oldFiber, newChild.props.children, expirationTime, key);
                  }
                
                  return updateElement(returnFiber, oldFiber, newChild, expirationTime);
                } else {
                    return null;
                }
            }
        
            case REACT_PORTAL_TYPE:
            {
                if (newChild.key === key) {
                      return updatePortal(returnFiber, oldFiber, newChild, expirationTime);
                } else {
                    return null;
                }
            }
        }
        if (isArray(newChild) || getIteratorFn(newChild)) {
            if (key !== null) {
              return null;
            }
        
            return updateFragment(returnFiber, oldFiber, newChild, expirationTime, null);
        }
        
        throwOnInvalidObjectType(returnFiber, newChild);
    }
    
    {
        if (typeof newChild === 'function') {
            warnOnFunctionType();
        }
    }
    return null;
}


function placeChild(newFiber, lastPlacedIndex, newIndex) {
    // 给FiberNode.index赋值，通过这个值可以知道当前的FiberNode在所有的子FiberNode中位于哪个位置
    newFiber.index = newIndex;
    
    if (!shouldTrackSideEffects) {
      // Noop.
      return lastPlacedIndex;
    }
    // 获取FiberNode的alternate，如果没有，表示这个FiberNode是新创建的
    var current$$1 = newFiber.alternate;
    // 判断是否存在FiberNode.alternate，如果存在，表示这个FiberNode不是新创建的，而是已经存在的，那么就会获取到这个FiberNode.index值（这个值就是当前FiberNode在所有子元素中所处的位置），并将这个值赋值给oldIndex
    // 比较oldIndex和lastPlacedIndex的值
    // 如果不存在FiberNode.alternate，那么表示这个FiberNode是新创建的FiberNode，那么表示这个新FiberNode是要插入进来的FiberNode，这个时候会设置这个新的FiberNode.effectTag的值为Placement（表示插入）
    if (current$$1 !== null) {
      var oldIndex = current$$1.index;
    
      if (oldIndex < lastPlacedIndex) {
        // This is a move.
        newFiber.effectTag = Placement;
        return lastPlacedIndex;
      } else {
        // This item can stay in place.
        return oldIndex;
      }
    } else {
      // This is an insertion.
      newFiber.effectTag = Placement;
      return lastPlacedIndex;
    }
}

```
##### 小结：

reconcileChildrenArray方法主要做了以下几件事：
- 首先检查key，我们在写列表项的时候，都会给列表元素添加一个key属性，来区别不同的列表元素。
- 然后从第一个子元素开始遍历所有的子元素，并调用updateSlot方法，进行更新操作，其实就是创建一个新的FiberNode。
- 调用placeChild方法，来找出替换位置，方法内部主要是通过FiberNode.index与lastPlacedIndex相比较来表示，当前的这个节点是有移动，还是在原位置上，还是新插入的节点。
- 如果遍历到最后一个子元素，那么它的siblings是为空的，这个时候会判断是否有新的节点插入进来，如果有的话，那么就创建一个新的节点，然后将新的节点挂载到最后一个子元素的siblings属性上面，最后返回更新后的该元素的第一个子元素（子元素中有siblings属性，可以通过这个属性找到所有的兄弟元素）
- 将返回的这个新的子元素挂载到其父元素的child属性上（即：workInProgress.child）
