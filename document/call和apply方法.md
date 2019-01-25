# call方法
call方法调用一个函数，其具有一个指定的this值和指定的参数列表。

```
fun.call(thisArg, arg1, arg2, ...)
```
thisArg参数，表示的是在fun函数运行时指定的this值。这里需要注意的是，如果是在非严格模式下，指定null或者undefined为this值时，this会自动执行全局对象（window），同时值为原始值的this会执行该原始值的包装对象。

```javascript
// 非严格模式下
var a = 1;
function foo () {
    console.log(this.a);
}
foo.call(null);
// 打印结果为：1
```

```javascript
// 严格模式下
'use strict';
var a = 1;
function foo () {
    console.log(this.a);
}
foo.call(null);
// 报错
```
如果在非严格模式下，函数调用call方法中没有传入第一个参数，那么会自动执行全局对象（window），如果在严格模式下，那么this值会是undefined。

```
// 非严格模式下
var a = 1;
function foo () {
    console.log(this.a);
}
foo.call();
```
```javascript
// 严格模式下
'use strict';
var a = 1;
function foo () {
    // 这里的this值是undefined
    console.log(this.a);
}
foo.call();
// 报错
```
### 用法
#### 使用call方法调用父构造函数
当我们需要继承父构造函数时，我们可以通过在子构造函数里调用call方法来执行父构造函数，从而实现继承父构造函数的属性。

```javascript
function Person (name , age) {
    this.name = name;
    this.age = age;
}

function Andy (name , age) {
    Person.call(this , name , age);
}

function Jack (name , age) {
    Person.call(this , name , age);
}

var andy = new Andy('andy' , 22);
var jack = new Jack('jack' , 23);
```
#### 使用call方法来绑定this值

```javascript
var name = 'jack';

function say () {
    console.log(this.name);
}

var obj = {
    name : 'andy'
}
say.call(obj);
```
要注意，如果上面代码中不传入obj这个对象，那么在非严格模式下this值会执行全局对象（window），在严格模式下this值会是undefined。
### 模拟call方法
- 1、绑定this。
- 2、可以传入参数。
- 3、当第一个参数不传入时，或者传入的是null或undefined，在非严格模式下会指向全局对象（window）。
- 4、调用call方法可以有返回值。

因为所有的函数都有call方法，那么我们可以直接在函数的原型上添加该方法，首先我们要做的是调用call方法来绑定this值，当函数调用call方法时，会执行这个函数，并给这个函数指定一个this值。

```javascript
Function.prototype.call2 = function (context) {
    context.fn = this;
    context.fn();
    // 当调用完之后，就可以删除对象上的这个属性
    delete context.fn;
};

```

```javascript
Function.prototype.call2 = function (context) {
    context.fn = this;
    context.fn();
    delete context.fn;
};
var a = 1;
var obj = {
    a : 2
}
function foo () {
    console.log(this.a);
}
foo.call2(obj);
// 打印的结果为：2
```
但是当我们不传入第一个参数的时候或者传入的是null或者undefined，在非严格模式下this值会指向window
```javascript
Function.prototype.call2 = function (context) {
    context = context || window;
    context.fn = this;
    context.fn();
    delete context.fn;
};
```
除了绑定this值，还可以传入其他参数到执行的函数里面，一开始我想到的是使用es6语法的rest参数方式，但是忽然觉得如果要模拟怎么能用es6语法呢？可以参考其他人的方式使用eval()来实现

```javascript
Function.prototype.call2 = function (context) {
    context = context || window;
    var args = [];
    // 这里我们需要获取除第一个参数之外的其他参数
    for (var i = 1; i < arguments.length ; i++) {
        args.push('arguments[' + i + ']');
    };
    
    context.fn = this;
    eval('context.fn('+ args +')');
    delete context.fn;
};
```

```javascript
Function.prototype.call2 = function (context) {
    context = context || window;
    var args = [];
    for (var i = 1; i < arguments.length ; i++) {
        args.push('arguments[' + i + ']');
    };
    
    context.fn = this;
    // args是一个数组，这里主要用到了字符串与数组相加的隐式转换，数组会调用toString()方法转为字符串，如果是使用数组的join()方法来将数组转为字符串，会报错。
    eval('context.fn('+ args +')');
    delete context.fn;
};
var a = 1;
var obj = {
    a : 2
}
function foo (name , age) {
    console.log(this.a);
    console.log(name);
    console.log(age);
}
foo.call2(obj , 'andy' , 22);
```
除了上面讲的之外，调用call方法还可以有返回值，而返回值就是执行函数的返回值

```javascript
Function.prototype.call2 = function (context) {
    context = context || window;
    var args = [];
    for (var i = 1; i < arguments.length ; i++) {
        args.push('arguments[' + i + ']');
    };
    
    context.fn = this;
    // 将结果保存并返回即可
    var res = eval('context.fn('+ args +')');
    delete context.fn;
    return res;
};
```
### apply和call方法的区别
其实apply和call方法的主要区别就是传入的参数不同，call方法传入的是一个参数列表，而apply方法传入的是一个保存参数列表的数组。
### apply方法模拟

```javascript
Function.prototype.apply2 = function (context , arr) {
    var context = context || window;
    var args = [];
    var res = '';
    context.fn = this;
    if (!arr) {
        res = context.fn();
    } else {
        for (var i = 0 ; i < arr.length ; i++) {
            args.push('arr['+i+']');
        };
        res = eval('context.fn('+ args +')');
    }
    delete context.fn;
    return res;
}

```
参考[冴羽](https://github.com/mqyqingfeng/Blog/issues/11)的文章，但是自己应该要按照前辈们的思路再去实现一遍，来巩固自己的基础知识。