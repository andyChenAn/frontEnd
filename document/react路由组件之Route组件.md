# react路由组件之Route组件
Route组件可能是React路由中最重要的一个组件了，<Route>组件最基本的职责就是当地址匹配<Route>组件的path属性时，渲染相应的组件。

<Route>组件有三个属性可以渲染组件，component , render , children。不同的情况下，可以使用不同的方式，但是只能在<Route>组件中使用其中的一种方式来渲染，并且大部分情况下，我们都是使用component。

<Route>组件的三个渲染方式，都会传递同样的路由属性（history , location , match）。
### Route组件有以下几个属性
- component属性
  - 该属性是一个React组件，指的是当路由地址与<Route>组件的path相匹配时，会渲染的组件。同时会接收路由属性。
- render属性
  - 该属性是一个函数，适用于内联渲染。当与路径向匹配的时候，就会调用该函数，渲染组件。
- children属性
  - 该属性是一个函数，和render差不多，不过可以用来动态的展示组件差別之处在于，children会在路径不匹配的时候也调用回调从而渲染函数，而render只会在路径匹配的时候触发回调。
- path属性
  - 该属性可以是一个字符串，也可以是一个数组，表示url地址与path相匹配的时候，就会渲染组件。如果一个<Ruote>组件没有path属性，那么该<Route>组件将匹配任何地址。
- exact属性
  - 该属性是一个布尔值，表示跳转地址与Route组件的path属性完全匹配时才渲染组件。比如：当exact为true时，"/one"是不能和"/one/two"匹配的，如果是false的话，就可以。
- strict属性
  - 该属性是一个布尔值，表示不会匹配路径的最后一个斜杠，比如：'/one'和'/one/'是不匹配的。
- sensitive属性
  - 该属性是一个布尔值，表示匹配路径和path不区分大小写，比如："/one"和"/One"是相匹配的。
```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Switch , Link , withRouter , Redirect } from 'react-router-dom';

const Home = (props) => {
    return (
        <h1>Home</h1>
    )
};
const About = (props) => {
    return (
        <h1>About</h1>
    )
};
const User = (props) => {
    return (
        <h1>User</h1>
    )
};
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/about">about</Link>
                    <Link to="/user">user</Link>
                    <Route path="/" exact component={Home} />
                    <Route path="/about" component={() => {
                        return (
                            <div>about</div>
                        )
                    }} />
                    <Route path="/user" component={User} />
                </div>
            </Router>
        )
    }
}
export default App;
```

```javascript
// 当一个Route组件没有path属性时，那么表示跳转到任何路由都会渲染该组件。
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/about">about</Link>
                    <Link to="/user">user</Link>
                    <Route component={User} />
                </div>
            </Router>
        )
    }
}
```
上面代码中，当点击三个链接，都会渲染User组件。

```javascript
// path属性是数组的时候
const Home = () => <h1>home</h1>;
const About = () => <h1>about</h1>;
const User = () => <h1>user</h1>;

class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/about">about</Link>
                    <Link to="/user/one">user</Link>
                    <Link to="/profile/one">profile</Link>
                    <Switch>
                        <Route path="/" exact component={Home} />
                        <Route path="/about" component={About} />
                        <Route path={['/user/:id' , '/profile/:id']} component={User} />
                    </Switch>
                </div>
            </Router>
        )
    }
}
```
上面代码中，点击user和profile链接其实都是会渲染User组件。