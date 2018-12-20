# react路由组件之Prompt组件
Prompt组件主要用于在用户离开页面之前提醒用户。当

Prompt组件有以下几个属性：
- when属性
  - 该属性是一个布尔值，表示的是是否需要渲染Prompt组件。
- message属性
  - 该属性可以是一个字符串或者是一个函数，如果是一个字符串，那么就是弹框提示的文字，如果是一个函数，那么必须返回一个字符串（弹框提示问题）或者返回一个true（没有弹框，会直接跳转到你导航的页面）

```javascript
class Form extends Component {
    constructor (props) {
        super(props);
        this.state = {
            isBlocking : false
        }
    }
    render () {
        const {isBlocking} = this.state;
        return (
            <form onSubmit={event => {
                event.preventDefault();
                event.target.reset();
                this.setState({
                    isBlocking : false
                })
            }}>
                <Prompt when={isBlocking} message={location => {
                    return `Are you sure you want to go to ${location.pathname}`;
                }} />
                <p>Blocking? {isBlocking ? "yes , click a link ore the back button" : 'nope'}</p>
                <div>
                    <input type="text" placeholder="type something to block transitions" onChange={(event) => {
                        let value = event.target.value;
                        this.setState({
                            isBlocking : value.length > 0
                        });
                    }} />
                </div>
                <button>Submit to stop blocking</button>
            </form>
        )
    }
}

class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <ul>
                        <li>
                            <Link to="/">Form</Link>
                        </li>
                        <li>
                            <Link to="/one">One</Link>
                        </li>
                        <li>
                            <Link to="two">Two</Link>
                        </li>
                    </ul>
                    <Route path="/" exact component={Form} />
                    <Route path="/one" render={() => <h1>one</h1>} />
                    <Route path="/two" render={() => <h1>two</h1>} />
                </div>
            </Router>
        )
    }
}
```
上面代码就是一个简单的Prompt组件使用的例子，当我们在输入框输入东西时，然后点击链接，就会渲染Prompt组件，如果点击确定，那么会跳转，如果点击取消那么就不会跳转。