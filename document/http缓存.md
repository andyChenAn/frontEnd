# http缓存
作为前端开发者，当我们打开谷歌浏览器的控制台，会看到很多文件加载，并且有些文件的加载会出现"from memory cache"或"from disk cache"等，而且加载的时间为0毫秒。为什么加载资源没有花费时间呢？这就是http缓存在起作用，当我们在下载某些静态资源的时候，我们可以通过设置一些响应头信息来让浏览器缓存已经加载过的资源。

这里的http缓存测试，使用的nodejs来测试。

### Cache-Control
通过设置"Cache-Control"响应头来通知浏览器是否缓存已加载的资源。
- 1、如果设置"Cache-Control"的值为"no-cache"，则表示浏览器不缓存资源，每次获取资源都要向服务器获取。
```
// nodejs代码
const http = require('http');
const fs = require('fs');
const url = require('url');
function renderHtml (path , res) {
    const reader = fs.createReadStream(path);
    reader.pipe(res);
};

function getJs (path , res) {
    const reader = fs.createReadStream(path);
    res.writeHead(200 , {
        'Cache-Control' : 'no-cache'
    });
    reader.pipe(res);
};
const server = http.createServer(function (req , res) {
    var reqUrl = req.headers.host + req.url;
    var parseUrl = url.parse(reqUrl);
    switch (parseUrl.pathname) {
        case '/':
            renderHtml('./index.html' , res);
        break;
        case '/static/jquery.js':
            getJs('./static/jquery.js' , res);
        break;
        default:
            res.end('');
        break;
    }
});

server.listen(8000 , '127.0.0.1' , function () {
    console.log('listening port 8000');
});
```

```
//index.html代码
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>nodejs</title>
    <script src="/static/jquery.js"></script>
</head>
<body>
    <h1>welcome to nodejs</h1>
</body>
</html>
```
当我们创建好一个web本地服务器，然后输入 http://localhost:8000 时，我们打开控制台，会发现每次刷新页面，jquery.js这个文件总是会去从服务器上重新获取，浏览器不并不会缓存它。


- 2、当我们设置"Cache-Control"的值为"max-age=xxx"时，则浏览器会缓存已加载的资源，并且会缓存xxx秒，xxx秒之后，缓存失效，浏览器又会重新从服务器上获取，在此之前是不会向服务器发送请求去获取该资源。
```
// 相同的代码就不写了
function getJs (path , res) {
    const reader = fs.createReadStream(path);
    res.writeHead(200 , {
        "Cache-Control" : 'max-age='+10
    });
    reader.pipe(res);
};
```
这里我们设置了max-age=10，表示浏览器加载完资源会缓存资源10秒中，10秒之内再次请求该资源，浏览器会从缓存中获取，而不会从服务器上获取，所以在控制台中会出现"from memory cache"字样
### Expires
我们设置Expires响应头信息来让浏览器缓存资源，Expires从字面意思理解就是过期时间，我们可以设置一个时间，只要加载的资源在过期时间之内，那么浏览器就会从缓存中获取，而不会向服务器请求资源。但是一般我们都会使用"Cache-Control"来设置，Expires不太准，反正我试过确实不准。
```
// 相同的代码就不写了，直接拷最上面的代码就可以了
function getJs (path , res) {
    const reader = fs.createReadStream(path);
    res.writeHead(200 , {
        "Expires" : 'Tue, 17 Jul 2018 14:30:00 GMT'
    });
    reader.pipe(res);
};
```
当我们设置了Expires，那么在这个时间之前，浏览器加载的资源会被缓存，重新加载时会判断时间是否已经过期，如果没有过期，那么就从缓存中获取，如果过期，就从服务器请求资源。当我们给Expires设置一个过期时间，资源是不会被缓存的。
### Cache-Control和Expires的优先级
当同时设置了"Cache-Control"和"Expires"，那么谁的优先级更高呢？"Cache-Control"的优先级会更高，而"Expires"会被忽略。
```
function getJs (path , res) {
    const reader = fs.createReadStream(path);
    res.writeHead(200 , {
        "Cache-Control" : 'max-age='+10,
        "Expires" : 'Tue, 17 Jul 2017 14:30:00 GMT'
    });
    reader.pipe(res);
};
```
上面代码中，我们同时设置了"Cache-Control"和"Expires"值，一个是缓存10秒，一个是过期时间，当我们在浏览器控制台上发现，资源会被缓存10秒，10秒之后过期，重新向浏览器发起请求获取资源。

除此之外，我们也会经常看到响应头中会存在"Pragma"字段，它用来向后兼容只支持 HTTP/1.0 协议的缓存服务器，那时候 HTTP/1.1 协议中的 Cache-Control 还没有出来。 一般会看到"Pragma"被设置为"no-cache"，该字段的意思和"Cache-Control"设置为"no-cache"一样。但是它们还是有优先级的，"Pragma"的优先级高于"Cache-Control"。
```
function getJs (path , res) {
    const reader = fs.createReadStream(path);
    res.writeHead(200 , {
        "Cache-Control" : 'max-age='+10,
        "Pragma" : 'no-cache',
        "Expires" : 'Tue, 17 Jul 2017 14:30:00 GMT'
    });
    reader.pipe(res);
};
```
我们在控制台中会发现，每次加载资源，浏览器都会向服务器发请求获取。
### Last-Modified 和 If-Modified-Since
我们可以使用Last-Modified 和 If-Modified-Since来进行缓存协商，当Last-Modified 和 If-Modified-Since的值是一样的，表示资源的最后一次修改时间是一样的，那么资源是没有被修改，我们可以直接使用之前的资源，这个时候就没有必要去重新让服务器把所有资源又返回给客户端，只要把响应头信息返回就可以了

```
const http = require('http');
const fs = require('fs');
const url = require('url');

function renderHtml (path , res) {
    const reader = fs.createReadStream(path);
    reader.pipe(res);
};

function getJs (path , req , res) {
    fs.stat(path , function (err , stat) {
        if (err) {
            res.end('该文件不存在');
        } else {
            const mtime = stat.mtime.toDateString().slice(0 , 3) + ', ' + stat.mtime.getDate() + ' ' + stat.mtime.toDateString().slice(4 , 7) + ' ' + stat.mtime.getFullYear() + ' ' + stat.mtime.toLocaleTimeString() + ' GMT'
            // 如果两者相同，表示服务器上的资源没有被修改，那么就直接返回响应头信息，内容为空即可。
            if (req.headers['if-modified-since'] == mtime) {
                res.writeHead(304 , {
                    'Last-Modified' : mtime
                });
                res.end('');
            } else {
                // 如果两者不相同，那么表示服务器上的资源被修改过，那么就重新获取服务器上的资源
                const reader = fs.createReadStream(path);
                res.writeHead(200 , {
                    'Last-Modified' : mtime
                })
                reader.pipe(res);
            }
        }
    })
};
const server = http.createServer(function (req , res) {
    var reqUrl = req.headers.host + req.url;
    var parseUrl = url.parse(reqUrl);
    switch (parseUrl.pathname) {
        case '/':
            renderHtml('./index.html' , res);
        break;
        case '/static/jquery.js':
            getJs('./static/jquery.js' , req , res);
        break;
        default:
            res.end('');
        break;
    }
});

server.listen(8000 , '127.0.0.1' , function () {
    console.log('listening port 8000');
});
```
通过上面的代码，我们输入 http://localhost:8000 后，页面会加载jquery.js文件，如果我们修改该文件，那么服务器会返回200，而且size比较大，当我们再刷新浏览器时，发现返回的状态码是304，表示资源没有被修改，而且size比较小，只返回响应头信息，返回内容为空，浏览器会使用之前的资源。