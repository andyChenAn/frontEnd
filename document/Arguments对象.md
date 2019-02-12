# Arguments对象
在函数体中有一个隐式参数：arguments，arguments表示的是一个对应于传递给函数的参数的类数组对象。
```javascript
{
    0 : 'andy',
    1 : 'jack',
    length : 2
}
```
arguments并不是一个真正的数组，只是一个类数组对象，它只有length属性和索引元素，没有数组其他的方法，比如：push，pop等。我们可以通过索引下标来读写arguments对象中的属性值。

arguments中保存的是函数实参，而不是函数形参：
```javascript
function foo (a , b , c) {
    console.log(arguments);
    console.log(arguments.length);  // 2
}
foo(1,2);
// 打印的结果是2，而并不是3
```
### Arguments对象的属性
- length属性：
  - 表示的是接受函数实参的个数
- callee属性：
  - 表示的是当前正在执行的函数
```javascript
function add () {
    var sum = 0;
    var len = arguments.length;
    for (var i = 0 ; i < len ; i++) {
        sum += arguments[i];
    };
    return sum;
}

console.log(add(1 , 2 , 3 , 4));
console.log(add(1 , 2 , 3));
```

```
function foo (x) {
    if (x < 2) {
        return x;
    }
    return x * arguments.callee(x - 1);
}
console.log(foo(5));
```

### arguments与对应的参数绑定
在非严格模式下，arguments对象中的元素会与实参的值共享，只要其中一方的值发生改变，另一方也会跟着一起改变，如果在严格模式下，则不会共享。
```javascript
function foo (a , b , c) {
    console.log(arguments[0] , a);
    console.log(arguments[1] , b);
    a = 3;
    console.log(arguments[0] , a);
    arguments[0] = 4;
    console.log(arguments[0] , a);
    console.log(arguments[2] , c);
    c = 5;
    console.log(arguments[2] , c);
}
foo(1,2);
```
结果为：
```
1 1
2 2
3 3
4 4
undefined undefined
undefined 5
```

```javascript
'use strict';
function foo (a , b , c) {
    console.log(arguments[0] , a);
    console.log(arguments[1] , b);
    a = 3;
    console.log(arguments[0] , a);
    arguments[0] = 4;
    console.log(arguments[0] , a);
    console.log(arguments[2] , c);
    c = 5;
    console.log(arguments[2] , c);
}
foo(1,2);
```
结果为：
```
1 1
2 2
1 3
4 3
undefined undefined
undefined 5
```
### 传递参数
将arguments从一个函数传递到另一个函数，我们可以使用函数的apply方法
```javascript
function foo () {
    bar.apply(this , arguments);
}

function bar (a , b , c) {
    console.log(a , b , c);
}

foo(1,2,3);
```
### Arguments对象转数组
- 通过数组的slice方法来实现，Array.prototype.slice.call(arguemnts)或者[].slice.call(arguments)
- 使用Array.from方法，该方法可以传入一个类数组对象。Array.from(arguments)
- 使用扩展运算符
- 定义一个数组，遍历arguments对象，然后将每一个元素重新保存到数组中，并返回

```javascript
function foo () {
    var args1 = Array.prototype.slice.call(arguments);
    console.log(args1);
    var args2 = [].slice.call(arguments);
    console.log(args2);
    var args3 = Array.from(arguments);
    console.log(args3);
    var args4 = Array.prototype.concat.apply([] , arguments);
    console.log(args4)
}
foo(1,2,3);
```

```javascript
// 使用扩展运算符
function bar (...arguments) {
    console.log(arguments);
}

bar(2,3,4);
```
```javascript
// 定义一个数组，遍历arguments对象，然后将每一个元素重新保存到数组中，并返回
function foo () {
    var len = arguments.length;
    var arr = [];
    for (var i = 0 ; i < len ; i++) {
        arr[i] = arguments[i];
    }
    return arr;
}
```
### 判断类数组对象

```javascript
// 字符串和函数具有length属性，我们可以通过typeof来判断obj是否为object类型
// 基本上就是判断obj是否具有length属性，以及length的值是否为一个正整数
function isArrayLike (obj) {
    if (obj && typeof obj === 'object' && isFinite(obj.length) && obj.length >= 0 && obj.length === Math.floor(obj.length) && obj.length < 2^32) {
        return true;
    } else {
        return false;
    }
};
```
### 应用
1、函数柯里化
```javascript
function currying (fn) {
    var args = Array.prototype.slice.call(arguments , 1);
    return function () {
        return fn.apply(this , args.concat(Array.prototype.slice.call(arguments)));
    }
}
function add (a, b) {
    return a + b;
}
var bar = currying(add , 1);
console.log(bar(2))
```
2、递归调用

```javascript
function fibonacci (n) {
    if (n == 1 || n == 2) {
        return 1;
    }
    return arguments.callee(n - 1) + arguments.callee(n - 2);
}
console.log(fibonacci(5));


function fn (x) {
    if (x == 1) {
        return 1;
    }
    return x * arguments.callee(x - 1)
};

console.log(fn(4));
```
3、函数重载（具有相同的函数名，不同的参数列表的函数）
```javascript
// 可以通过参数数量的不同，执行不同的操作
function fn () {
    switch (arguments.length) {
        case 0 :
        // 执行相关操作
        break;
        case 1 :
        // 执行相关操作
        break;
        case 2 : 
        // 执行相关操作
        break;
    }
}
```
4、不定长参数
### 剩余参数，默认参数和解构赋值参数
arguments可以和剩余参数，默认参数和解构赋值参数结合一起使用。

在严格模式下，剩余参数，默认参数和解构赋值参数的存在不会影响arguments的行为，但是在非严格模式下，就会有所不同。

在非严格模式下，函数没有包含剩余参数，默认参数和解构赋值参数，那么arguments中的值会跟踪参数的值，比如：

```javascript
// 当我们不管是修改函数参数的值还是修改arguments对象的值，都会跟着一起改变
function fn1 (a) {
    a = 2;
    console.log(arguments[0])   // 2
}
fn1(1);

function fn2 (a) {
    arguments[0] = 2;
    console.log(a);      // 2
}
fn2(1);
```
在非严格模式下，函数有包含剩余参数，默认参数和解构赋值参数，那么arguments中的值不会跟踪参数的值，比如：

```javascript
// 函数包含默认参数，当我们需修改参数的值时，arguments中的值不会跟着改变
function fn1 (a = 1) {
    a = 2;
    console.log(arguments[0])    // 3
}
fn1(3);

// 或者
function fn2 (a = 1) {
    arguments[0] = 2;
    console.log(a);    // 3
}
fn2(3);

// 或者
function fn3 (a = 1) {
    console.log(arguments[0])   // undefined
}
fn3();
```
