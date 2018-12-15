# react-router-dom
react路由功能，主要是通过react-router-dom库来实现。在React路由中，有三种类型的组件，一种是router组件，一种是route组件，一种是navigation组件。

##### router组件
router组件，每个react应用都应该有一个router组件，对于web项目来说，react-router-dom库提供了<BrowserRouter>和<HashRouter>两种router组件。这两个组件都会创建一个history对象。一般来说，如果你有服务器需要响应页面请求，那么你就使用<BrowserRouter>组件，如果这是提供一些静态文件服务，那么就可以使用<HashRouter>组件。

```javascript
// 这里是使用BrowserRouter组件
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Link } from 'react-router-dom';
import './App.css';

const Home = () => <h2>Home</h2>;
const About = () => <h2>About</h2>;

const Header = () => (
    <ul>
        <li>
            <Link to="/">Home</Link>
        </li>
        <li>
            <Link to="/about">About</Link>
        </li>
    </ul>
)
// 这里需要注意的是，我们将BrowserRouter变量赋值为Router。
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Header />
                    <Route path="/" component={Home} />
                    <Route path="/about" component={About} />
                </div>
            </Router>
        )
    }
}

```
结果如下：

![结果图](https://github.com/andyChenAn/frontEnd/raw/master/images/react-router/1.png)
```javascript
// 这里是使用HashRouter组件
import React, { Component } from 'react';
import { HashRouter as Router , Route , Link } from 'react-router-dom';
import './App.css';

const Home = () => <h2>Home</h2>;
const About = () => <h2>About</h2>;

const Header = () => (
    <ul>
        <li>
            <Link to="/">Home</Link>
        </li>
        <li>
            <Link to="/about">About</Link>
        </li>
    </ul>
)
// 这里需要注意的是，我们将BrowserRouter变量赋值为Router。
class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Header />
                    <Route path="/" component={Home} />
                    <Route path="/about" component={About} />
                </div>
            </Router>
        )
    }
}

```
结果如下：

![结果图](https://github.com/andyChenAn/frontEnd/raw/master/images/react-router/2.png)

对比上面两种不同的路由方式，HashRouter组件是通过#后面那一部分的路径来展示不同的页面，而BrowserRouter组件则是我们经常使用的url来展示不同的页面，HashRouter路径改变，后端是不会响应url请求的，而BrowserRouter组件的路由地址改变，后端是会响应url请求的。

##### Route组件
有两种路由匹配组件，<Route>组件和<Switch>组件。

1、Route组件会通过比较当前url地址的路径部分与<Route>组件的path属性是否相同来匹配，当一个<Route>组件匹配，那么就会渲染这个<Route>组件的内容，如果不匹配，那么就返回null。如果一个<Route>组件没有匹配路径，那么将匹配所有任何路径。

```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Link , Switch , NavLink } from 'react-router-dom';

const Home = () => <h2>Home</h2>;
const About = () => <h2>About</h2>;
const NoMatch = () => <h2>No Match</h2>

const Header = () => (
    <ul>
        <li>
            <Link to="/">Home</Link>
        </li>
        <li>
            <Link to="/about">About</Link>
        </li>
    </ul>
)

class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Header />
                    <Route path="/" component={Home} />
                    <Route path="/about" component={About} />
                    <Route component={NoMatch} />
                </div>
            </Router>
        )
    }
}
```
上面代码中，我们可以知道，当url地址的路径与<Route>组件的path属性相匹配时，那么就会渲染对应的component属性指向的组件。当没有path属性的时候，任何时候都会匹配，渲染相应的组件。

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react-router/3.png)

大家应该留意到图片上，我只是匹配/about路径，但是home和noMatch都渲染出来了，这是为什么呢？因为所有的<Route>组件都会去匹配路径，如果匹配就渲染。所以"/"和"/about"是匹配的。

2、Switch组件，只会渲染第一个与路径相匹配的组件。其他是不会渲染的。这个对于我们多个路由同时匹配一个路径的时候就很有帮助，而且也可以再匹配不到任何路径的时候，展示404组件。

```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Link , Switch , NavLink } from 'react-router-dom';
import './App.css';

const Home = () => <h2>Home</h2>;
const About = () => <h2>About</h2>;
const NoMatch = () => <h2>No Match</h2>

const Header = () => (
    <ul>
        <li>
            <Link to="/home">Home</Link>
        </li>
        <li>
            <Link to="/about">About</Link>
        </li>
    </ul>
)

class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <Header />
                    <Switch>
                        <Route path="/about" component={About} />
                        <Route component={NoMatch} />
                    </Switch>
                </div>
            </Router>
        )
    }
}
```

如果我们想渲染组件的内容，我们可以通过三种方式，第一种是component属性指向一个react组件，第二种是render属性指向一个内联函数，第三种是使用children属性。

```javascript
<Route path="/home" component={Home} />
<Route path="/about" render={props => <h2>About</h2>} />
<Route path="/user" children={User} />
```
##### Link组件
导航组件，其实就是被最终渲染成a标签，有两种Link组件，一种是<Link>组件，一种是<NavLink>组件，NavLink组件是一种特殊的Link组件，当点击时，组件会添加一个activeClassName的样式类，我们可以设置链接被点击后的样式。

```javascript
import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Link , Switch , NavLink } from 'react-router-dom';
import './App.css';

const Header = () => (
    <ul>
        <li>
            <Link to="/home">Home</Link>
        </li>
        <li>
            <Link to="/about">About</Link>
        </li>
        <li>
            <NavLink to="/react" activeClassName="aa">React</NavLink>
        </li>
    </ul>
);

const Home = () => <h2>Home</h2>;
const About = () => <h2>About</h2>;
const NoMatch = () => <h2>No Match</h2>;
const ReactDemo = () => <h2>ReactDemo</h2>;

const App = () => {
    return (
        <Router>
            <div>
                <Header />
                <Switch>
                    <Route path="/about" component={About} />
                    <Route path="/react" component={ReactDemo} />   
                    <Route component={NoMatch} />
                </Switch>
            </div>
        </Router>
    )
}
```