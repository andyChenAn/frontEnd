# react组件生命周期(16以上版本)
React组件的生命周期可以分为三个过程：

- 挂载过程（Mount）：第一次把组件挂载到DOM树上。
- 更新过程（Update）：组件渲染更新的过程。
- 卸载过程（Unmount）：组件从DOM树删除的过程。
### 挂载过程
1、首先调用constructor，进行组件初始化操作，一般会在这里进行组件state初始化，以及绑定成员函数的this（这里我们也可以直接使用箭头函数，这样就不需要绑定在constructor里面绑定this了）

```javascript
class App extends Component {
	constructor (props) {
		super(props);
		// 这里进行组件state初始化操作
		this.state = {
			name : 'andy'
		}
		// 绑定成员函数this
		this.handleClick = this.handleClick.bind(this);
	}
	handleClick () {
		this.setState({
			name : 'jack'
		});
	}
	render () {
		const { name } = this.state;
		return (
			<div>
				<button onClick={this.handleClick}>click here</button>
				<div>{name}</div>
			</div>
		)
	}
}
```
2、调用componentWillMount函数。
3、调用render函数来渲染组件，这个函数一定会有一个返回值，返回的是一个React元素或者null。这里仅仅只是返回一个React元素，并没有将组件挂载到DOM树上。一般我们在这里可以通过this.state和this.props来控制返回的React元素。

4、调用componentDidMount函数，这个函数会在组件被挂载到DOM树之后调用。一般我们会在这里通过请求来获取数据和绑定事件监听函数。

```javascript
class App extends Component {
	constructor (props) {
		super();
		console.log(props);
		// 这里进行组件state初始化操作
		this.state = {
			name : 'andy'
		}
		// 绑定成员函数this
		this.handleClick = this.handleClick.bind(this);
	}
	handleClick () {
		this.setState({
			name : 'jack'
		});
	}
	componentDidMount () {
		// 发送请求获取数据
		axios.get('xxx')
		.then(res => {

		})
		.catch(err => {

		})
	}
	render () {
		const { name } = this.state;
		return (
			<div>
				<button onClick={this.handleClick}>click here</button>
				<div>{name}</div>
			</div>
		)
	}
}
```
### 更新过程
我们通过修改组件的props和state来更新组件。更新过程会触发以下声明周期函数：

1、当props改变时，会触发componentWillReceiveProps函数。

2、会调用shouldComponentUpdate(nextProps , nextState)函数，这个函数接受两个参数，一个是改变后的props，一个是改变后的state，调用该返回必须返回一个布尔值，如果是false，表示不需要重新渲染组件（不会调用render函数），如果是true，表示需要重新渲染组件（会调用render函数）。一般会在这里进行优化。

```javascript
class Button extends Component {
    constructor (props) {
        super(props);
        this.state = {
            tick : 0
        };
        console.log("组件初始化");
    }
    onClickHandle () {
        this.setState({
            tick : ++this.state.tick
        });
        this.props.onHandleClick();
    }
    shouldComponentUpdate (nextProps , nextState) {
        console.log('组件是否需要更新');
        // 通过返回值来表示组件是否需要重新渲染
        return true;
    }
    componentDidUpdate () {
        console.log('组件已经更新');
    }
    componentDidMount () {
        console.log('组件已经挂载');
    }
    render () {
        console.log('渲染');
        const { color } = this.props;
        return <button onClick={() => this.onClickHandle()} style={{color : `${color}`}}>{this.state.tick}</button>
    }
}

class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            color : 'black'
        }
    }
    handleClick = () => {
        this.setState({
            color : 'red'
        })
    }
    render () {
        return (
            <div>
                <h1>hello andy</h1>
                <h1 style={{color : 'red'}}>hello peter</h1>
                <Button onHandleClick={this.handleClick} color={this.state.color} name="点我" />
            </div>
        )
    }
}
```
上面的shouldComponentUpdate函数中，如果返回false，那么当我们点击按钮时，不会加1，因为不会调用render函数进行重新渲染，并且也不会触发componentDidUpdate函数，如果返回true，那么点击按钮时，会加1。

3、如果shouldComponentUpdate函数返回true，那么会调用componentWillUpdate函数。

4、调用render函数，进行渲染。这个地方会重新创建react元素，并绑定最新的props和state。

```javascript
class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            tick : 0
        };
        console.log("组件初始化");
    }
    onClickHandle () {
        this.setState({
            tick : ++this.state.tick
        });
    }
    shouldComponentUpdate (nextProps , nextState) {
        console.log('组件是否需要更新');
        return true;
    }
    componentDidUpdate () {
        console.log('组件已经更新');
    }
    componentDidMount () {
        console.log('组件已经挂载');
    }
    render () {
        console.log('渲染');
        // 这里获取的是最新的state
        console.log(this.state);
        return <button onClick={() => this.onClickHandle()}>{this.state.tick}</button>
    }
}
```

5、会调用componentDidUpdate函数，这个函数表示React组件已经更新完成了。
### 卸载过程

当我们不需要一个组件时，我们可以把组件从DOM树上删除，在删除前的这个时候会触发componentWillUnmount函数。在这个函数我们一般会去解绑事件，删除定时器，或者其他一些没有用的变量等，主要是为了防止内存泄漏。

```javascript
class Button extends Component {
    constructor (props) {
        super(props);
        console.log("组件初始化");
    }
    shouldComponentUpdate (nextProps , nextState) {
        console.log('组件是否需要更新');
        return true;
    }
    componentDidUpdate () {
        console.log('组件已经更新');
    }
    componentDidMount () {
        console.log('组件已经挂载');
        window.addEventListener('resize' , this.handleResize);
    }
    componentWillUnmount () {
        console.log('组件将被卸载');
        window.removeEventListener('resize' , this.handleResize);
    }
    handleResize = () => {
        console.log('改变窗口大小触发该事件');
    }
    render () {
        console.log('渲染');
        return (
            <button onClick={() => this.onClickHandle()}>click here</button>
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
    deleteComponent = () => {
        this.setState({
            show : false
        })
    }
    render () {
        return (
            <div>
                <button onClick={this.deleteComponent}>删除组件</button>
                {
                    this.state.show ? <Button /> : null
                }
            </div>
        )
    }
}
```
### 注意点
在16.3版本以上的React中，componentWillMount，componentWillReceiveProps，componentWillUpdate将被删除，当然还是可以用的，只是被标记了不安全，今后应该会被删除。