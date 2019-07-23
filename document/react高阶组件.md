# react高阶组件
高阶组件指的是：接受一个组件作为参数，返回一个新组件的函数。
```javascript
function HOC (WrappedComponent) {
    return class NewComponent extends Component {
        constructor (props) {
            super(props);
        }
        render () {
            return (
                <WrappedComponent {...this.props} />
            )
        }
    }
}
```

## 为什么要用高阶组件？
我觉得主要还是为了代码复用。比如说，有一个需求，我需要获取短评列表数据和长评列表数据并展示在页面上，其实获取数据的逻辑都是一样的，只是获取的接口不一样，正常来说，我们会短评组件上编写处理逻辑，然后再长评组件上编写长评处理逻辑，这样你会发现其实逻辑是一样的，就因为接口不一样，而同样的逻辑写了两遍是不是有点太多余了呢，这个时候我们可以使用高阶组件，来进行代码复用。

```javascript
const url1 = 'http://localhost:8000/api/shortcomment/short';
const url2 = 'http://localhost:8000/api/longcomment/long';
// 高阶组件
function HOC (WrappedComponent , url) { // 传入一个参数
    return class NewComponent extends WrappedComponent {
        constructor (props) {
            super(props);
            this.state = {
                data : []
            }
        }
        componentDidMount () {
            // 获取数据
            axios.get(`${url}`).then(res => {
                this.setState({
                    data : res.data.commentList
                })
            })
        }
        render () {
            const {data} = this.state;
            return (
                <WrappedComponent {...this.props} data={data} />
            )
        }
    }
};

// 短评组件
class ShortComponent extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        const { data } = this.props;
        return (
            <div>
                <h1>这是短评列表</h1>
                <div>
                    {
                        data.map(item => (
                            <div key={item.id}>{item.avatar}</div>
                        ))
                    }
                </div>
            </div>
        )
    }
};
// 长评组件
class LongComponent extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        const { data } = this.props;
        return (
            <div>
                <h1>这是长评列表</h1>
                <div>
                    {
                        data.map(item => (
                            <div key={item.id}>{item.avatar}</div>
                        ))
                    }
                </div>
            </div>
        )
    }
}

const ShortCommentComponent = HOC(ShortComponent , url1);
const LongCommentComponent = HOC(LongComponent , url2);

class App extends Component {
  render() {
    return (
        <div>
            <ShortCommentComponent />
            <LongCommentComponent />
        </div>
    );
  }
}
```
## 高阶组件的两种主要形式
react中高阶组件主要有两种形式：属性代理和反向继承。

### 属性代理
属性代理，其实就是一个函数接受一个包装组件作为参数，返回一个新组件，新组件的render方法中返回传入的包装组件，并将需要处理的props和新的props传入到新组件中。
```javascript
function HOC (WrappedComponent) {
    return class NewComponent extends Component {
        constructor (props) {
            super(props);
            this.state = {name : 'andy'}
        }
        render () {
            const newProps = this.state;
            return (
                <WrappedComponent {...this.props} {...newProps} />
            )
        }
    } 
}

class OriginComponent extends Component {
    render () {
        const {name} = this.props;
        return (
            <div>{name}</div>
        )
    }
}

const AComponent = HOC(OriginComponent);
```
### 反向继承
高阶函数接受一个组件作为参数，然后在函数里面返回一个新组件，并且新组件继承传入的组件。

```javascript
function HOC (WrappedComponent) {
  return class NewComponent extends WrappedComponent {
    render () {
      return super.render();
    }
  }
};

class OriginComponent extends Component {
  render () {
    return (
      <div>hello hoc</div>
    )
  }
};

const AndyComponent = HOC(OriginComponent);
```
使用反向继承方式，我们需要注意的是子组件和父组件的执行过程是怎样的？不然的话很容易搞混。

```javascript
import React, { Component } from 'react';

function HOC (WrappedComponent) {
  return class NewComponent extends WrappedComponent {
    test1 () {
      return this.test2() * 2;
    }
    componentDidMount () {
      console.log('子组件挂载');
      this.setState({
        number : 2
      })
    }
    render () {
      return super.render();
    }
  }
}

class OriginComponent extends Component {
  constructor (props) {
    super(props);
    this.state = {number : 1};
  }
  test2 () {
    return 2;
  }
  componentDidMount () {
    console.log('父组件挂载');
  }
  render () {
    return (
      <div>
        {this.state.number}{'and'}
        {this.test1()}
        这是原始组件
      </div>
    )
  }
}
const AndyComponent = HOC(OriginComponent);

class App extends Component {
  render() {
    return (
      <AndyComponent/>
    )
  }
}
export default App;
```
我们打印一下结果，发现控制台打印了"子组件挂载"。主要是因为当调用componentDidMount方法时，子组件中已经存在这个方法了，如果子组件不存在componentDidMount方法，那么就会找到父组件的componentDidMount方法执行，这里主要是要弄清楚super作为对象调用父类的方法时，方法内部的this指向的是子类实例。

到调用super.render方法时，方法里面的this指向的是子类实例，又因为子类继承父类，所以会执行test2方法，最后的结果就是4。