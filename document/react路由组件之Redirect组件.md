# react路由组件之Redirect组件
- 1、withRouter高阶组件有什么用？
  - 主要用于获取路由属性的（history，location，match），如果想要获取路由属性，只需要用withRouter来包装一下就可以了。比如：withRouter(ReactComponent)
- 2、Redirect组件
  - Redirect组件用于重定向，当我们进行某些操作时，会先让登录才能操作，如果我们操作时还没有登录，那么就会重定向到登录页面进行登录操作。

```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Switch , Link , withRouter , Redirect } from 'react-router-dom';

const Public = () => <h3>Public</h3>;

const Private = () => <h3>Private</h3>;

const auth = {
    isAuth : false,
    authorize (callback) {
        this.isAuth = true;
        setTimeout(callback , 200);
    },
    unauthroize (callback) {
        this.isAuth = false;
        callback(callback , 200);
    }
}

function PrivateRoute (props) {
    const Component = props.component;
    const path = props.path;
    return (
        <Route path={path} render={
            (props) => {
                return auth.isAuth ? <Component {...props} /> : <Redirect to={{
                    pathname : '/login',
                    state : {from : props.location}
                }} />
            }
        } />
    )
}

class Login extends Component {
    constructor (props) {
        super(props);
        this.state = {
            redirectTo : false
        }
    }
    login = () => {
        auth.authorize(() => {
            this.setState({
                redirectTo : true
            })
        })
    }
    render () {
        let redirectTo = this.state.redirectTo;
        // 获取从哪里重定向过来的路径对象
        let { from } = this.props.location.state;
        if (redirectTo) {
            return <Redirect to={from} />
        }
        return (
            <div>
                <p>你还没有授权，请授权再查看</p>
                <button onClick={this.login}>授权</button>
            </div>
        )
    }
}

const Authorize = withRouter(class Authorize extends Component {
    constructor (props) {
        super(props);
    }
    loginOut = () => {
        auth.unauthroize(() => {
            this.props.history.push('/');
        })
    }
    render () {
        return (
            <div>
                {
                    auth.isAuth ? (
                        <div>
                            <div>你已经授权，可以查看需要授权的内容！</div>
                            <button onClick={this.loginOut}>退出</button>
                        </div>
                    ) : null
                }
            </div>
        )
    }
})


class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/public">public</Link>
                    <Link to="/private">private</Link>
                    <Authorize />
                    <Route path="/public" component={Public} />
                    <Route path="/login" component={Login} />
                    <PrivateRoute path="/private" component={Private} />
                </div>
            </Router>
        )
    }
}
```
上面是一个<Redirect />组件的简单应用，当我们渲染一个<Redirect/>组件时，该组件会导航到一个新的地址。这个新的地址会在history栈中覆盖当前的地址，就像我们在服务端重定向一样。

```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Switch , Link , withRouter , Redirect } from 'react-router-dom';

const auth = {
    isLogin : false
}

const Home = () => <h2>home</h2>;
// 这里我们使用withRouter高阶函数来包装组件，不然的话，我们获取不到Router的三个属性(history , location,match)
// 当点击login按钮时，首先会将isLogin的状态变为true，然后调用history的push方法，让url跳转到'/'
// 路由地址发生改变，组件会重新渲染，并且会重定向到"/home"，然后匹配到正确的组件
// 这里需要注意的是，这里的history对象和浏览器的history对象类似。
const Login = withRouter(({history}) => {
    const login = () => {
        auth.isLogin = true;
        history.push('/');
    }
    return (
        <div>
            <button onClick={() => login()}>login</button>
        </div>
    )
});
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Route exact path="/" render={() => (
                        auth.isLogin ? (
                            <Redirect to="/home"/>
                        ) : (
                            <Login />
                        )
                        )}/>
                    <Route path="/home" component={Home} />
                </div>
            </Router>
        )
    }
}
export default App;
```
上面这个例子中，如果我们把"exact"属性去掉会怎么样呢？其实当我们点击按钮进行重定向的时候会提示警告

```
Warning: You tried to redirect to the same route you're currently on: "/home"
```
这是因为当我们路由跳转到"/home"时，会同时匹配到"/"和"/home"。所以就会出现上面的警告提示，只需要在<Route path="/" />的组件上添加"exact"属性即可。

Redirect组件有以下几个属性：

- 1、to属性
  - 这个属性可以是字符串也可以是对象，如果是字符串，那么表示的是重定向的url地址，如果是对象(location对象)，那么对象的pathname属性表示的是重定向的url地址。
- 2、from属性
  - 这个属性表示Redirect组件的路由原始值，当路由路径匹配from时，那么会重定向到to上面。如果Redirect组件上没有from属性，那么他都会匹配到当前路由的路径，这样的话，不管路由路径是哪个，都会重定向
- 3、push属性
  - 该属性是一个布尔值，如果为true，表示把新的地址添加到访问历史记录里面，并且无法回退到前面的页面
- 3、exact属性
  - 该属性是一个布尔值，如果为true，那么表示不能匹配路径的子路径，比如：当路径匹配"/home"，就不能匹配"/home/one"。如果为false，那么就可以匹配，所以我们在使用路由的时候会添加<Route exact path="/" />，不然都会匹配到"/"。
- 4、strict属性
  - 该属性是一个布尔值，如果为true，表示会匹配路径末尾的那个斜杠，比如：path为"/home/"，不能匹配"/home"，可以匹配"/home/"，当然这个只匹配末尾的那个斜杠，如果斜杠后面还有参数，是不会受影响的，比如：path为"/home/"，会匹配"/home/one"。

**这个需要注意的是，如果想要保住路径末尾一定不会有斜杠，那么exact属性和strict属性两个必须为true。**
```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Switch , Link , withRouter , Redirect } from 'react-router-dom';

const auth = {
    isLogin : false
}

const Home = (props) => {
    console.log(props);
    return (
        <h2>home</h2>
    )
};
const Login = withRouter(({history}) => {
    const login = () => {
        auth.isLogin = true;
        history.push('/');
    }
    return (
        <div>
            <button onClick={() => login()}>login</button>
        </div>
    )
});

class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Route exact path="/" render={(props) => {
                        return (
                            auth.isLogin ? (
                                <Redirect to={{
                                    pathname : '/home',
                                    name : 'andy',
                                    search : "?city=广州",
                                    state : {referrer : props.location}
                                }} />
                            ) : (
                                <Login />
                            )
                        )
                    }}/>
                    <Route path="/home" component={Home} />
                </div>
            </Router>
        )
    }
}
export default App;

```
上面的这个例子中，我们使用<Redirect>组件的to属性来重定向到指定的路径，这里的to属性是一个对象，该对象其实是一个location对象，除了包含location对象中的属性外，我们还可以自定义属性。这里重定向的路径都是符合path-to-regexp库标准的。

```javascript
location : {
    hash: "",   // #号后面的值
    key: "f1t7fc",
    name: "andy",
    pathname: "/home",
    search: "?city=广州",  // 查询字符串
    state : {
        referrer : {
            hash: "",
            key: "uevpb4",
            pathname: "/",
            search: "",
            state: undefined
        }
    }
}
```
下面这个例子是一个from属性的应用的例子，当路由路径匹配到from属性的值时，会重定向到to属性的值上

```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Switch , Link , withRouter , Redirect } from 'react-router-dom';

const About = (props) => {
    console.log(props);
    return (
        <div>about</div>
    )
}
const Home = () => <div>home</div>

// 如果<Redirect>组件将from属性删掉，那么不管是哪个路由路径，它都会匹配到，所以也都会重定向到to上
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Switch>
                        <Redirect from="/home" to="/about" />
                        <Route path="/about" component={About} />
                    </Switch>
                </div>
            </Router>
        )
    }
}

export default App;
```
