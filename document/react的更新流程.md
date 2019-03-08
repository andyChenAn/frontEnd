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

