# react的setState机制
在react应用中，如果我们想要改变组件的状态，只能通过调用setState方法来实现。而setState方法在react内部具体是怎么执行的呢？
### 看个例子

```javascript
class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            count : 0
        }
    }
    add = () => {
        this.setState({
            count : this.state.count + 1
        });
        console.log(this.state.count);
    }
    componentDidMount () {
        this.setState({
            count : this.state.count + 1
        });
        console.log(this.state.count);
    }
    render () {
        return (
            <div>
                <div>{this.state.count}</div>
                <button onClick={this.add}>add</button>
            </div>
        )
    }
}
```
当页面加载完成后，在componentDidMount生命周期中和点击事件中分别都调用了setState方法，更新组件的状态，但是我们调用该方法后，立即去获取组件的最新状态，却是获取不到的，这是为什么呢？难道setState方法是异步执行的？
### 再看个例子
```javascript
class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            count : 0
        }
    }
    componentDidMount () {
        setTimeout(() => {
            this.setState({
                count : this.state.count + 1
            });
            console.log(this.state.count);
        } , 0);
        document.addEventListener('click' , () => {
            this.setState({
                count : this.state.count + 1
            });
            console.log(this.state.count);
        })
    }
    render () {
        return (
            <div>
                <div>{this.state.count}</div>
            </div>
        )
    }
}
```
当页面加载完成后，在setTimeout定时器的回调里调用setState方法后，可以立即获取到最新的状态，并且在原生事件的回调中调用setState方法，也能立即获取到最新的状态，这又是为什么呢？
### setState到底是不是异步的？
setState方法到底是不是异步的？这个问题应该是面试react的时候，被问到的概率比较大。我们可以从上面的例子中，一个一个的来看setState底层到底是怎么执行的。
#### 1、react合成事件中的setState
从上面第一个例子中，我们可以得到：在react合成事件中调用setState方法，并不能立即得到最新的结果，所以setState方法是“异步”执行的。我们具体来了解下是如何“异步”执行的。

首先我们来看一下在合成事件中，当我们触发点击事件的执行过程是怎么样的。

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/setState1.png)

#### 2、react生命周期钩子函数中的setState

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/30.png)

```javascript
function requestWork(root, expirationTime) {
  addRootToSchedule(root, expirationTime);
  // 剩下的工作会被安排在当前这一批渲染的最后
  // 也就是说，等到所有的状态更新完之后，最后才进行统一的组件更新操作。
  if (isRendering) {
    return;
  }

  // 这里主要是针对react的合成事件触发时的回调函数中执行的更新操作
  // 在合成事件回调函数中更新所有状态之后，再统一执行组件的更新操作。
  if (isBatchingUpdates) {
    if (isUnbatchingUpdates) {
      nextFlushedRoot = root;
      nextFlushedExpirationTime = Sync;
      performWorkOnRoot(root, Sync, false);
    }
    return;
  }

  // 同步操作
  // 比如直接通过addEventListener绑定事件回调中调用setState方法更新状态
  // 比如setTimeout定时器回调函数中调用setState方法更新状态
  // 上面的两种情况，都会直接进行同步操作，也就是说，在调用setState方法后面，立即获取最新状态，是可以获取到的。
  if (expirationTime === Sync) {
    performSyncWork();
  } else {
    // 异步渲染会走这里
    scheduleCallbackWithExpirationTime(root, expirationTime);
  }
}
```