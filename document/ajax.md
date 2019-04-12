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

### XMLHttpRequest对象有哪些属性和方法？