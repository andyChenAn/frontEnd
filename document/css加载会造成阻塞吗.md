# css加载会造成阻塞吗？
我们可以先来看一下css的加载对DOM的解析和渲染有没有影响，举个例子来测试一下：首先我们要把谷歌浏览器的的下载速率调低，然后通过link标签引入一个css文件，文件尽量大一些，这样更容易看到效果。

// html代码
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <style>
        #box {
            color: red;
        }
    </style>
    <script>
        function foo () {
            console.log(document.getElementById('box'));
        }
        setTimeout(foo , 0);
    </script>
    <link rel="stylesheet" href="./index.css">
</head>
<body>
    <div id="box">hello andy</div>
<script>
</script>
</body>
</html>
```
测试结果是：当我们访问这个页面的时候，一开始页面是空白的，等到css文件加载完成之后，才会显示“hello andy”，但是我们在控制台可以看到，就算页面是空白的情况，js也能获取到box节点。


**结论就是：所以这就说明了，css文件的加载会不会阻塞DOM树的解析，但是会阻塞DOM树的渲染。**

css加载会不会阻塞js代码的执行呢？我们可以做一个小实验：

html代码
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <style>
        #box {
            color: red !important;
        }
    </style>
    <script>
        console.log('加载css文件前执行');
        let start = Date.now();
    </script>
    <link rel="stylesheet" href="./index.css">
</head>
<body>
    <div id="box">hello amdy</div>
    <script>
        let end = Date.now();
        console.log('加载css文件后执行');
        let diff = end - start;
        console.log(`已经过了${diff}ms`);
    </script>
</body>
</html>
```
上面代码中，我们可以在link标签前面写一段js代码，然后再link标签后面写一代js代码，当访问页面的时候，我们发现浏览器的控制台会先打印出“加载css文件前执行”，然后等到css文件加载之后，会打印出“加载css文件后执行”，而且我们也可以得出，经过了3秒多之后才执行js代码，这也就是说，css加载也会阻塞js代码执行。

**结论就是：css加载会阻塞js代码执行**

## 结论
- css加载不会阻塞DOM树的解析
- css加载会阻塞DOM树的渲染
- css加载会阻塞css文件后面的js代码的执行

如果我们知道了css加载会影响这些，那么如果我们想提高页面渲染的速度，或者说是减少页面白屏的时间，那么我们就要尽可能的提高css的加载速度。比如可以使用下面的方法：
- 1、使用CDN
- 2、压缩css文件
- 3、使用http缓存
- 4、减少http请求数，可以将多个css文件，合并成一个。

## 为什么会出现这样的情况呢？
webkit渲染过程：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/26.png)

从上面的图片中可以看出，webkit的渲染过程是这样的：
- 解析html，构建DOM树
- 解析css，构建CSSOM树
- 将DOM树和CSSOM树合并成渲染树
- 技术可见节点的几何信息
- 绘制

我们可以发现，其实构建DOM树和构建CSSOM树是并行的过程，这也就解释了为什么CSS加载不会阻塞DOM树的解析。而渲染树是依赖DOM树和CSSOM树的，只有DOM树和CSSOM树都构建完成之后，才能合成渲染树，所以它必须等待CSSOM树构建完成，也就是等到CSS文件加载完成之后，才能开始渲染。所以CSS加载会阻塞DOM的渲染。

[参考这里](https://github.com/chenjigeng/blog/blob/master/css%E5%8A%A0%E8%BD%BD%E4%BC%9A%E9%80%A0%E6%88%90%E9%98%BB%E5%A1%9E%E5%90%97%EF%BC%9F.md)，虽然写的很详细，但是自己还是想亲自操作一遍，这样也能加深理解。