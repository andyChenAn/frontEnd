# react的首次渲染

[参考这里](https://juejin.im/post/5b9a45fc5188255c402af11f#heading-21)

先看一个简单的例子：

```javascript
class App extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            <div>hello andy</div>
        )
    }
};

ReactDOM.render(<App /> , document.getElementById('root'));

```
当我们执行时，会在浏览器上渲染出hello andy的字样。那么React组件具体是怎么渲染的呢？虚拟DOM是怎么转换为真实DOM的？

当我们执行ReactDOM.render方法时，其实就是执行：

```javascript
ReactDOM.render(
    React.createElement(App),
    document.getElementById('root')
)
```
通过调用React.createElement(App)创建了一个React元素。再将React元素渲染到root上。

我们先来看一下React组件在渲染过程中需要了解的一些数据结构。
### 1、ReactRoot
ReactRoot对象是是一个根对象。如下：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/1.png)

当我们得到一个ReactRoot对象后，然后调用ReactRoot对象的render方法进行渲染

```javascript
// children是一个react元素
// callback是一开始调用ReactDOM.render()方法传入的回调函数
root.render(children , callback);
```
### 2、FiberRoot
FiberRoot是一个普通的对象，属于根对象。这个对象有几个重要的属性
- 1、current：指向当前Fiber tree的根节点。
- 2、containerInfo：指向React组件渲染到的容器，把整个React组件渲染到这个容器内。
### 3、FiberNode
FiberNode是一个FiberNode的实例，React的核心数据结构就是由多个FiberNode组件的一个FiberNode tree。
## 渲染准备阶段
##### 1、创建ReactRoot，FiberRoot，FiberNode，并且建立它们与DOMContainer之间的联系

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/2.png)

##### 2、初始化（HostRoot）FiberNode的updateQueue
通过调用ReactRoot.render -> updateContainer -> updateContainerAtExpirationTime -> scheduleRootUpdate这一系列的函数，为这次初始化创建了一个update对象，然后把<App />这个React元素作为update对象payload.element的值，然后把update放到(HostRoot)FiberNode的updateQueue上。

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/4.png)

然后调用scheduleWork -> performSyncWork -> performWork -> performWorkOnRoot，期间主要是提取当前应该进行初始化的(HostFiber)FiberNode，后续正式进入算法执行阶段。

## 渲染执行阶段
调用renderRoot方法，生成一个完整的FiberNode tree。
### 1、生成（HostRoot）FiberNode的workInProgress，这个workInProgress就是current.alternate。
在整个算法过程中，主要做的事件就是遍历FiberNode节点。算法中有两个角色，一个是表示当前节点原始形态的current节点，一个是表示基于当前节点进行重新计算的workInProgress节点。两个对象实例都是独立的，互相之间通过alternate属性来引用。

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/5.png)

### 2、循环执行
源码如下：

```javascript
// 先创建workInProgress对象
nextUnitOfWork = createWorkInProgress(nextRoot.current, null, nextRenderExpirationTime);
//再调用workLoop函数
workLoop(isYieldy);
// 再循环执行performUnitOfWork
while (nextUnitOfWork !== null) {
  nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
}
```
刚刚创建的FiberNode被作为nextUnitOfWork，从此进入工作循环，创建Fiber tree。
### 3、beginWork
每个工作的对象主要是处理workInProgress。这里通过workInProgress.tag区分当前的FiberNode类型，然后进行对应的更新处理。
##### 3.1、updateHostRoot
通过FiberNode.tag来判断它的类型，如果是HostRoot，那么就会执行updateHostRoot方法，这个方法会执行两个操作，一个是处理更新队列，一个是创建FiberNode的child，得到下一个工作循环的传入的参数，也就是nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
##### 3.2、updateClassComponent
通过FiberNode.tag来判断它的类型，如果是ClassComponent，那么就会执行updateClassComponent方法，这个方法内部会调用ReactComponent的constructor来创建ReactComponent实例，并且会创建与FiberNode的关系。

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/6.png)

调用constructor后（初始化React组件），会进入实例的挂载过程，这时候会把组件render之前的生命周期方法都调用完。期间，state可能会被以下流程修改：
- 调用getDerivedStateFromProps
- 调用componentWillMount
- 处理因上面的流程产生的update所调用的processUpdateQueue

当创建完ReactComponent实例并与FiberNode建立联系后，通过调用ReactComponent实例的render方法获取子React元素，这里就是：
```javascript
class App extends Component {
    constructor() {
      super();
      this.state = {
        msg:'init',
      };
    }
    render() {
      return (
        <div className="App">
          <p className="App-intro">
            To get started, edit <code>{this.state.msg}</code> and save to reload.
          </p>
          <button onClick={() => {
            this.setState({msg: 'clicked'});
          }}>hehe
          </button>
        </div>
      );
    }
}
```
子元素就是上面代码中的render方法返回的React元素。然后创建对应的所有子FiberNode。最终通过workInProgress.child指向第一个子FiberNode。

processUpdateQueue方法主要做的就是遍历这个updateQueue，然后计算出最后的新state，然后保存到workInProgress.memoizedState中。
##### 3.3、reconcileChildren 
在workInProgress节点自身处理完成之后，会通过props.children或者instance.render方法获取子React元素。子React元素可能是对象、数组、字符串、迭代器，针对不同的类型进行处理。

reconcileChildrenArray方法会遍历React元素数组，一一对应生成FiberNode，FiberNode有一个returnFiber属性和sibling属性，returnFiber指向其父FiberNode，sibling指向相邻的下一个兄弟FiberNode。最终生成的FiberNode tree结构为：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/7.png)

当生成FiberNode tree后，由于最后的那个FiberNode并没有child，那么就会调用completeUnitOfWork方法。
### 4、completeUnitOfWork
在completeWork方法中，会通过workInProgress.tag来区分不同的操作。我们这里来看一下HostText和HostComponent的操作
##### 4.1、HostText
当workInProgress.tag为HostText，那么会执行updateHostText$1方法，在这个方法中会创建textNode，并将textNode保存在workInProgress.stateNode。而textNode的internalInstanceKey属性指向workInProgress，通过这样与自己的FiberNode建立联系。

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/8.png)

##### 4.2、HostComponent
在我们这个例子中，当处理完HostText之后，调度算法会寻找当前节点的sibling节点进行处理，所以会进入HostComponent处理流程中。

由于当前出于初始化流程，所以处理比较简单，只是根据FiberNode.tag（当前值是code）来创建一个DomElement，即通过document.createElement来创建节点。然后通过__reactInternalInstance$[randomKey]属性建立与自己的 FiberNode的联系；通过__reactEventHandlers$[randomKey]来建立与 props 的联系。

然后，通过setInitialProperties方法对DomElement的属性进行初始化，而<code>节点的内容、样式、class、事件 Handler等等也是这个时候存放进去的。

目前，整个FiberNode tree结构如下：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/9.png)

在当前的DOM元素创建完成后，就会进入到appendAllChildren方法把子节点append到当前的DOM元素上。

```javascript
while (node !== null) {
  if (node.tag === HostComponent || node.tag === HostText) {
    // 将子节点append到当前DOM中
    appendInitialChild(parent, node.stateNode);
  } else if (node.tag === HostPortal) {
    // If we have a portal child, then we don't want to traverse
    // down its children. Instead, we'll get insertions from each child in
    // the portal directly.
  } else if (node.child !== null) {
    // 如果有子节点
    node.child.return = node;
    node = node.child;
    continue;
  }
  if (node === workInProgress) {
    return;
  }
  // 循环遍历出子节点的所有兄弟节点
  while (node.sibling === null) {
    if (node.return === null || node.return === workInProgress) {
      return;
    }
    node = node.return;
  }
  node.sibling.return = node.return;
  node = node.sibling;
}
};
```
上面代码是appendAllChildren方法中的大部分代码，主要就是查找出当前DOM下的所有子节点，并将这些子节点append到当前DOM上。

最终，所有和DOM元素相关的FiberNode都被处理完了，得到一个最终的FiberNode tree结构：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/10.png)

### 提交阶段
提交阶段，主要就是执行一些周期函数，和DOM操作的阶段。

```
invokeGuardedCallback方法—>commitAllHostEffects方法—>然后根据effectTag来执行相应的操作(placement , update , deletion等)—>commitWork方法—>commitUpdate方法
```
### commitUpdate方法

```javascript
function commitUpdate(domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
    // 就是执行相应的更新操作
    updateFiberProps(domElement, newProps);
    updateProperties(domElement, updatePayload, type, oldProps, newProps);
}
```
updateProperties方法内部其实就是执行DOM操作。
