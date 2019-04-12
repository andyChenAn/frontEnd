# ajax
ajax指的就是异步的javascript和XML，不过在使用ajax的过程中，我们很少会使用XML来进行数据的传递。ajax的出现，让我们可以在不刷新网页的情况下，发送http请求，与后端进行交互。

ajax的使用是比较简单的，基本上我们需要了解它是怎么发送请求的，以及它是怎么处理服务器响应的。

#### ajax怎么发送请求？
创建一个XMLHttpRequest对象，然后调用对象的open方法和send方法就可以了，我们来看一下具体怎么操作

```javascript
// 创建XMLHttpRequest对象
var xhr = new XMLHttpRequest();

// 调用对象的open方法，来创建于服务器的连接
xhr.open(“GET” , “demo.txt” , true);

// 调用对象的send方法，来发送http请求
xhr.send(null);

```
#### ajax怎么处理服务器响应？
当我们发送ajax请求后，我们可以给xhr对象的onreadystatechange属性指定一个函数，每当请求的状态发生变化时，就会执行这个函数。

```javascript
var xhr = new XMLHttpRequest();
xhr.open('get' , 'demo.txt');
// 每当请求状态方法变化的时候，就会执行fn
xhr.onreadystatechange = fn;
xhr.send(null);
```
那么ajax请求的状态有哪些呢？

状态值 | 说明
---|---
0 | 请求未被初始化
1 | 已经与服务器建立连接
2 | 服务器已经接受到请求
3 | 服务器正在处理请求
4 | 服务器已经处理完请求并准备响应

我们可以通过执行下面代码来打印出请求状态值

```javascript
var xhr = new XMLHttpRequest();
xhr.open('get' , 'demo.txt');
xhr.onreadystatechange = function () {
    console.log(xhr.readyState);
};
xhr.send(null);
```
当readyState为4，并且status为200的时候，我们就可以通过responseText获取到响应的数据了。

```javascript
var btn = document.getElementById('btn');
btn.addEventListener('click' , function () {
    var xhr = new XMLHttpRequest();
    xhr.open('get' , 'demo.txt');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log(xhr.responseText);
            } else {
                console.log('请求失败');
            }
        }
    };
    xhr.send(null);
});
```
上面的代码是get请求，如果是post请求呢？我们需要传递一些数据到后端，让后端根据我们传递的数据做相应的处理，这个时候，我们需要设置请求头信息，比如，要设置Content-Type的头信息，该头信息一般我们可以设置三种类型
- application/x-www-form-urlencoded，数据以表单提交的方式发送到后端
- application/json，表示数据是以json格式发送到后端
- multipart/form-data，表示数据是以FormData的方式发送到后端，一般用于浏览器需要向服务器发送多种数据类型的情况，比如一个请求即有字符串数据，又有文件类型的数据。

### XMLHttpRequest对象有哪些常用属性和方法？
#### 常用属性：

属性名 | 说明
---|---
onreadystatechange | 当请求状态发生变化时会调用
readyState | 请求状态码
responseText | 请求的响应内容，是一个字符串
response | 响应内容，不过具体类型有responseType的值来决定
responseType | 响应类型
status | 响应状态码
statusText | 响应状态码对应的说明
responseXML | XML文档
responseURL | 响应的URL
timeout | 请求的超时时长
upload | 请求的上传过程

#### 常用方法

方法名 | 说明
---|---
abort | 如果请求已经发送，则立即中止请求
getAllResponseHeaders | 获取所有的响应头信息
getResponseHeader | 获取指定的响应头信息
open | 初始化一个请求
send | 发送一个请求
overrideMimeType | 重写由服务器返回的MIME type
setRequestHeader | 设置请求头信息，必须在open之后，send之前调用

### 监测进度
当通过ajax请求去获取服务器上的资源时，可以通过给xhr对象添加一些监听事件来监测资源的下载进度。

事件名 | 说明
---|---
loadstart | 接收到响应数据的第一个字节时触发该事件
progress | 接收到响应数据期间，持续不断的触发该事件
error | 数据在加载期间，如果加载失败就会触发该事件，比如，突然断网
load | 响应数据全部接收到时，会触发该事件
abort | 当调用xhr.abort方法中止时触发该事件
loadend | 通信完成时会触发该事件

```javascript
// 点击按钮，去获取index.css文件内容。
var btn = document.getElementById('btn');
btn.addEventListener('click' , function () {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('loadstart' , function () {
        console.log('loadstart');
    });
    xhr.addEventListener('progress' , function () {
        console.log('progress');
    });
    xhr.addEventListener('load' , function () {
        console.log('load');
    });
    xhr.addEventListener('error' , function () {
        console.log('error');
    });
    xhr.addEventListener('abort' , function () {
        console.log('abort');
    });
    xhr.addEventListener('loadend' , function () {
        console.log('loadend');
    });
    xhr.open('get' , 'index.css');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log(xhr.response);
            }
        }
    }
    xhr.send(null);
});
```
为了能够更好的看到事件被触发过程，我们可以在浏览器上把网速改低一点，正常情况下，触发事件的过程是这样的：
- 1、触发loadstart事件，表示浏览器刚刚接收到服务器响应的数据
- 2、触发progress事件，表示浏览器正在持续不断的接收服务器响应的数据，所以这个事件会持续不断的被触发，直到响应数据被浏览器全部接收或者出现网络异常，又或者请求被中止时，才会不触发。
- 3、触发load事件，表示浏览器已经接收到全部的响应数据。
- 4、触发loadend事件，表示浏览器和服务器的通信已经完成。

如果在接收响应数据期间，突然网络异常，那么会是怎么触发事件的呢？
- 1、触发loadstart事件，表示浏览器刚刚接收到服务器响应的数据
- 2、触发progress事件，表示浏览器正在持续不断的接收服务器响应的数据，所以这个事件会持续不断的被触发，直到响应数据被浏览器全部接收或者出现网络异常，又或者请求被中止时，才会不触发。
- 3、触发error事件，表示当网络异常时（断网），浏览器无法接收到响应数据
- 4、触发loadend事件，表示浏览器和服务器的通信已经完成。

如果在接收响应数据期间，人为调用abort方法中止请求，那么事件又是怎么触发的呢？
- 1、触发loadstart事件，同上
- 2、触发progress事件，同上
- 3、触发abort事件，表示调用abort方法来中止请求
- 4、触发loadend事件，同上


```javascript
var btn = document.getElementById('btn');
btn.addEventListener('click' , function () {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('loadstart' , function () {
        console.log('loadstart');
    });
    xhr.addEventListener('progress' , function (evt) {
        if (evt.lengthComputable) {
            var percent = evt.loaded / evt.total;
            percent = percent.toFixed(2) * 100;
            console.log(percent + '%');
        }
    });
    xhr.addEventListener('load' , function (evt) {
        console.log('load');
    });
    xhr.addEventListener('error' , function () {
        console.log('error');
    });
    xhr.addEventListener('abort' , function () {
        console.log('abort');
    });
    xhr.addEventListener('loadend' , function () {
        console.log('loadend');
    });
    xhr.open('get' , 'index.css');
    xhr.send(null);
});
```
上面的代码，我们可以清楚的看到接受响应数据的进度，结果如下

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/js/1.png)

我们这里看到的是下载的进度事件，除了下载之外，还有上传的进度事件，上传的相关进度事件是在ajax对象的upload属性上触发的。

