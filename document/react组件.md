# react组件
组件从概念上看就像是一个函数，它可以接受任意的输入值(称之为"props")，并返回一个需要在页面上展示的React元素。（来自[React官网的定义](https://react.docschina.org/docs/components-and-props.html)）

我们都知道react.js是一个用户构建用户界面的JavaScript库。而构建用户界面的最基本单元就是react元素。一个页面可以分为很多部分，而每一个部分都是由一个一个的组件所构成，所以说，react.js的其中一个特点就是组件化开发。
### 如何创建一个react组件
##### 函数定义组件
定义一个组件最简单的方式就是使用JavaScript函数：

```
const App = (props) => {
	return <div>hello andy</div>;
}
```
##### 类定义组件

```
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

```
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