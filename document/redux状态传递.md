# react状态传递
react状态传递，其实说的就是react组件间是如何通信的。在说react组件间通信之前，我们应该要了解react组件之间有哪几种关系：父子组件，兄弟组件。
### 父组件向子组件通信
父组件可以通过向子组件传递==props==的方式来通信，通信是单向的。

```javascript
class Parent extends Component {
    constructor (props) {
        super(props);
        this.state = {
            message : 'hello child'
        }
    }
    render () {
        return (
            <Child message={this.state.message} />
        )
    }
};

class Child extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            <div>{this.props.message}</div>
        )
    }
}
```
如果组件层次比较深的话，我们可以通过{...props}的方式将父组件的状态一层层的传递给子组件。当父组件的state和props改变时，会导致所有子组件的声明周期改变。
```javascript
class Parent extends Component {
    constructor (props) {
        super(props);
        this.state = {
            message : 'hello child'
        }
    }
    componentDidUpdate () {
        console.log('Parent updated');
    }
    componentDidMount () {
        setTimeout(() => {
            this.setState({
                message : 'hello world'
            })
        } , 1000)
    }
    render () {
        return (
            <Child1 message={this.state.message} />
        )
    }
};

class Child1 extends Component {
    constructor (props) {
        super(props);
    }
    componentDidUpdate () {
        console.log('Child1 updated');
    }
    render () {
        return (
            <div>
                <div>{this.props.message}</div>
                <Child1_1 {...this.props} />
            </div>
        )
    }
}

class Child1_1 extends Component {
    constructor (props) {
        super(props);
    }
    componentDidUpdate () {
        console.log('Child1_1 updated');
    }
    render () {
        return (
            <div>{this.props.message}</div>
        )
    }
}
```
### 子组件向父组件通信
react组件的通信是单向的，只能是从上到下的方式来通信，如果子组件向父组件通信，其实也是通过父组件向子组件传递props的方式进行，只是父组件向子组件传递的是函数，在子组件中调用这个函数，并将数据作为参数传入到这个函数中，从而实现子组件向父组件通信。

```javascript
class Parent extends Component {
    constructor (props) {
        super(props);
        this.state = {
            message : 'hello child'
        }
    }
    componentDidUpdate () {
        console.log('Parent updated');
    }
    change (msg) {
        this.setState({
            message : msg
        })
    }
    render () {
        return (
            <Child1 change={(msg) => this.change(msg)} message={this.state.message} />
        )
    }
};

class Child1 extends Component {
    constructor (props) {
        super(props);
    }
    componentDidUpdate () {
        console.log('Child1 updated');
    }
    componentDidMount () {
        setTimeout(() => {
            // 调用函数，并将数据传递给父组件的函数
            this.props.change('hello andy');
        } , 2000)
    }
    render () {
        return (
            <div>
                <div>{this.props.message}</div>
                <Child1_1 {...this.props} />
            </div>
        )
    }
}

class Child1_1 extends Component {
    constructor (props) {
        super(props);
    }
    componentDidUpdate () {
        console.log('Child1_1 updated');
    }
    render () {
        return (
            <div>{this.props.message}</div>
        )
    }
}
```
如果组件层次结构太深的话，通过props来进行组件间的状态传递也是非常难以维护的。
### 兄弟组件之间的通信
兄弟组件之间的关系就是组件都拥有共同的父组件，如果想要一个组件的状态传递到另一个组件，我们可以先将一个组件的状态传递到父组件，再由父组件将状态通过props传递给另一个组件。

```javascript
class Parent extends Component {
    constructor (props) {
        super(props);
        this.state = {
            message : 'hello child'
        }
    }
    change (msg) {
        this.setState({
            message : msg
        });
    }
    componentDidUpdate () {
        console.log('Parent updated!');
    }
    render () {
        return (
            <div>
                <Child1 change={(msg) => this.change(msg)} />
                <Child2 {...this.state} />
            </div>
        )
    }
};

class Child1 extends Component {
    constructor (props) {
        super(props);
        this.handleClick1 = this.handleClick1.bind(this);
    }
    handleClick1 () {
        this.props.change('我点击了child1 button');
    }
    componentDidUpdate () {
        console.log('Child1 updated!');
    }
    render () {
        return (
            <div>
                <p>child1</p>
                <button onClick={this.handleClick1}>child1 button</button>
            </div>
        )
    }
};

class Child2 extends Component {
    constructor (props) {
        super(props);
    }
    componentDidUpdate () {
        console.log('Child2 updated!');
    }
    render () {
        return (
            <div>
                <p>child2</p>
                <div>{this.props.message}</div>
            </div>
        )
    }
}
```
如果组件层级太深，兄弟组件之间通信就会变得比较漫长，首先让一个组件将状态一层一层的向上传递到共同的父组件上，然后由父组件又一层一层的向下传递给另一个组件，这样的方式其实是很容易出错，而且只要父组件的状态改变，都会引起所有子组件的生命周期改变。那有没有其他方式可以解决这个问题呢？我们可以使用发布订阅模式来解决这个问题。
### 发布订阅模式
我们可以在全局设计一个发布订阅模式，用来发布和订阅消息，只要一个组件订阅了这个消息，当另一个组件发布这条消息的时候，它就会接收到这个消息，从而执行相应的操作。
```javascript
// 一个简单的发布订阅模式
let eventProxy = {
    events : {},
    on : function (key , fn) {
        if (this.events[key] == undefined) {
            this.events[key] = [];
        }
        this.events[key].push(fn);
    },
    trigger : function (key , ...args) {
        if (this.events[key].length > 0) {
            for (var i = 0 ; i < this.events[key].length ; i++) {
                this.events[key][i].apply(this , args);
            }
        };
    },
    off : function (key) {
        this.events[key] = [];
    }
};

class Parent extends Component {
    constructor (props) {
        super(props);
        this.state = {
            message : 'hello child'
        }
    }
    componentDidUpdate () {
        console.log('Parent updated!');
    }
    render () {
        return (
            <div>
                <Child1 />
                <Child2 {...this.state} />
            </div>
        )
    }
};

class Child1 extends Component {
    constructor (props) {
        super(props);
        this.handleClick1 = this.handleClick1.bind(this);
    }
    handleClick1 () {
        // 当点击Child1组件的按钮时，我们发布一个消息
        eventProxy.trigger('message' , '这是兄弟组件Child1发布的一个消息');
    }
    componentDidUpdate () {
        console.log('Child1 updated!');
    }
    render () {
        return (
            <div>
                <p>child1</p>
                <button onClick={this.handleClick1}>child1 button</button>
            </div>
        )
    }
};

class Child2 extends Component {
    constructor (props) {
        super(props);
        this.state = {
            message : '没有接收到兄弟组件Child1的消息'
        };
    }
    componentDidUpdate () {
        console.log('Child2 updated!');
    }
    componentDidMount () {
        // 这里来订阅这个消息
        eventProxy.on('message' , (message) => {
            this.setState({
                message
            })
        });
    }
    render () {
        return (
            <div>
                <p>child2</p>
                <div>{this.state.message}</div>
            </div>
        )
    }
}
```
Child2组件订阅了message，当我们点击Child1组件的按钮，发布一条message时，Child2就会执行相应的操作，这样避免了兄弟组件之间的状态要通过父组件作为中间人来传递，而且因为不会通过父组件来传递状态，所以并不会引发父组件及其所属子组件的生命周期改变。
### redux
除了上面这几种方式来进行组件间通信之外，我们也可以使用redux。redux是将状态都保存在它的内部的state上面，通过调用dispatch方法来发送一个action，然后会调用reducer函数来修改state，通过subscribe方法来监听state的改变，如果state改变，就可以触发相应的回调函数，从而通过调用getState方法来获取最新的state。其实redux和发布订阅模式类似。

```javascript
let reducer = function (state = 0 , action) {
    switch (action.type) {
        case 'add' :
        return state + 1;
        case 'decrease' :
        return state - 1;
        default :
        return state
    }
};

let store = createStore(reducer);

class Parent extends Component {
    constructor (props) {
        super(props);
        this.state = {
            tick : 0
        }
    }
    componentDidMount () {
        store.subscribe(() => {
            let tick = store.getState();
            this.setState({
                tick
            })
        })
    }
    render () {
        return (
            <div>
                <div>tick is {this.state.tick}</div>
                <Child1 tick={this.state.tick} />
            </div>
        )
    }
};

class Child1 extends Component {
    constructor (props) {
        super(props);
        this.add = this.add.bind(this);
        this.decrease = this.decrease.bind(this);
    }
    add () {
        store.dispatch({
            type : 'add',
            tick : this.props.tick + 1
        });
    }
    decrease () {
        store.dispatch({
            type : 'decrease',
            tick : this.props.tick - 1
        })
    }
    render () {
        return (
            <div>
                <p>Child1</p>
                <button onClick={this.add}>add</button>
                <button onClick={this.decrease}>decrease</button>
            </div>
        )
    }
};
```
### Context