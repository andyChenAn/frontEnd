# react-router-dom
react路由功能，主要是通过react-router-dom库来实现。在React路由中，有三种类型的组件，一种是router组件，一种是route组件，一种是navigation组件。

##### router组件
router组件，每个react应用都应该有一个router组件，对于web项目来说，react-router-dom库提供了<BrowserRouter>和<HashRouter>两种router组件。这两个组件都会创建一个history对象。一般来说，如果你有服务器需要响应页面请求，那么你就使用<BrowserRouter>组件，如果这是提供一些静态文件服务，那么就可以使用<HashRouter>组件。

```javascript
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