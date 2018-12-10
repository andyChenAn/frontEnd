# React服务端渲染
React用于编写spa应用非常的流行，但是这对于SEO很不友好，因为爬虫抓取不到页面的数据，页面的数据都是在页面加载完成之后通过请求获取并渲染到页面上的。所以爬虫抓到的只是一个空页面。那么如果对SEO优化有要求，我们可以使用React服务端渲染技术来实现。

[React服务端渲染小demo](https://github.com/andyChenAn/frontEnd/tree/master/example/react-server-render)

这里我们需要使用nodejs，webpack，babel来实现：

- nodejs（nodejs作为中间层，主要作用是渲染html）
- webpack（打包工具，v4.27.1版本）
- babel（编译js和jsx）

ReactDOMServer类可以让你在服务端渲染你的组件，当我们传入一个React元素到这个类的renderToString()方法中，这样就会把React元素渲染为原始的html。然后我们就可以把html返回给浏览器。

```javascript
import React , { Component } from 'react';
import ReactDOMServer from 'react-dom/server';
import express from 'express';
const app = express();
class App extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        return (
            <div>
                <h1>hello andy</h1>
            </div>
        )
    }
};

const html = ReactDOMServer.renderToStaticMarkup(<App />);

app.get('/' , (req , res) => {
    res.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Document</title>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `);
    res.end();
})

app.listen(3000 , () => {
    console.log('listening port 3000');
});
```

要想让babel能够识别并编译jsx语法，我们需要在babel的配置文件中（.babelrc）添加：

```javascript
{
    "presets" : [
        "@babel/preset-env",
        "@babel/preset-react"
    ]
}
```