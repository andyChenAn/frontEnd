# react组件
组件从概念上看就像是一个函数，它可以接受任意的输入值(称之为"props")，并返回一个需要在页面上展示的React元素。（来自[React官网的定义](https://react.docschina.org/docs/components-and-props.html)）

我们都知道react.js是一个用户构建用户界面的JavaScript库。而构建用户界面的最基本单元就是react元素。一个页面可以分为很多部分，而每一个部分都是由一个一个的组件所构成，所以说，react.js的其中一个特点就是组件化开发。
### 如何创建一个react组件
##### 函数定义组件
定义一个组件最简单的方式就是使用JavaScript函数，函数定义的组件是无状态组件

```javascript
const App = (props) => {
	return <div>hello andy</div>;
}
```

##### 类定义组件
类定义的组件是有状态组件
```javascript
class App extends Component {
	constructor (props) {
		super(props);
	}
	render () {
		return <div>hello andy</div>;
	}
}
```
**注意：无论是函数定义的组件还是类定义的组件，都不能修改自己的props。**

```javascript
class App extends Component {
	constructor (props) {
		super(props);
	}
	render () {
		return <Button name="andy" />
	}
}

class Button extends Component {
	constructor (props) {
		super(props);
	}
	clickHandler () {
		// 这里是不能修改props的值的，如果修改的话会直接报错
		this.props.name = 'jack';
	}
	render () {
		return <button onClick={() => this.clickHandler()}>click now!</button>
	}
}
```
上面代码当点击按钮时，会报错：该属性不能修改。

```
TypeError: Cannot assign to read only property 'name' of object '#<Object>'
```
### 有状态组件和无状态组件
有状态组件指的是，组件中存在state，而无状态组件指的是，组件中不存在state，它只是一个简单的组件，接受props作为参数，来展示内容。

**无状态组件：**

```javascript
class List extends Component {
	constructor (props) {
		super(props);
	}
	render () {
		const nameList = this.props.names.map(name => (
			<li key={name}>{name}</li>
		));
		return (
			<ul>
				{nameList}
			</ul>
		)
	}
}

class App extends Component {
	constructor (props) {
		super(props);
	}
	render () {
		const names = ['andy' , 'jack' , 'alex'];
		return <List names={names} />
	}
}
```
**有状态组件：**

```javascript
class App extends Component {
	constructor (props) {
		super(props);
		this.state = {
			tick : 0
		}
	}
	onClickHandle () {
		this.setState({
			tick : ++this.state.tick
		})
	}
	render () {
		return (
			<div>
				<button onClick={() => this.onClickHandle()}>点我</button>
				<div>{this.state.tick}</div>
			</div>
		)
	}
}
```
### 展示组件和容器组件
如果我们将组件分为两类，会发现组件更加容易复用，而这两类组件可以称为展示组件和容器组件。

**展示组件：**
展示组件只关注页面展示，通常组件内部有一些DOM标签和组件自己的样式。如果不需要state，生命周期钩子，或者性能优化，那么一般都是写成函数式的组件。

**容器组件：**
容器组件主要是用来给展示组件提供数据，这样我们可以在容器组件中去获取数据，然后将数据通过props的形式传递给展示组件。

```javascript
import React, { Component } from 'react';
import axios from 'axios';

// 这个容器组件主要负责获取数据，并通过props传递给子组件
class UserContainer extends Component {
	constructor (props) {
		super(props);
		this.state = {
			users : []
		}
	}
	componentDidMount () {
		axios.get("https://api.github.com/search/repositories?q=language:javascript&sort=stars")
		.then(res => {
			this.setState({
				users : res.data.items
			})
		})
		.catch(err => {
			console.log(err);
		})
	}
	render () {
		return <UserList users={this.state.users} />
	}
}

// 子组件主要负责页面展示
class UserList extends Component {
	constructor (props) {
		super(props);
	}
	render () {
		const { users } = this.props;
		const userList = users.map(user => (
			<li key={user.id}>{user.name}</li>
		));
		return (
			<ul>
				{userList}
			</ul>
		)
	}
}

class App extends Component {
	constructor (props) {
		super(props);
		this.state = {
			tick : 0
		}
	}
	render () {
		return (
			<UserContainer />
		)
	}
}
```
### 高阶组件
高阶组件就是一个函数，接受一个组件作为参数，返回一个新的组件。（这里就是用一个组件包装另一个组件）

##### 高阶组件的实现方式
1、属性代理(props proxy)

高阶组件来操控传递给包装组件的属性。

2、继承反转

高阶组件继承包装组件。

#### props proxy

```javascript
function ppHOC(WrappedComponent) {
  return class PP extends React.Component {
    render() {
      return <WrappedComponent {...this.props}/>
    }
  }
}
```
上面代码就是一个通过props proxy方式来实现高阶组件，这里最重要的部分就是HOC返回了一个WrappedComponent类型的React元素，并且也接收了props，所以这才叫做props proxy。
### 用函数作为子组件
组件接收一个函数作为他的子元素。比如：

```javascript
class App extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            {this.props.children("andy")}
        )
    }
}
```
其实将子组件作为函数的用法比较简单，像下面这个例子：

```javascript
const root = document.getElementById('root');

class Welcome extends React.Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            <div>
                {this.props.children("welcome to China")}    
            </div>
        )
    }
}
class App extends React.Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            <Welcome>
                {name => <h1>{name}</h1>}
            </Welcome>
        )
    }
}

ReactDOM.render(<App /> , root)
```

```javascript
const root = document.getElementById('root');

class Welcome extends React.Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            <div>
                {this.props.children('red' , 18 , 'andychen')}    
            </div>
        )
    }
}
class App extends React.Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            <Welcome>
                {(color , fontSize , name) => <h1 style={{color , fontSize}}>{name}</h1>}
            </Welcome>
        )
    }
}

ReactDOM.render(<App /> , root)
```
上面的例子，我们可以看出通过函数作为子类组件的组件我们就能解耦父类组件和它们的子类组件，让我们决定使用哪些参数以及怎么将参数运用于子类组件中。