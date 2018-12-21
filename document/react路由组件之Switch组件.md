# react路由组件之Switch组件
<Switch>组件表示的是只会渲染path与路由地址匹配的第一个子元素，并不会渲染所有相匹配的子元素。

```javascript
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/about">about</Link>
                    <Link to="/user">user</Link>
                    <Route path="/" component={Home} />
                    <Route path="/about" component={About} />
                    <Route path="/user" component={User} />
                </div>
            </Router>
        )
    }
}
```
上面代码中，当我们导航到/about和/user页面时，始终会渲染"/"页面的组件。如果我们只想渲染路径相匹配的组件，那么就得给<Route path="/" />组件添加一个exact属性，这样表示路径要完全匹配才能渲染，效果看上去是达到了，但是其他的路由组件还是会去匹配，如果没有，那么就没有渲染组件，如果有匹配到，那么也会渲染出来。

```javascript
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/">about</Link>
                    <Link to="/user">user</Link>
                    <Route path="/" exact component={Home} />
                    <Route path="/about" component={About} />
                    <Route path="/user" component={User} />
                </div>
            </Router>
        )
    }
}
```
其实我们只需要匹配到就可以了，不用再往下面进行匹配了。这个时候我们就要使用<Switch>组件将所有的<Route>或者<Redirect>组件包裹起来，那么再匹配的时候，只要匹配到，就不会再往下匹配了。

```javascript
const Home = () => <h1>home</h1>;
const About = () => <h1>about</h1>;
const User = () => <h1>user</h1>;
const NotMatch = () => <h1>Not Found the page!</h1>

class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/about">about</Link>
                    <Link to="/user">user</Link>
                    <Switch>
                        <Route path="/" exact component={Home} />
                        <Route path="/about" component={About} />
                        <Route path="/user" component={User} />
                        <Route component={NotMatch} />
                    </Switch>
                </div>
            </Router>
        )
    }
}

```
### Switch组件有以下几个属性
- location属性
  - 该属性是一个对象，主要用于代替当前url地址去匹配子元素的path属性。

```javascript
const Home = () => <h1>home</h1>;
const About = () => <h1>about</h1>;
const User = () => <h1>user</h1>;
const NotMatch = () => <h1>Not Found the page!</h1>
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/about">about</Link>
                    <Link to="/user">user</Link>
                    <Switch location={{
                        pathname : '/about'
                    }}>
                        <Route path="/" exact component={Home} />
                        <Route path="/about" component={About} />
                        <Route path="/user" component={User} />
                        <Route component={NotMatch} />
                    </Switch>
                </div>
            </Router>
        )
    }
}
```
上面代码中，不管里点击哪个链接，始终匹配的是"/about"路径，渲染About组件。因为Switch组件的location属性会匹配子元素的路径而不是url地址。

Switch组件的子元素只能是Route组件或者Redirect组件。并且只有第一个与url地址相匹配的子元素被渲染。Route组件是拿该组件的path属性与当前url地址去匹配，而Redirect组件是拿该组件的from属性与当前url地址去匹配，如果Route组件没有path属性或者Redirect组件没有from属性，那么会匹配任何路径，渲染该组件。
```javascript
const Home = () => <h1>home</h1>;
const About = () => <h1>about</h1>;
const User = () => <h1>user</h1>;
const NotMatch = () => <h1>Not Found the page!</h1>

class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/about">about</Link>
                    <Link to="/user">user</Link>
                    <Switch>
                        <Route path="/" exact component={Home} />
                        <Route path="/about" component={About} />
                        <Redirect from="/user" to="/about" />
                        <Route component={NotMatch} />
                    </Switch>
                </div>
            </Router>
        )
    }
}
```
如果Switch组件有一个location属性，那么这个属性会覆盖与它相匹配的子元素的location属性。

```javascript
const Home = () => <h1>home</h1>;
const About = (props) => {
    console.log(props.location);
    return (
        <h1>about</h1>
    )
};
const User = () => <h1>user</h1>;
const NotMatch = () => <h1>Not Found the page!</h1>

class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Link to="/">home</Link>
                    <Link to="/about">about</Link>
                    <Link to="/user">user</Link>
                    <Switch location={{
                        pathname : '/about'
                    }}>
                        <Route path="/" exact component={Home} />
                        <Route path="/about" component={About} />
                        <Redirect from="/user" to="/about" />
                        <Route component={NotMatch} />
                    </Switch>
                </div>
            </Router>
        )
    }
}
```
当我们打印location属性时，结果为：
```
pathname: "/about"
```
子元素的location属性被覆盖掉了。
