# new运算符
new运算符，会创建一个用户定义的对象类型的实例或具有构造函数的内置对象的时候。

```javascript
function Foo () {
    
}
new Foo();
```
当执行new Foo()时，内部到底做了什么事情？
- 1、创建一个新对象，并且新对象继承自Foo.prototype
- 2、使用指定的参数调用Foo构造函数，并将this绑定到新创建的对象
- 返回这个新对象，如果构造函数有显式的返回一个对象，那么这个对象会覆盖之前创建的对象，如果显式的返回一个基本类型，那么会忽略返回值，还是返回新对象
### 模拟实现new来创建对象
首先我们创建一个创建对象的工厂函数，接收的第一个参数是一个函数（构造函数），其他参数就是调用函数时传入的参数。
```javascript
function createObjectFactory (Cont) {
    
}
```
从第一点可以看出，内部会创建一个新对象，并且该对象继承自函数的原型对象

```javascript
function createObjectFactory (Cont) {
    var obj = new Object();
    var args = Array.prototype.slice.call(arguments , 1);
    obj.__proto__  = Cont.prototype;
}
```
调用构造函数，并绑定this到新创建的对象。

```javascript
function createObjectFactory (Cont) {
    var obj = new Object();
    var args = Array.prototype.slice.call(arguments , 1);
    obj.__proto__  = Cont.prototype;
    var res = Cont.apply(obj , args);
}
```
如果构造函数没有返回值，那么就返回这个新对象，如果有返回值并且这个返回值是一个对象，那么就返回这个对象，如果是基本类型，那么就忽略，还是返回这个新对象

```javascript
function createObjectFactory (Cont) {
    var obj = new Object();
    var args = Array.prototype.slice.call(arguments , 1);
    obj.__proto__ = Cont.prototype;
    var res = Cont.apply(obj , args);
    return typeof res === 'object' ? res : obj;
}
```
