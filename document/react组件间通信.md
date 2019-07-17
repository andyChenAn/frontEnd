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
在react中，爷孙组件指的是祖先组件与子组件之间的通信。

- 1、context进行通信

```javascript
import React, { Component } from 'react';

const ThemeContext = React.createContext({
  backgroundColor : 'red',
  color : 'blue'
});

class Parent extends Component {
  render () {
    return (
      <ThemeContext.Provider value={{backgroundColor : 'green' , color : 'red'}}>
        <Middle />
      </ThemeContext.Provider>
    )
  }
};

class Middle extends Component {
  render () {
    return (
      <Child />
    )
  }
};

class Child extends Component {
  render () {
    return (
      <ThemeContext.Consumer>
        {context => (
          <div>
            <h1 style={{'background-color' : context.backgroundColor}}>my name is andy</h1>
            <div style={{color : context.color}}>my age is 12</div>
          </div>
        )}
      </ThemeContext.Consumer>
    )
  }
}
class App extends Component {
  render() {
    return (
      <Parent />
    )
  }
}

export default App;

```
- 2、通过eventBus来实现组件间通信

```javascript
import React, { Component } from 'react';

class EventEmitter {
  constructor () {
    this.events = {}
  }
  subscribe (name , callback) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(callback);
  }
  publish (name , ...args) {
    let callbacks = this.events[name];
    for (let i = 0 ; i < callbacks.length ; i++) {
      callbacks[i].apply(this , args);
    }
  }
};

const event = new EventEmitter();

class Parent extends Component {
  constructor (props) {
    super(props);
  }
  componentDidMount () {
    event.subscribe('hello' , this.handleHello);
  }
  handleHello = (msg) => {
    console.log(msg);
  }
  sayChild = () => {
    event.publish('sayChild' , 'hello , my child');
  }
  render () {
    return (
      <div>
        <button onClick={this.sayChild}>父元素的按钮</button>
        <Middle></Middle>
      </div>
    )
  }
}

class Middle extends Component {
  render () {
    return (
      <Child></Child>
    )
  }
}

class Child extends Component {
  hello = () => {
    event.publish('hello' , 'hello , my parent');
  }
  sayChild = (msg) => {
    console.log(msg);
  }
  componentDidMount () {
    event.subscribe('sayChild' , this.sayChild);
  }
  render () {
    return (
      <div>
        <button onClick={this.hello}>子元素的按钮</button>
      </div>
    )
  }
}

class App extends Component {
  render() {
    return (
      <Parent />
    )
  }
}
export default App;
```
