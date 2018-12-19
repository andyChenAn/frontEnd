# react路由组件之BrowserRouter组件
react路由组件使用的是HMTL5的history对象的方法来实现页面的UI渲染和地址保持同步。

### BrowserRouter组件的属性
- basename属性
  - 该属性是一个字符串，指的是为react应用指定一个根路径。
- getUserConfirmation属性
  - 该属性是一个函数，表示当导航到该页面前会执行的操作，一般当需要用户进入页面前执行什么操作时可用。
- forceRefresh属性
  - 该属性是一个布尔值，当为true的时候，强制刷新浏览器，一般用于当浏览器不支持HMTL5的historyAPI的时候，强制刷新页面。
- keyLength属性
  - 该属性是一个数字，表示location.key的长度。默认location.key是6位数。点击同一个链接时，每次该路由下的location.key都会刷新。

**BrowserRouter只能有一个子节点。**

```javascript
// 当我们设置了basename，那么链接的path匹配的就是"/home/one"
class App extends Component {
    render () {
        return (
            <Router
                basename="/home"
            >
                <div>
                    <Link to="/one">one</Link>
                    <Route path="/one" render={() => (
                        <h1>one</h1>
                    )} />
                    <Route path="/" exact render={() => (
                        <h1>index</h1>
                    )} />
                </div>
            </Router>
        )
    }
}
```
当我们设置了basename，那么链接的path匹配的就是"/home/one"

```javascript
class App extends Component {
    confirmation = () => {
        window.confirm('are you sure?');
    }
    render () {
        return (
            <Router
                basename="/home"
                // 一般用于当浏览器不支持HMTL5的historyAPI的时候，强制刷新页面
                forceRefresh={!('pushState' in window.history)}
                getUserConfirmation={this.confirmation}
            >
                <div>
                    <Link to="/one">one</Link>
                    <Route path="/one" render={() => (
                        <h1>one</h1>
                    )} />
                </div>
            </Router>
        )
    }
}
```
上面代码，我们可以通过判断window.history对象中是否存在pushState方法来判断是否支持HTML5的history API。如果不支持的话，我们就强制刷新页面。
```javascript
class App extends Component {
    confirmation = () => {
        window.confirm('are you sure?');
    }
    render () {
        return (
            <Router
                basename="/home"
                // 一般用于当浏览器不支持HMTL5的historyAPI的时候，强制刷新页面
                forceRefresh={!('pushState' in window.history)}
                getUserConfirmation={this.confirmation}
                keyLength={10}
            >
                <div>
                    <Link to="/one">one</Link>
                    <Route path="/one" render={({location}) => {
                        console.log(location.key)
                        return (
                            <h1>one</h1>
                        )
                    }} />
                </div>
            </Router>
        )
    }
}
```
上面代码，我们设置location.key的长度为10。每次点击同一个链接，每次的location.key都是不一样的。

```javascript
class App extends Component {
    confirmation = (message , callback) => {
        let flag = window.confirm(message);
        callback(flag);
    }
    render () {
        return (
            <Router
                basename="/home"
                // 一般用于当浏览器不支持HMTL5的historyAPI的时候，强制刷新页面
                forceRefresh={!('pushState' in window.history)}
                // 当导航到该页面的时候，会先调用该函数
                getUserConfirmation={this.confirmation("are you sure?" , (flag) => {
                    console.log(flag);
                })}
                keyLength={10}
            >
                <div>
                    
                </div>
            </Router>
        )
    }
}
```
上面代码，当用户进入该页面的时候，会先执行confirmation函数。主要是用在页面进入前可能用户会执行一些操作的情况。
### 总结
1、BrowserRouter组件只能有一个子节点，一般react应用的代码都会被BrowserRouter组件包裹。类似<BrowserRouter><App /></BrowserRouter>这样。

2、BrowserRouter组件有三个属性：history，location，match。可以在<Route>和<Redirect>组件中通过props获取到，history对象主要用于路由导航操作，location对象包含了当前的一些路径信息（比如：pathname（路径），search（查询字符串），key，hash等），match对象包含了路径匹配的参数信息。
