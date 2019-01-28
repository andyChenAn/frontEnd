# bind方法
bind方法，创建一个新函数，在调用这个函数时设置函数的this值，并将给定的参数列表作为原函数的参数列表的前若干项。该方法返回一个新函数。（mdn）

```
function.bind(thisArg[, arg1[, arg2[, ...]]])
```
当我们想要重新绑定一个函数的this值时，就可以使用bind来实现。传入的第一个参数就是在函数调用的时候需要绑定的this值，而其他参数就是在函数执行的时候作为原函数的参数放在函数列表前面，如果返回的新函数有传入的参数，那么会放在参数列表的后面。

```javascript
var foo = {
    value : 1
}
function bar (name , age) {
    console.log(name);
    console.log(age);
    console.log(this.value)
};

var bindFoo = bar.bind(foo , 'andy');
bindFoo(12);
```
### bind方法主要特点
- 1、返回一个新函数
- 2、绑定函数的this值
- 3、可以传入参数
- 4、当绑定函数作为构造函数调用时，指定的this值会失效，但是传入的参数会继续作为调用函数的参数，并且返回的对象的会继承构造函数的属性。
### 模拟实现bind方法
首先我们需要做的就是当调用函数的bind方法时，它会返回一个新函数，并且绑定this值。

```javascript
Function.prototype.bind1 = function (context) {
    var self = this;
    // 返回一个新函数，并且通过apply方法来绑定函数的this值
    return function () {
        return self.apply(context);
    }
}
```
除此之外还可以传入参数，我们可以使用argumnets来实现

```javascript
Function.prototype.bind2 = function (context) {
    var self = this;
    var args = Array.prototype.slice.call(arguments , 1);
    return function () {
        var bindArgs = Array.prototype.slice.call(arguments);
        return self.apply(context , args.concat(bindArgs));
    }
};
```
第四点的话，首先我们需要判断函数是正常调用还是通过new来调用，可以通过instanceof或者new.target来判断

```javascript
Function.prototype.bind2 = function (context) {
    var self = this;
    var args = Array.prototype.slice.call(arguments , 1);
    var BindFn = function () {
        var bindArgs = Array.prototype.slice.call(arguments);
        return self.apply(this instanceof BindFn ? this : context , args.concat(bindArgs));
    };
    return BindFn;
};
```
当通过new来调用绑定的函数时，返回的对象会继承绑定函数的属性

```javascript
Function.prototype.bind2 = function (context) {
    if (typeof this !== 'function') {
        throw new Error("一定要是函数");
    }
    var self = this;
    var args = Array.prototype.slice.call(arguments , 1);
    // 创建一个空构造函数
    var Noop = function () {};
    var BindFn = function () {
        var bindArgs = Array.prototype.slice.call(arguments);
        return self.apply(this instanceof BindFn ? this : context , args.concat(bindArgs));
    };
    // 让空构造函数的原型指向原函数的原型，这样当new Noop()时，创建的对象会继承原函数的属性。
    // 原型继承来让BindFN的原型指向Noop对象，原型继承是这样的：BindFn对象——>Noop对象——>原函数prototype
    Noop.prototype = self.prototype;
    BindFn.prototype = new Noop();
    return BindFn;
};
```