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

```
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
