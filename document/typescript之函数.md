# 函数
### 为函数定义类型
我们可以给函数的每个参数添加类型，还可以给函数本身添加返回值类型。
```javascript
function add (x : number , y : number) : number {
    return x + y;
}
```
完整的函数类型是这样写的：

```javascript
let myAdd : (x : number , y : number) => number = function (x : number , y : number) : number {
    return x + y;
}
```
函数类型包含两个部分：参数类型和返回值类型。

### 可选参数
在typescript中，传递给一个函数的参数个数必须与函数期望的参数个数一致。

```javascript
function buildName (firstName : string , lastName : string) {
    return firstName + " " + lastName;
}
// 这里会报错，因为只传入了一个参数
let res1 = buildName('Bob');
// 这里会报错，因为传入了三个参数，实际上函数只需要两个
let res2 = buildName('Bob' , 'Adams' , 'Sr.');
let res3 = buildName('Bob' , 'Adams');
```
在typescript中，我们可以在函数参数旁使用?实现可选参数的功能。比如：

```javascript
function buildName (firstName : string , lastName ?: string) {
    return firstName + " " + lastName;
}
let res1 = buildName('Bob');
let res3 = buildName('Bob' , 'Adams');
```
上面代码中，都不会报错，因为函数可以接受一个或两个参数，另外我们需要注意的是，可选参数必须在必选参数的后面。

当用户没有传递这个参数或者传递的参数是undefined时，我们可以给参数设置一个默认值。而我们管这个参数叫做有默认初始化值的参数。

```javascript
function buildName (firstName : string , lastName = 'Smith') {
    return firstName + ' ' + lastName;
}
// 返回的结果是：bob Smith
let res1 = buildName('bob');
// 返回的结果是：bob Smith
let res2 = buildName('bob' , undefined);
// 返回的结果是：bob null
let res3 = buildName('bob' , null);
```
我们这里要注意，只有没有传递这个参数或者传递的参数是undefined，才会使用默认值，就算传递的是null，也是使用null，而不会使用默认值。

在所有必选参数后面的带有默认初始化的参数都是可选的，在函数调用的时候可以省略。和可选参数不同的是，带默认值的参数不需要放在必选参数的后面，如果带默认值的参数放在必选参数的前面，那么用户必须要手动传递一个undefined来获取默认值。

```javascript
function buildName (lastName = 'andy' , firstName : string) {
    return firstName + ' ' + lastName;
}
// 不会报错，因为我们传入了一个undefined来获取默认值
let res1 = buildName(undefined , 'chen');
// 这里会报错，因为必须要两个参数，而这里只有一个
let res2 = buildName('chen');
```
上面代码中，第一次调用buildName函数不会报错，因为我们传递了一个undefined来获取参数的默认值，第二次调用buildName函数会报错，因为调用函数时需要传入两个参数，而实际上我们只传入了一个参数，所以会报错。

### 剩余参数
函数中的剩余参数，我们一般都是用省略号(...)后面接一个名字来表示，剩余参数会被看作是不限个数的可选参数。剩余参数可以一个都没有，也可以有任意个。

```javascript
function buildName (firstName : string , ...restName : string[]) {
    return firstName + ' ' + restName.join(' ');
}
let res = buildName('andy' , 'chen' , 'and' , 'jack');
console.log(res);
```
### 重载
在javascript中，我们可以根据函数传入的参数的类型或个数不同而执行不同的操作。在typescript中，我们可以为同一个函数提供多个函数类型定义来进行函数重载。

```javascript
let suits = ['hearts' , 'spades' , 'clubs' , 'diamonds'];
// 函数类型定义
function pickCard (x : {suit : string ; card : number;}[]) :number;
// 函数类型定义
function pickCard (x : number) : {suit : string ; card : number;};

function pickCard (x) :any {
    if (typeof x == 'object') {
        let pickedCard = Math.floor(Math.random() * x.length);
        return pickedCard;
    } else if (typeof x == 'number') {
        let pickedSuit = Math.floor(x / 13);
        return {suit : suits[pickedSuit] , card : x % 13};
    }
}
let myDeck = [{suit : 'diamonds' , card : 2} , {suit : 'spades' , card : 10} , {suit : 'hearts' , card : 4}];
let pickedCard1 = myDeck[pickCard(myDeck)];
console.log(`card : ${pickedCard1.card} of ${pickedCard1.suit}`);

let pickedCard2 = pickCard(15);
console.log(`card : ${pickedCard2.card} of ${pickedCard2.suit}`);
```
上面代码中，我们定义了两个函数类型定义，当函数调用的时候，会进行正确的类型检查。