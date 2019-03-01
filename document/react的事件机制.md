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

查找真实DOM是比较好找的，直接通过event.target || event.srcElement || window；如果点击的是文本节点，那么就找到文本节点的父节点。

##### batchedUpdates
batchedUpdates方法的字面意思就是批处理更新，其实内部就是向上遍历节点，找到该节点的所有父节点并保存在ancestors数组中，主要是因为事件回调处理可能会改变DOM，所以要在调用事件回调函数之前，把触发事件的节点的所有的父节点都保存起来，就是为了防止在调用回调的时候会改变DOM结构，导致与React缓存的节点不一致。

batchedUpdates方法内部主要是调用handleTopLevel方法：

```javascript
function handleTopLevel(bookKeeping) {
    // 找到触发事件的DOM对应的FiberNode
    var targetInst = bookKeeping.targetInst;
    var ancestor = targetInst;
    // 向上遍历FiberNode，并将FiberNode的父节点保存在ancestors数组中
    do {
        if (!ancestor) {
          bookKeeping.ancestors.push(ancestor);
          break;
        }
        var root = findRootContainerNode(ancestor);
        if (!root) {
          break;
        }
        bookKeeping.ancestors.push(ancestor);
        ancestor = getClosestInstanceFromNode(root);
    } while (ancestor);
    // 循环ancestors数组，并调用runExtractedEventsInBatch方法
    // 这里的for循环是从前往后遍历，也就是说，先是会执行当前节点，然后是当前节点的父节点，以此类推。
    for (var i = 0; i < bookKeeping.ancestors.length; i++) {
        targetInst = bookKeeping.ancestors[i];
        runExtractedEventsInBatch(bookKeeping.topLevelType, targetInst, bookKeeping.nativeEvent, getEventTarget(bookKeeping.nativeEvent));
    }
}
```
##### runExtractedEventsInBatch
runExtractedEventsInBatch方法接受四个参数：
- 事件类型
- 触发事件的当前DOM对应的FiberNode节点
- 原生的事件对象
- 触发事件的目标对象（DOM节点）

runExtractedEventsInBatch方法，从字面意思上来讲，就是执行在更新队列中提取的事件，这个方法内部先是执行extractEvents方法。当我们再看extractEvents方法内部时，首先要了解内部出现的plugins是什么？我们打印一下：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/12.png)

其实plugins就是一个数组，里面保存的就是各种不同事件类型集合，比如：一些简单的事件类型，鼠标事件，change事件，select事件，beforeInput事件等。

知道plugins是一个数组，里面保存的就是各种事件类型集合，那么我们就要找一下这个plugins具体是怎么来的。

源码中有这么一段代码：

```
var interactiveEventTypeNames = [[TOP_BLUR, 'blur'], [TOP_CANCEL, 'cancel'], [TOP_CLICK, 'click'], [TOP_CLOSE, 'close'], [TOP_CONTEXT_MENU, 'contextMenu'], [TOP_COPY, 'copy'], [TOP_CUT, 'cut'], [TOP_AUX_CLICK, 'auxClick'], [TOP_DOUBLE_CLICK, 'doubleClick'], [TOP_DRAG_END, 'dragEnd'], [TOP_DRAG_START, 'dragStart'], [TOP_DROP, 'drop'], [TOP_FOCUS, 'focus'], [TOP_INPUT, 'input'], [TOP_INVALID, 'invalid'], [TOP_KEY_DOWN, 'keyDown'], [TOP_KEY_PRESS, 'keyPress'], [TOP_KEY_UP, 'keyUp'], [TOP_MOUSE_DOWN, 'mouseDown'], [TOP_MOUSE_UP, 'mouseUp'], [TOP_PASTE, 'paste'], [TOP_PAUSE, 'pause'], [TOP_PLAY, 'play'], [TOP_POINTER_CANCEL, 'pointerCancel'], [TOP_POINTER_DOWN, 'pointerDown'], [TOP_POINTER_UP, 'pointerUp'], [TOP_RATE_CHANGE, 'rateChange'], [TOP_RESET, 'reset'], [TOP_SEEKED, 'seeked'], [TOP_SUBMIT, 'submit'], [TOP_TOUCH_CANCEL, 'touchCancel'], [TOP_TOUCH_END, 'touchEnd'], [TOP_TOUCH_START, 'touchStart'], [TOP_VOLUME_CHANGE, 'volumeChange']];
var nonInteractiveEventTypeNames = [[TOP_ABORT, 'abort'], [TOP_ANIMATION_END, 'animationEnd'], [TOP_ANIMATION_ITERATION, 'animationIteration'], [TOP_ANIMATION_START, 'animationStart'], [TOP_CAN_PLAY, 'canPlay'], [TOP_CAN_PLAY_THROUGH, 'canPlayThrough'], [TOP_DRAG, 'drag'], [TOP_DRAG_ENTER, 'dragEnter'], [TOP_DRAG_EXIT, 'dragExit'], [TOP_DRAG_LEAVE, 'dragLeave'], [TOP_DRAG_OVER, 'dragOver'], [TOP_DURATION_CHANGE, 'durationChange'], [TOP_EMPTIED, 'emptied'], [TOP_ENCRYPTED, 'encrypted'], [TOP_ENDED, 'ended'], [TOP_ERROR, 'error'], [TOP_GOT_POINTER_CAPTURE, 'gotPointerCapture'], [TOP_LOAD, 'load'], [TOP_LOADED_DATA, 'loadedData'], [TOP_LOADED_METADATA, 'loadedMetadata'], [TOP_LOAD_START, 'loadStart'], [TOP_LOST_POINTER_CAPTURE, 'lostPointerCapture'], [TOP_MOUSE_MOVE, 'mouseMove'], [TOP_MOUSE_OUT, 'mouseOut'], [TOP_MOUSE_OVER, 'mouseOver'], [TOP_PLAYING, 'playing'], [TOP_POINTER_MOVE, 'pointerMove'], [TOP_POINTER_OUT, 'pointerOut'], [TOP_POINTER_OVER, 'pointerOver'], [TOP_PROGRESS, 'progress'], [TOP_SCROLL, 'scroll'], [TOP_SEEKING, 'seeking'], [TOP_STALLED, 'stalled'], [TOP_SUSPEND, 'suspend'], [TOP_TIME_UPDATE, 'timeUpdate'], [TOP_TOGGLE, 'toggle'], [TOP_TOUCH_MOVE, 'touchMove'], [TOP_TRANSITION_END, 'transitionEnd'], [TOP_WAITING, 'waiting'], [TOP_WHEEL, 'wheel']];


interactiveEventTypeNames.forEach(function (eventTuple) {
  addEventTypeNameToConfig(eventTuple, true);
});
nonInteractiveEventTypeNames.forEach(function (eventTuple) {
  addEventTypeNameToConfig(eventTuple, false);
});
```
interactiveEventTypeNames表示的是：交互式的事件类型集合，nonInteractiveEventTypeNames：表示的是：非交互式的事件类型集合。遍历这两个数组，并将事件类型名称作为属性，映射到一个对象上，具体的结构如下：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/13.png)


```javascript
// 结构如下：
{
    click : {
        phasedRegistrationNames : xxx,
        dependencies : xxx,
        isInteractive : xxx
    }
}
```
我们再来看一下这段代码：

```
// 依赖注入的方法
var injection = {
  injectEventPluginOrder: injectEventPluginOrder,
  injectEventPluginsByName: injectEventPluginsByName
};
```
```
// 将这五种eventPlugin依赖注入到eventPluginHub中
injection.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin
});

injection.injectEventPluginOrder(DOMEventPluginOrder);
```
执行上面这两个方法，内部都会调用recomputePluginOrdering方法。执行完这两个方法会分别将值保存到namesToPlugins和eventPluginOrder两个变量中。

**namesToPlugins：**

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/15.png)

**eventPluginOrder：**

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/14.png)

```
// 这个方法内部是通过for循环，遍历plugins，然后将每一个plugin保存到namesToPlugins这个对象上，最后调用recomputePluginOrdering方法
function injectEventPluginsByName(injectedNamesToPlugins) {
  var isOrderingDirty = false;
  for (var pluginName in injectedNamesToPlugins) {
    if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
      continue;
    }
    var pluginModule = injectedNamesToPlugins[pluginName];
    if (!namesToPlugins.hasOwnProperty(pluginName) || namesToPlugins[pluginName] !== pluginModule) {
      !!namesToPlugins[pluginName] ? invariant(false, 'EventPluginRegistry: Cannot inject two different event plugins using the same name, `%s`.', pluginName) : void 0;
      namesToPlugins[pluginName] = pluginModule;
      isOrderingDirty = true;
    }
  }
  if (isOrderingDirty) {
    recomputePluginOrdering();
  }
}
```
最后调用recomputePluginOrdering方法，通过namesToPlugins和eventPluginOrder重新计算plugins。

**plugins ：**

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/16.png)
