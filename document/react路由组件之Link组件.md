# react路由组件之Link组件
在react应用中，react路由组件可以提供可声明的，可访问的导航组件。这个组件就是<Link>组件，<Link>组件最终会被渲染成a标签。
### Link组件有以下几个属性
- to属性
  - 该属性是一个字符串或者是一个对象，如果是一个字符串，那么表示要链接到的地址，可以通过location对象的pathname,search,hash这三个属性来创建，比如：<Link to="/about?name=andy">About</Link>。如果to属性是一个对象，那么我们可以使用四个属性来构造链接（pathname：表示要链接的路径 , search：表示路径的查询参数 , hash：表示url的hash值 , state：表示保存在location的状态，我们可以设置一些值，这些值可以在location对象的state属性中获取）
- replace属性
  - 该属性是一个布尔值，当为true时，点击链接时，会替换当前历史访问记录中的地址，而不是添加一个新的地址到历史访问记录中。
- innerRef属性
  - 该属性是一个函数，当组件加载的时候，会调用这个函数，接收一个参数，是一个底层component引用。也就是说可以访问dom。

除了上面这些属性，我们也可以添加别的属性，id，className，title等，就像给a标签添加属性一样。

```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Switch , Link , withRouter , Redirect } from 'react-router-dom';

const Home = () => <h1>home</h1>;
const About = (props) => {
    // 当导航到该页面的时候，我们可以打印看一下location对象下的属性
    console.log(props);
    return (
        <h1>about</h1>
    )
};
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/about?name=andy#abc">About</Link>
                    <Route path="/" exact component={Home} />
                    <Route path="/about" component={About} />
                </div>
            </Router>
        )
    }
}
export default App;
```
结果为：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react-router-dom/1.png)


```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Switch , Link , withRouter , Redirect } from 'react-router-dom';

const Home = () => <h1>home</h1>;
const About = (props) => {
    console.log(props);
    return (
        <h1>about</h1>
    )
};
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to={{
                        pathname : '/about',
                        search : '?name=andy&age=22',
                        hash : '#abc',
                        state : {
                            name : 'andy',
                            job : 'doctor'
                        }
                    }}>About</Link>
                    <Route path="/" exact component={Home} />
                    <Route path="/about" component={About} />
                </div>
            </Router>
        )
    }
}
export default App;
```
结果为：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react-router-dom/2.png)


```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Switch , Link , withRouter , Redirect } from 'react-router-dom';

const Home = () => <h1>home</h1>;
const About = (props) => {
    console.log(props);
    return (
        <h1>about</h1>
    )
};
const User = () => <h1>user</h1>;
const Login = () => <h1>login</h1>;

const AddressBtn = withRouter(class AddressBtn extends Component {
    constructor (props) {
        super(props);
    }
    prevPage = () => {
        let { history } = this.props;
        history.goBack();
    }
    nextPage = () => {
        let { history } = this.props;
        history.goForward();
    }
    render () {
        return (
            <div>
                <button onClick={this.prevPage}>上一页</button>
                <button onClick={this.nextPage}>下一页</button>
            </div>
        )
    }
})

// 当我们设置replace属性为true时，会替换当前历史访问记录中的地址，而不是添加一个新的地址到历史访问记录中
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <AddressBtn />
                    <Link to="/">home</Link>
                    <Link to="/about" replace>about</Link>
                    <Link to="/user">user</Link>
                    <Link to="/login">login</Link>
                    <Route path="/" exact component={Home} />
                    <Route path="/about" component={About} />
                    <Route path="/user" component={User} />
                    <Route path="/login" component={Login} />
                </div>
            </Router>
        )
    }
}
export default App;
```
当我们在Link组件中设置replace属性为true时，点击该链接，会替换当前路由地址，而不是在历史访问记录里添加新的一个地址。当我们依次点击login,user,about按钮时，然后再点击上一页按钮，我们发现链接不会跳转到user，说明这里的user地址被about地址给替换了。

```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Switch , Link , withRouter , Redirect } from 'react-router-dom';

const Home = () => <h1>home</h1>;

class About extends Component {
    constructor (props) {
        super(props);
        this.nodeRef = React.createRef();
    }
    render () {
        return (
            <h1 ref={this.nodeRef}>about</h1>
        )
    }
}
const User = () => <h1>user</h1>;
const Login = () => <h1>login</h1>;

class App extends Component {
    lookInnerRef = (node) => {
        console.log(node.innerHTML);
    }
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/about" replace>about</Link>
                    <Link to="/user" innerRef={this.lookInnerRef}>user</Link>
                    <Link to="/login">login</Link>
                    <Route path="/" exact component={Home} />
                    <Route path="/about" component={About} />
                    <Route path="/user" component={User} />
                    <Route path="/login" component={Login} />
                </div>
            </Router>
        )
    }
}
export default App;
```
上面代码中，我们创建一个引用，然后当组件在加载的时候，会调用lookInnerRef函数，然后可以访问到底层的组件引用。