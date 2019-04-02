# react的diff算法
[这篇文章很详细，介绍diff算法](https://zhuanlan.zhihu.com/p/20346379)

**注意：两棵树：workInProgress和workInProgress.alternate**

### tree diff
两棵树只会对同一层次的节点进行比较。

### component diff
- 如果是同类型组件，那么就按照原来的策略一层一层的比较虚拟DOM树
- 如果是不同类型组件，那么就会创建一个新的组件来替换之前的组件（包括子元素）
```javascript
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
我们可以看一个例子：

```javascript
class Andy extends Component {
    constructor (props) {
        super(props);
        console.log('andy constructor');
    }
    componentWillMount () {
        console.log('andy will mount');
    }
    componentWillUnmount () {
        console.log('andy will unmount');
    }
    componentDidMount () {
        console.log('andy did mount');
    }
    render () {
        console.log('andy render');
        return (
            <div>
                <div>hello andy</div>
                <div>good morning</div>
            </div>
        )
    }
};

class Jack extends Component {
    constructor (props) {
        super(props);
    }
    componentWillMount () {
        console.log('jack will mount');
    }
    componentDidMount () {
        console.log('jack did mount');
    }
    render () {
        console.log('jack render');
        return (
            <div>
                <div>hello jack</div>
                <div>good night</div>
            </div>
        )
    }
}

class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            show : true
        }
    }
    delete = (evt) => {
        this.setState({
            show : false
        })
    }
    render () {
        return (
            <div>
                {
                    this.state.show ? <Andy /> : <Jack />
                }
                <button onClick={this.delete}>delete</button>
            </div>
        )
    }
}

export default App;
```
当我点击delete按钮是，我们打印一下Andy组件和Jack组件的执行结果：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/19.png)

从打印结果，我们可以看出，如果是两个不同类型的组件，那么会删除掉之前的组件，然后重新挂载新的组件。
### element diff
当节点处于同一层级时，react diff提供了三种节点操作，插入，移动，删除，如果只是移动位置，react会怎么做呢？，我们来举个例子：

```javascript
class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            list : ['andy' , 'jack' , 'henry']
        }
    }
    change = () => {
        this.setState({
            list : ['jack' , 'andy' , 'henry']
        })
    }
    render () {
        return (
            <div>
                <div>
                    {
                        this.state.list.map(item => (
                            <p key={item}>{item}</p>
                        ))
                    }
                </div>
                <button onClick={this.change}>change</button>
            </div>
        )
    }
}

export default App;
```
- 首先对新集合的节点进行循环遍历，通过唯一的key可以判断新老集合中是否存在相同的节点，如果key相同，那么表示存在相同节点，并且如果节点的类型也是一样的，那么就表示对比的这两个节点是同一个节点，这样的话，我们就只需要更新节点的props，返回这个更新后的节点。如果key不相同，那么表示当前对比的两个子节点不是相同节点，那么就直接返回null，就不需要进行节点的更新操作。

- 判断返回的这个新的节点是否为null，如果为null就跳出整个循环，不会继续遍历后面的子节点。

- 调用mapRemainingChildren方法，将第一次新节点和旧节点不相同的两个节点中的旧节点开始，及其后面的兄弟节点添加到一个map集合中，其中map中的key就是节点的key，value就是子节点。

- 对新集合的节点进行遍历，调用updateFromMap方法，从map集合（旧集合）中匹配出新节点，如果能够匹配，那么就返回这个节点，再更新这个节点的props，并且删除map集合已经匹配的节点，如果旧集合中没有这个新节点，那么表示这个节点是新插入进来的节点。

- 调用placeChild方法，对节点进行移动操作。在移动前需要将当前节点在旧集合中的位置与lastPlacedIndex进行比较，如果当前节点在旧集合的位置小于lastPlacedIndex，那么就需要进行移动，否则就不需要进行移动。这是一种顺序优化手段，lastPlacedIndex一直在更新，表示访问过的节点在旧集合中最右的位置（即最大的位置），如果新集合中当前访问的节点比lastPlacedIndex大，说明当前访问节点在旧集合中就比上一个节点位置靠后，则该节点不会影响其他节点位置，因此不需要进行移动，只有当访问的节点比lastPlacedIndex小时，才需要进行移动。

```
function placeChild(newFiber, lastPlacedIndex, newIndex) {
    // 更新新节点的index值
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) {
      // Noop.
        return lastPlacedIndex;
    }
    // 这个是当前新节点的旧节点
    var current$$1 = newFiber.alternate;
    // 如果旧节点存在，那么我们就能通过旧节点的index，获取旧节点在旧集合中的位置，并更新lastPlacedIndex的值（lastPlacedIndex的值始终都是访问过的节点在旧集合中的最右位置，即最大位置）
    // 如果旧节点不存在，表示是一个新创建的节点，那么就直接插入
    if (current$$1 !== null) {
        var oldIndex = current$$1.index;
        // 如果当前访问的节点在旧集合中的位置小于lastPlacedIndex，那么就需要进行移动操作
        // 否则，就不需要移动
        if (oldIndex < lastPlacedIndex) {
            newFiber.effectTag = Placement;
            return lastPlacedIndex;
        } else {
            // This item can stay in place.
            return oldIndex;
        }
    } else {
      newFiber.effectTag = Placement;
      return lastPlacedIndex;
    }
}
```
lastPlacedIndex的值相当于在旧集合中移动的最大值
![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/20.png)

上面这张图片分析的是新旧集合中存在相同节点但位置不同时，对节点进行位置移动的情况，如果新集合中有新加入的节点，那是怎么对比呢？以下面这个例子为例：
```javascript
class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            list : ['andy' , 'jack' , 'henry']
        }
    }
    change = () => {
        this.setState({
            list : ['jack' , 'andy' , 'henry']
        })
    }
    insert = () => {
        this.setState({
            list : ['andy' , 'peter' , 'henry' , 'jack']
        })
    }
    render () {
        return (
            <div>
                <div>
                    {
                        this.state.list.map(item => (
                            <p key={item}>{item}</p>
                        ))
                    }
                </div>
                <button onClick={this.change}>change</button>
                <button onClick={this.insert}>insert</button>
            </div>
        )
    }
}
```
![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/22.png)

上面这张图Fenix的是新旧集合存在插入的新节点以及位置不同的情况。

如果新集合中有删除掉的节点，那react的diff是怎么做的呢？

其实比对的过程都是一样，只是多加了一步，就是会判断existingChildren这个map集合中是否还存在剩余的子节点，如果存在，那么表示这些子节点就是需要删除的，那么我们就调用deleteChild方法将子节点执行删除操作。

### 总结：
- 对于tree diff来说，react只会对tree中同一层级进行比较，不同层级是不会比较的。
- 对于component diff来说，react会判断component的类型是否相同，如果相同，那么就按照tree diff的方式来进行比较，如果component的类型不相同，那么就直接删除原来的component及其子节点，用新的component来代替。
- 对于element diff来说，react会通过设置key来对element diff进行优化。
