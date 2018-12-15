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