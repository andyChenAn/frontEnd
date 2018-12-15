# React组件代码拆分
当一个人在访问我们的web应用时，我们不需要让我们的用户在使用web应用时加载整个应用代码。我们可以认为代码分割就像是逐步加载应用程序，我们只加载我们需要的应用程序，不需要的可以不加载。要想完成这个功能，我们可以使用webpack，@babel/plugin-syntax-dynamic-import和react-loadable。我们这里主要讲一下react-loadable是怎么做到的？

### react-loadable
Loadable是一个高阶组件，是一个小型库，它使得以组件为中心的代码在React中非常容易分割。

react-loadable可以在组件渲染到你的应用前动态的加载任何组件。

### 使用方式

```
Loadable({
    // 需要加载的组件
    loader : () => import('./myComponent'),   
    // loading组件
    loading : myLoadingComponent,  
    // 组件加载的时间大于delay的时候，则显示loading组件
    delay : 1000      
})
```
一般我们只需要前面两个选项就可以了。

##### 代码分割
通过使用import()来进行组件代码分割。

demo：

```javascript
// App.js
import React, { Component } from 'react';
import Loadable from 'react-loadable';
import Loading from './Loading';
const Container = Loadable({
    loader : () => import('./Hello'),
    loading : Loading
});


class App extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            <Container />
        )
    }
}
```

```javascript
// Hello.js
import React , { Component } from 'react';
class Hello extends Component {
    render () {
        return (
            <div>hello world</div>
        )
    }
};
export default Hello;
```

```javascript
// Loading.js
import React , { Component } from 'react';
class Loading extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        return <div>加载中...</div>;
    }
}
export default Loading;
```
上面的代码就是一个简单的react-loadable的应用。通过import()方法来动态的加载Hello组件，并且会自动的将Hello组件的代码拆分出来。

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react-loadable/1.png)

当我们刷新页面的时候，发现"加载中..."组件是一闪而过，主要是因为页面没有任何其他东西，所以加载会很快，那么这个时候，我们可以通过配置来解决，当组件加载时间超过200毫秒，那么就显示loading组件，如果小于200毫秒，那么就不显示loading组件。我们这里只需要改一下Loading组件就可以了。

```javascript
// Loading.js
import React , { Component } from 'react';
class Loading extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        const { error , pastDelay } = this.props;
        if (error) {
            return <div>Error</div>;
        } else if (pastDelay) {
            return <div>加载中...</div>;
        } else {
            return null;
        }
    }
}
export default Loading;
```

##### 自定义渲染
react-loadable会渲染默认的组件，如果你想自定义组件，那么可以使用render选项，render选项是一个函数，接收两个参数，第一个参数是要加载的组件，第二个参数是传递给这个要加载的组件的props，该函数返回一个组件。比如：

```javascript

// 这里是我定义的一个新的组件
class MyComponent extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            <div style={{color : this.props.color}}>my name is andy</div>
        )
    }
}

// 这里是调用loadable返回要加载的组件
const Container = Loadable({
    loader : () => import('./Hello'),
    loading : Loading,
    // 这里使用render来自定义用户需要加载的组件，而不是加载Hello组件
    // loaded是一个对象，该对象有一个default属性，该属性表示的就是要加载的组件(Hello组件)
    // props属性，就是该组件接收到的父组件传递下来的props
    render (loaded , props) {
        return <MyComponent {...props} />
    }
});


class App extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            <Container color="red" />
        )
    }
}
```
##### 加载多个资源
当我们需要加载多个资源的时候，我们可以使用Loadable.Map来实现，其实和Loadable差不多，只是loader选项是一个对象，而不是一个函数。

```javascript
const Container = Loadable.Map({
    loader : {
        Hello : () => import('./Hello'),
        weather : () => axios.get('https://free-api.heweather.com/s6/weather/now?location=广州&key=cb0ad81a470b48e2a21028ddb429d237').then(res => res.data.HeWeather6[0])
    },
    loading : Loading,
    render (loaded , props) {
        // loaded参数存放的就是已经加载的资源
        let Hello = loaded.Hello.default;
        let weather = loaded.weather;
        return <Hello {...props} weather={weather} />
    }
})
```
##### 预加载
我们可以在展示组件之前，预先加载组件资源，比如：

```javascript
const Container = Loadable({
    loader : () => import('./Hello'),
    loading : Loading
});

class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            show : false
        };
    }
    showContainer () {
        this.setState({
            show : true
        });
    }
    onMouseOver () {
        Container.preload();
    }
    render () {
        return (
            <div>
                <button onClick={() => this.showContainer()} onMouseOver={() => this.onMouseOver()}>show Container</button>
                {this.state.show ? <Container /> : null}
            </div>
        )
    }
};

```
当我们把鼠标放在按钮上是，就开始预先加载组件，等到点击按钮时，就把组件展示出来。

