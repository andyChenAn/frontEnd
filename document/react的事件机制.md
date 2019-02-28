# react的事件机制
react的事件机制，主要分为两个阶段：事件注册和事件分发。当我们渲染完FiberNode tree，创建真实DOM，并建立虚拟DOM和真实DOM之间的联系后，就会调用setInitialDOMProperties方法，为DOM添加属性和事件，其实react的事件注册就是从这里开始的。

举个例子：

```javascript
class App extends Component {
    constructor() {
        super();
        this.state = {
            count : 0
        };
    }
    add = () => {
        this.setState({
            count : this.state.count + 1
        })
    }
    render() {
        return (
            <div>
                <p>{this.state.count}</p>
                <button onClick={this.add}>add</button>
            </div>
        )
    }
}
export default App;
```
### 事件注册
以上面的例子为例，我们来看一下button这个元素对应的虚拟DOM中的props对象有哪些属性：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/11.png)

当调用setInitialDOMProperties方法，该方法内部会遍历虚拟DOM中的props，给最终要渲染的DOM添加一系列的属性，比如：style，class，text，innerHTML，autoFocus，event等。

如果是prop是函数的话，那么就会执行ensureListeningTo这个方法，我们来看一下这个方法内部：

```javascript
function ensureListeningTo(rootContainerElement, registrationName) {
    // 其实这个方法里面就是判断当前的这个DOM是不是document或者fragment
    // 如果不是的话，那么就会获取当前DOM的document，然后将事件委托到document上
    var isDocumentOrFragment = rootContainerElement.nodeType === DOCUMENT_NODE || rootContainerElement.nodeType === DOCUMENT_FRAGMENT_NODE;
    var doc = isDocumentOrFragment ? rootContainerElement : rootContainerElement.ownerDocument;
    listenTo(registrationName, doc);
}
```
在listenTo方法中，除了scroll，focus，blur，cancel，close方法走trapCapturedEvent方法，invalid，submit，reset方法不处理之外，剩下的事件类型全走default，执行trapBubbledEvent这个方法，trapCapturedEvent和trapBubbledEvent二者唯一的不同之处就在于，对于最终的合成事件，前者注册捕获段的事件监听器，而后者则注册冒泡阶段的事件监听器。

我们来看一下trapBubbledEvent方法：

```javascript
function trapBubbledEvent(topLevelType, element) {
    if (!element) {
        return null;
    }
    var dispatch = isInteractiveTopLevelEventType(topLevelType) ? dispatchInteractiveEvent : dispatchEvent;
    // 其实这个方法内部就是调用DOM的addEventListener来注册事件
    addEventBubbleListener(element, getRawEventName(topLevelType),
    // Check if interactive and wrap in interactiveUpdates
    dispatch.bind(null, topLevelType));
}
```

```javascript
function addEventBubbleListener(element, eventType, listener) {
    element.addEventListener(eventType, listener, false);
}
```
其实addEventBubbleListener方法内部就是一个DOM调用addEventListener方法来注册事件，而事件的回调函数就是dispatch.bind(null, topLevelType)返回的函数。

上面的流程基本上就是react事件注册的流程。基本上在事件注册流程中，主要做的就是事件的兼容，以及将事件委托到document上。
### 事件分发
当所有的事件都委托到了document上，那么事件触发的时候，就需要一个分发的过程，来找到哪个元素触发了事件，并且执行相应的回调函数。当触发事件的时候会调用dispatchEvent。
##### dispatchEvent
dispatchEvent方法中，有这么一段代码：

```javascript
var nativeEventTarget = getEventTarget(nativeEvent);
var targetInst = getClosestInstanceFromNode(nativeEventTarget);
```
代码的意思就是找到触发事件的DOM和DOM对应的React元素。而我们在组件渲染的时候都知道真实的DOM和React元素之间是通过internalInstanceKey来向关联的。所以我们通过DOM的internalInstanceKey属性就可以找到对应的React元素。