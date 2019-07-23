# react动画
对于前端动画，估计是个前端应该都实现过，一般来说，css动画和js动画，我们使用的会比较多一点。css动画又可以分为transition动画和animation动画，而js动画，我们一般都使用定时器或者requestAnimationFrame方法来实现。其实实现react动画差不多也是用这些东西来实现。
## 通过css来实现react动画
##### transition动画
```javascript
class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            left : 0
        }
    }
    add = () => {
        this.setState({
            left : this.state.left + 30
        })
    }
    reduce = () => {
        this.setState({
            left : (this.state.left - 30) <= 0 ? 0 : (this.state.left - 30)
        })
    }
    render () {
        const { left } = this.state;
        return (
            <div>
                <button onClick={this.add}>add left</button>
                <button onClick={this.reduce}>reduce</button>
                <div className="box" style={{left : `${left}px`}}></div>
            </div>
        )
    }
}

// css部分
.box {
    position: absolute;
    left: 0;
    top: 100px;
    width: 100px;
    height: 100px;
    background-color: #007aff;
    transition: left 0.3s ease;
}
```
## 通过定时器或者requestAnimationFrame来实现动画
```javascript
class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            left : 0
        }
    }
    add = () => {
        let left = this.state.left;
        let destination = left + 20;
        let speed = (destination - left) / 300;
        let start = null;
        let animate = (timestamp) => {
            if (!start) {
                start = timestamp;
            }
            let duration = timestamp - start;
            let progress = Math.min(parseInt(speed * duration + left , 10) , destination);
            this.setState({
                left : progress
            })
            if (progress < destination) {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
    }
    reduce = () => {
        let left = this.state.left;
        let destination = left - 20;
        let speed = (left - destination) / 300;
        let start = null;
        const animate = (timestamp) => {
            if (!start) {
                start = timestamp;
            }
            let duration = timestamp - start;
            let progress = Math.max(parseInt(left - speed * duration) , destination);
            this.setState({
                left : progress
            });
            if (progress > destination) {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
    }
    render () {
        const {left} = this.state;
        return (
            <div>
                <button onClick={this.add}>add</button>
                <button onClick={this.reduce}>reduce</button>
                <div className="box" style={{left : `${left}px`}}></div>
            </div>
        )
    }
}
```
## 使用react-transition-group库来实现动画
##### 1、使用CSSTransition来实现动画
```javascript
class Alert extends Component {
    closeAlert = () => {
        const { close } = this.props;
        close();
    }
    render () {
        return (
            <div className="alert-box">
                <div className="alert-title">Animated alert message</div>
                <div className="alert-content">this alert message is being transitioned in and out of the DOM</div>
                <div className="alert-btn-box">
                    <button className="alert-btn" onClick={this.closeAlert}>Close</button>
                </div>
            </div>
        )
    }
}

class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            star : false
        }
    }
    handleClick = () => {
        this.setState({
            star : !this.state.star
        })
    }
    close = () => {
        this.setState({
            star : false
        })
    }
    render() {
        return (
            <div>
                <button onClick={this.handleClick}>click</button>
                <CSSTransition
                    in={this.state.star}
                    timeout={300}
                    classNames="star"
                    unmountOnExit
                >
                    <Alert close={() => this.close()} />
                </CSSTransition>
            </div>
        );
    }
}
```
css部分代码
```css
.star-enter {
    opacity: 0;
    transform: scale(1.1);
}
.star-enter-active {
    opacity: 1;
    transform: scale(1);
    transition: all 300ms ease-out;
}
.star-exit {
    opacity: 1;
    transform: scale(1);
}
.star-exit-active {
    opacity: 0;
    transform: scale(1.1);
    transition: all 300ms ease-in;
}
.alert-box {
    position: absolute;
    top:40%;
    left:40%;
    background-color: #fff;
    border-radius: 4px;
    border: 1px solid #e4e4e4;
}
.alert-title {
    padding: 20px 15px 10px;
}
.alert-content {
    padding: 10px 15px;
}
.alert-btn-box {
    padding: 10px 15px 20px;
}
```
##### 2、使用TransitionGroup来实现动画

```javascript
class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            items : [
                {id : 1 , text : 'andy'},
                {id : 2 , text : 'jack'},
                {id : 3 , text : 'peter'},
            ]
        }
    }
    addItem = () => {
        const text = prompt('enter your name');
        console.log(this.state.items)
        if (text) {
            this.setState({
                items : this.state.items.concat({
                    id : new Date().getTime(),
                    text
                })
            })
        }
    }
    delete = (evt) => {
        const id = evt.target.dataset.id;
        this.setState({
            items : this.state.items.filter(item => {
                return item.id != id
            })
        })
    }
    render () {
        const {items} = this.state;
        return (
            <div>
                <TransitionGroup>
                    {
                        items.map(({id , text}) => (
                            <CSSTransition
                                key={id}
                                timeout={300}
                                classNames="item"
                            >
                                <div>
                                    <button data-id={id} onClick={this.delete}>X</button>
                                    {text}
                                </div>
                            </CSSTransition>
                        ))
                    }
                </TransitionGroup>
                <button onClick={this.addItem}>add item</button>
            </div>
        )
    }
}
```
css部分代码
```css
.item-enter {
    opacity: 0;
}
.item-enter-active {
    opacity: 1;
    transition: all 0.3s ease;
}
.item-exit {
    opacity: 1;
}
.item-exit-active {
    opacity: 0;
    transition: all 0.3s ease;
}
```
