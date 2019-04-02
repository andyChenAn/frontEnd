# react的调度机制
通过react v16版本的源码中，我们可以看到，对于react的任务调度的部分是放在schedular这个库中。不过这个调度机制是异步调度，目前我们使用react做的应用基本上都是同步的。

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

通过上面代码中，我们可以看到有两种情况，第一种情况是：当添加第一个任务节点的时候开始启动任务执行，第二种情况是：当新添加的任务节点取代之前的任务节点称为新的第一个节点的时候，也会启动任务执行。这就是源码中的==ensureHostCallbackIsScheduled==方法执行的内容。

因为第一种情况表示的是，任务从无到有，所以应该立即执行。第二种情况表示的是，有新的优先级最高的任务，应该停止之前要执行的任务，重新从新的任务开始执行。

如何在浏览器每一帧绘制完的空闲时间来做一些事情？react使用的是requestAnimationFrame和MessageChannel来实现。

### requestAnimationFrameWithTimeout方法
```javascript
var requestAnimationFrameWithTimeout = function (callback) {
    rAFID = localRequestAnimationFrame(function (timestamp) {
        // cancel the setTimeout
        localClearTimeout(rAFTimeoutID);
        callback(timestamp);
    });
    rAFTimeoutID = localSetTimeout(function () {
        // cancel the requestAnimationFrame
        localCancelAnimationFrame(rAFID);
        callback(exports.unstable_now());
    }, ANIMATION_FRAME_TIMEOUT);
};
```
上面这段代码是什么意思呢？其实就是当我们调用requestAnimationFrameWithTimeout方法，并且传入一个callback参数的时候，会启动一个requestAnimationFrame和一个setTimeout，两个都会执行，但是由于requestAnimationFrame的执行优先级高于setTimeout，所以会先执行requestAnimationFrame，当执行requestAnimationFrame的时候，会调用localClearTimeout方法（其实就是clearTimeout方法）取消setTimeout定时器的执行，所以在页面激活的情况下，其实执行的就是requestAnimationFrame。

但是requestAnimationFrame方法，在页面切换到未激活的时候是不工作的，这时候requestAnimationFrameWithTimeout方法其实就启动了一个100毫秒的定时器，来执行任务。
### ensureHostCallbackIsScheduled方法。
当我们将任务通过过期时间进行排序添加到链表中后，我们就要在合适的时机去执行这些任务，这里我们会调用ensureHostCallbackIsScheduled方法。

```javascript
function ensureHostCallbackIsScheduled() {
    // 判断是否有正在执行的任务，如果有的话，那么就直接跳过
    if (isExecutingCallback) {
        return;
    }
    // 如果没有正在执行的任务，那么会从链表中取出最早过期的任务执行
    var expirationTime = firstCallbackNode.expirationTime;
    if (!isHostCallbackScheduled) {
        isHostCallbackScheduled = true;
    } else {
        cancelHostCallback();
    }
    // 执行任务
    requestHostCallback(flushWork, expirationTime);
}
```

```javascript
// 这里主要是通过调用requestAnimationFrame来执行任务操作
requestHostCallback = function (callback, absoluteTimeout) {
    // 当前任务
    scheduledHostCallback = callback;
    // 当前任务的过期时间
    timeoutTime = absoluteTimeout;
    if (isFlushingHostCallback || absoluteTimeout < 0) {
        port.postMessage(undefined);
    } else if (!isAnimationFrameScheduled) {
      isAnimationFrameScheduled = true;
      requestAnimationFrameWithTimeout(animationTick);
    }
};
```

```javascript
var animationTick = function (rafTime) {
    if (scheduledHostCallback !== null) {
        // 有任务再进行递归，没任务的话不需要工作
        requestAnimationFrameWithTimeout(animationTick);
    } else {
        isAnimationFrameScheduled = false;
      return;
    }
    // 下一帧开始时间，其实就等于当前帧的开始时间加上一帧的渲染时间再减去当前帧的截止时间
    var nextFrameTime = rafTime - frameDeadline + activeFrameTime;
    // 如果下一帧的开始时间小于一帧的渲染时间，那么就会重新调整一帧的渲染时间
    // 这里渲染频率最高不能超过120hz，不然渲染频率过高
    // 这里会自动的去调节帧的渲染频率，一开始的时候，我们默认是一秒33帧
    if (nextFrameTime < activeFrameTime && previousFrameTime < activeFrameTime) {
        if (nextFrameTime < 8) {
            nextFrameTime = 8;
        }
        activeFrameTime = nextFrameTime < previousFrameTime ? previousFrameTime : nextFrameTime;
    } else {
        previousFrameTime = nextFrameTime;
    }
    // 当前帧的截止时间，用当前帧的开始时间加上每一帧的渲染时间
    frameDeadline = rafTime + activeFrameTime;
    // 通过消息通道发送消息
    if (!isMessageEventScheduled) {
        isMessageEventScheduled = true;
        port.postMessage(undefined);
    }
};
```
### 创建消息通道

```javascript
// 通过MessageChannel来创建一个消息通道，这个消息通道有两个MessagePort类型的属性，port1和port2，就好比消息通道的两端，然后一端可以接收另一端发送的消息。
var channel = new MessageChannel();
// port2用来发送消息
var port = channel.port2;
// prot1是用来接收port2发送的消息，在这个回调中做具体的任务调度工作。
channel.port1.onmessage = function (event) {
    isMessageEventScheduled = false;

    var prevScheduledCallback = scheduledHostCallback;
    var prevTimeoutTime = timeoutTime;
    scheduledHostCallback = null;
    timeoutTime = -1;
    
    // 获取当前时间
    var currentTime = exports.unstable_now();
    
    // 这个用来表示当前帧已经过期，并且当前任务已经过期
    var didTimeout = false;
    // 当前帧已经过期
    if (frameDeadline - currentTime <= 0) {
        // 当前任务已经过期
        if (prevTimeoutTime !== -1 && prevTimeoutTime <= currentTime) {
            didTimeout = true;
        } else {
            // 当前任务没有过期，但是当前帧已经过期，那么就把当期任务放到下一帧执行
            // 这里可能是由于浏览器渲染比较久，导致当前帧过期了，那就将任务放到下一帧处理
            if (!isAnimationFrameScheduled) {
                isAnimationFrameScheduled = true;
                requestAnimationFrameWithTimeout(animationTick);
            }
            // 直接退出，不调用回调
            scheduledHostCallback = prevScheduledCallback;
            timeoutTime = prevTimeoutTime;
            return;
        }
    }
    // 当前帧没有过期，也就是说当前帧还有剩余时间，那么就执行任务
    if (prevScheduledCallback !== null) {
        isFlushingHostCallback = true;
        try {
            prevScheduledCallback(didTimeout);
        } finally {
            isFlushingHostCallback = false;
        }
    }
};
```

```javascript
function flushWork(didTimeout) {
    if (enableSchedulerDebugging && isSchedulerPaused) {
        return;
    }
    // 表示正在执行任务
    isExecutingCallback = true;
    var previousDidTimeout = currentDidTimeout;
    currentDidTimeout = didTimeout;
    try {
        // 任务已经过期
        if (didTimeout) {
            while (firstCallbackNode !== null && !(enableSchedulerDebugging && isSchedulerPaused)) {
                // 获取当前时间
                var currentTime = exports.unstable_now();
                // 链表中的第一个任务的过期时间小于等于当前时间，说明第一个任务已经过期
                if (firstCallbackNode.expirationTime <= currentTime) {
                    do {
                        // 执行第一个任务，从链表中移除第一个任务，并把第二个任务作为链表的第一个任务
                        // 执行任务可能会产生新的任务，再把新的任务插入到任务链表中
                        flushFirstCallback();
                    } while (firstCallbackNode !== null &&             firstCallbackNode.expirationTime <= currentTime && !(enableSchedulerDebugging && isSchedulerPaused));
                    continue;
                }
                break;
            }
        } else {
            // 任务没有过期，并且当前帧还有剩余的时间，那么也会去执行任务
            if (firstCallbackNode !== null) {
                do {
                    if (enableSchedulerDebugging && isSchedulerPaused) {
                        break;
                    }
                    flushFirstCallback();
                } while (firstCallbackNode !== null && !shouldYieldToHost());
                // 这里的shouldYieldToHost()方法就是用来判断当前帧是否过期，取反的话就表示当前帧没有过期
            }
        }
    } finally {
        isExecutingCallback = false;
        currentDidTimeout = previousDidTimeout;
        // 最后，如果还有剩余任务的话，那么就再启动新的一轮任务执行调度
        if (firstCallbackNode !== null) {
            ensureHostCallbackIsScheduled();
        } else {
            isHostCallbackScheduled = false;
        }
        // 退出之前，如果还有任务，并且任务的优先级是最高级，那么就都执行一遍任务
        flushImmediateWork();
    }
}
```
根据上面代码，flushWork方法，会根据didTimeout有两种处理情况，如果didTimeout为true，就会把任务链表中的所有过期任务都执行一遍，如果didTimeout为false，那么会在当前帧过期之前尽可能多的去执行链表中的任务。

```javascript
while (firstCallbackNode !== null && !(enableSchedulerDebugging && isSchedulerPaused)) {
    // 获取当前时间
    var currentTime = exports.unstable_now();
    // 链表中的第一个任务的过期时间小于等于当前时间，说明第一个任务已经过期
    if (firstCallbackNode.expirationTime <= currentTime) {
        do {
            // 执行第一个任务，从链表中移除第一个任务，并把第二个任务作为链表的第一个任务
            // 执行任务可能会产生新的任务，再把新的任务插入到任务链表中
            flushFirstCallback();
        } while (firstCallbackNode !== null &&             firstCallbackNode.expirationTime <= currentTime && !(enableSchedulerDebugging && isSchedulerPaused));
        continue;
    }
    break;
}
```
上面代码中，有两层循环，我们先来看里面这层循环，如果链表上有任务，并且任务已过期，那么就会执行这个任务，直到链表上没有任务或者链表上的任务没有过期为止，这个时候就会又执行外层的循环，外层循环中，又会重新获取一次当前时间，然后再去判断任务是否过期，如果过期，那么就继续执行内层循环，如果没有过期，那么就会推出外层循环，继续执行后面代码。

## 总结
react的任务调度流程：

- 1、任务根据优先级和任务加入时的当前时间来确定任务的过期时间
- 2、任务根据过期时间进行排序并添加到链表中。
- 3、有两种情况会启动任务调度，一种情况是任务链表从无到有时，会启动任务调度，另外一种情况是新加入了最高优先级的任务，也会启动任务调度。
- 4、任务调度是通过requestAnimationFrame和MessageChannel来模拟实现的。
- 5、requestAnimationFrame的回调函数会在帧渲染前执行，用来计算当前帧的截止时间，MessageChannel的onmessage回调函数会在帧渲染后执行，根据当前帧截止时间，当前时间，任务链表中第一个任务的过期时间来决定当前帧是否执行任务（或者是到下一帧执行）
- 6、如果执行任务，则根据任务是否过期来确定如何执行任务。任务过期的话就会把链表中所有过期的任务都执行一遍直到没有任务或者没有任务过期为止。任务没有过期的话，则会在当前帧过期之前尽可能多的执行任务。最后如果还有任务，就回到第5步，放到下一帧重新走流程。

### Life of a frame
![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/23.png)

一帧里面除了上面图片中干的活之外就是空闲时间了。

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/24.png)
