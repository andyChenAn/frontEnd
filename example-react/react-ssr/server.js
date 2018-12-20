import express from 'express';
import path from 'path';
const app = express();

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import Layout from './components/Layout';

app.use(express.static('dist'));

app.get('/' , (req , res) => {
    const context = {};
    const html = ReactDOMServer.renderToString(
        <StaticRouter location={req.url} context={context}>
            <Layout />
        </StaticRouter>
    );
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
            <div id="app">${html}</div>
            <script src="build.js"></script>
        </body>
        </html>
    `);
    res.end();
});

app.listen(3000 , () => {
    console.log('listening port 3000');
});
