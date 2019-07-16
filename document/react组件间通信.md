# react组件通信
react组件间的通信基本上可以分为三类：父子组件间的通信，爷孙组件间的通信，兄弟组件间的通信。
## 父子组件间的通信
react中，父子组件间的通信主要是通过props来实现。不管是父组件向子组件通信，还是子组件向父组件通信，它们都是通过props来实现。

- 1、父组件向子组件通信

```javascript
class Child extends Component {
  constructor (props) {
    super(props);
  }
  render () {
    const {name , age} = this.props;
    return (
      <div>
        <div>my name is {name}</div>
        <div>my age is {age}</div>
      </div>
    )
  }
}

class Parent extends Component {
  constructor (props) {
    super(props);
    this.state = {
      name : 'andy',
      age : 23
    }
  }
  render () {
    const {name , age} = this.state;
    return (
      <div>
        <Child name={name} age={age}></Child>
      </div>
    )
  }
}
```
上面代码中，父组件通过向子组件传递属性来实现与子组件的通信。

- 2、子组件向父组件通信

```javascript
class Child extends Component {
  constructor (props) {
    super(props);
  }
  render () {
    const { sendToParent } = this.props;
    return (
      <div>
        <button onClick={() => sendToParent('hello parent')}>向父组件发送消息</button>
      </div>
    )
  }
}

class Parent extends Component {
  constructor (props) {
    super(props);
    this.sendToParent = this.sendToParent.bind(this);
  }
  sendToParent (value) {
    console.log('子组件向父组件通信' , value);
  }
  render () {
    return (
      <div>
        <Child sendToParent={this.sendToParent}></Child>
      </div>
    )
  }
}
```
## 爷孙组件间的通信
在react中，爷孙组件指的是祖先组件与子组件之间的通信