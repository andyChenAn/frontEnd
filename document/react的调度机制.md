# react的调度机制
通过react v16版本的源码中，我们可以看到，对于react的任务调度的部分是放在schedular这个库中。

## 基础
在看schedular库中，有一些基础知识，我们需要先了解一下。
### 1、window.performance.now
这个方法表示的是从页面加载开始时，到当前之间的时间，单位为毫秒。
### 2、window.requestAnimationFrame
这个方法接受一个回调函数作为参数，表示的是推迟回调函数的执行，并且会推迟到浏览器在下一次重绘之前调用回调函数，也就是说该回调函数会在浏览器下一次重绘之前执行。（回调函数会接受一个参数，这个参数是一个时间戳，是performance.now()的返回值，表示的是从页面加载开始到当前的时间）。

如果想让浏览器在下一次重绘之前继续更新下一帧动画，那么可以在回调函数中再次调用window.requestAnimationFrame方法。
### 3、window.MessageChannel
这个接口允许我们创建一个新的消息通道，并通过它的两个MessagePort属性发送数据。

用法：

```javascript
let ch = new MessageChannel();
ch.port1.postMessage('我是port1发送的消息');
ch.port2.postMessage('我是port2发送的消息');
ch.port1.onmessage = function (e) {
    console.log('这是port1接收的消息' , e.data);
}
ch.port2.onmessage = function (e) {
    console.log('这是port2接收的消息' , e.data);
}
```
## 调度
### 1、任务优先级
react对任务的优先级分为五种：
```javascript
var ImmediatePriority = 1;      // 最高优先级
var UserBlockingPriority = 2;   // 用户阻塞优先级
var NormalPriority = 3;         // 普通优先级
var LowPriority = 4;            // 低优先级
var IdlePriority = 5;           // 空闲优先级
```
五种优先级所对应的过期时间：

```javascript
var maxSigned31BitInt = 1073741823;

// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;   // 立马过期
// Eventually times out
var USER_BLOCKING_PRIORITY = 250;      // 250毫秒后过期
var NORMAL_PRIORITY_TIMEOUT = 5000;    // 5秒后过期
var LOW_PRIORITY_TIMEOUT = 10000;      // 10秒后过期
// Never times out
var IDLE_PRIORITY = maxSigned31BitInt;  // 永不过期
```
### 添加任务
react添加任务，我们需要了解，它是怎么添加的，添加到哪里的？我们来具体看一下代码中是怎么实现的：
```javascript
function unstable_scheduleCallback(callback, deprecated_options) {
    // 返回的是一个调用performance.now()的时间戳
    var startTime = currentEventStartTime !== -1 ? currentEventStartTime : exports.unstable_now();

    // 过期时间
    var expirationTime;
    if (typeof deprecated_options === 'object' && deprecated_options !== null && typeof deprecated_options.timeout === 'number') {
        expirationTime = startTime + deprecated_options.timeout;
    } else {
        // 根据任务优先级来设置任务的过期时间
        switch (currentPriorityLevel) {
            case ImmediatePriority:
                expirationTime = startTime + IMMEDIATE_PRIORITY_TIMEOUT;
            break;
            case UserBlockingPriority:
                expirationTime = startTime + USER_BLOCKING_PRIORITY;
            break;
            case IdlePriority:
                expirationTime = startTime + IDLE_PRIORITY;
            break;
            case LowPriority:
                expirationTime = startTime + LOW_PRIORITY_TIMEOUT;
            break;
            case NormalPriority:
            default:
            expirationTime = startTime + NORMAL_PRIORITY_TIMEOUT;
        }
    }
    
    // 任务节点，
    var newNode = {
        callback: callback,    // 具体的任务内容
        priorityLevel: currentPriorityLevel,    // 当前任务的优先级
        expirationTime: expirationTime,    // 当前任务的过期时间
        next: null,    // 当前任务的下一个任务节点
        previous: null     // 当前任务的上一个任务节点
    };

    // 向链表中插入任务节点，通过任务的过期时间来排序
    // 如果不存在任务节点，说明这是第一个任务，所以这个新的任务节点就是第一个任务节点，并且该节点的next和previous都指向自己，形成双循环结构。
    // 如果已经存在任务节点，那么就会通过任务的过期时间去排序，如果当前任务的过期时间大于新任务的过期时间，那么说明新任务的过期时间在当前任务之前，所以新任务会更快执行，所以会把新任务放在当前任务的前面
    if (firstCallbackNode === null) {
        // This is the first callback in the list.
        firstCallbackNode = newNode.next = newNode.previous = newNode;
        ensureHostCallbackIsScheduled();
    } else {
        // 下一个任务的位置
        var next = null;
        var node = firstCallbackNode;
        do {
            if (node.expirationTime > expirationTime) {
                // The new callback expires before this one.
                next = node;
                break;
            }
            node = node.next;
        } while (node !== firstCallbackNode);
        
        // 找了一圈发现，没有一个任务的过期时间比新的任务大，那么就说明新任务应该是在链表的最后，所以新任务的下一个任务就是第一个任务
        if (next === null) {
            next = firstCallbackNode;
        } else if (next === firstCallbackNode) {
            // 找第一个的时候就找到了next，那么说明新的任务要放在第一个任务的前面
            firstCallbackNode = newNode;
            ensureHostCallbackIsScheduled();
        }
        
        // 任务之间的关联
        var previous = next.previous;
        previous.next = next.previous = newNode;
        newNode.next = next;
        newNode.previous = previous;
    }

    return newNode;
}
```
上面的代码就是如何插入任务，并且通过任务的过期时间，将这些任务都进行了排序，那任务是什么时候执行的呢？
