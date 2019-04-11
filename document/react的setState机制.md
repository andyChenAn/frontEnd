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
#### 3、原生事件中的setState
如果我们在原生事件中调用setState方法，那么我们可以立即获取到最新的状态，比如：
```javascript
import React, { Component } from 'react';
class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            val : 0
        }
    }
    componentDidMount() {
        document.addEventListener('click' , () => {
            this.setState({
                val : this.state.val + 1
            });
            // 每次打印的时候，都能打印最新的状态
            console.log(this.state.val);
        });
    }

    render() {
        return <div>{this.state.val}</div>
    }
}
export default App;
```
上面代码中，每次打印的都是最新的状态。通过上面所讲的方式，调用setState方法是获取不到最新的状态，怎么这里又可以获取呢？

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/31.png)

原生事件的回调函数中调用setState方法，当执行到requestWork的时候，会执行expirationTime === Sync分支，它并没有被返回，而是继续执行performSyncWork方法，找到需要更新的数据，并进行组件的更新，等到所有都执行完之后，才会回到原生事件回调函数里，接着执行setState方法之后的代码，所有我们这里是可以立即获取到最新的状态。

#### 定时器（setTimeout或setInterval）中的setState
定时器任务其实是在合成事件中，也可以在react生命周期函数中，或者在原生事件中，但是如果我们了解浏览拿的事件循环机制的话，就指定定时器任务是一个异步任务，所以不管是在合成事件的回调函数中，还是原生事件的回调函数中，还是react的生命周期函数中，当执行到具体代码时，会把异步任务放入到一个异步队列中，等到这一次事件循环结束之后，再拿出来执行。所以当执行到定时器任务的回调函数时，其实上一个事件循环已经结束了。那么无论如何它都能获取到最新的状态值。

比如，在合成事件中，调用setTimeout(() => {this.setState(...)} , 0)，当合成事件回调函数执行到setTimeout时，会把定时器任务放入异步队列中，然后会执行finally语句块（看源码就知道了）里面的代码，等finally语句块里面代码执行完之后，isBatchingUpdates又变成了false，导致最后去执行异步队列里的setState方法时，requestWork方法里面的expirationTime === Sync为true，走的和原生事件中的setState一样的流程。所以在setState之后是可以获取到最新的状态值。

## 总结
- setState 只在合成事件和钩子函数中是“异步”的，在原生事件和 setTimeout 中都是同步的。
- setState的“异步”并不是说内部由异步代码实现，其实本身执行的过程和代码都是同步的，只是合成事件和钩子函数的调用顺序在更新之前，导致在合成事件和钩子函数中没法立马拿到更新后的值，形式了所谓的“异步”，当然可以通过第二个参数 setState(partialState, callback) 中的callback拿到更新后的结果。
- setState 的批量更新优化也是建立在“异步”（合成事件、钩子函数）之上的，在原生事件和setTimeout 中不会批量更新，在“异步”中如果对同一个值进行多次 setState ， setState 的批量更新策略会对其进行覆盖，取最后一次的执行，如果是同时 setState 多个不同的值，在更新时会对其进行合并批量更新。

[参考这篇](https://juejin.im/post/5b45c57c51882519790c7441)
