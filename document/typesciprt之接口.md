# 什么是接口？
在面向对象中，接口是对行为的抽象，而具体如何执行行为需要由类去实现。所以我们一般都会写成某个类实现了某个接口。

而在typescript中，接口除了可以用于对类的一部分行为进行抽象之外，也经常用于对[对象的形状]进行描述。

```javascript
interface Person {
    name : string;
    age : number;
    job : string;
};
let andy : Person = {
    name : 'andy',
    age : 20,
    job : 'teacher'
}
```
上面代码中，接口代表了有name，age，job三个属性，并且name属性的类型为string，age属性的类型为number，job属性的类型为string的对象。我们这里的接口不像java中的接口那样说是一个类实现了一个接口，在typescript中，我们只会去关注值的外形，只要对象满足上面提到的必要条件，那么它就是被允许的。还需要注意的是，类型检查器不会去检查属性的顺序，只要相应的属性存在并且类型也是对的就可以了。

### 可选属性
接口里的属性并不全部都是必需的。如果我们需要定义一个可选属性，那么我们可以在属性名字后面加上一个?符号。

```javascript
interface SquareConfig {
    color ?: string;
    width ?: number;
}
function createSquare (config : SquareConfig) : {color : string ; area : number} {
    let newSquare = {color : 'white' , area : 100};
    if (config.color) {
        newSquare.color = config.color;
    };
    if (config.width) {
        newSquare.area = config.width * config.width;
    }
    return newSquare;
}
let mySquare = createSquare({color : 'black'});
console.log(mySquare);
```
### 只读属性
有些对象属性只能在对象创建的时候修改它的值，这个时候我们可以在属性名前面用readonly来指定只读属性。

```javascript
interface Point {
    readonly x : number;
    readonly y : number;
}
let point : Point = {
    x : 10,
    y : 2
};
```
上面例子中，当我们在创建point对象的时候，也对x、y属性进行了赋值。如果我们在创建对象之后，想要修改对象的x，y的属性值时，那么会提示该属性只读，不能修改。

#### readonly vs const
最简单判断该用readonly还是const的方法是看，要把它作为变量使用还是作为对象的一个属性。如果是作为变量使用，那么就用const，如果是作为对象的一个属性，那么就用readonly。

### 额外的属性检查

```javascript
interface SquareConfig {
    color ?: string;
    width ?: number;
}
function createSquare (config : SquareConfig) : {color : string ; area : number} {
    let newSquare = {color : 'white' , area : 100};
    if (config.color) {
        newSquare.color = config.color;
    };
    if (config.width) {
        newSquare.area = config.width * config.width;
    }
    return newSquare;
}
let mySquare = createSquare({color1 : 'black'})
```
在调用createSquare方法传入的对象中，存在任何"目标类型"不包含的属性color1，"目标类型"只能有color和width属性，所以并不存在color1，这个时候就会报错。这是因为在将对象字面量赋值给一个变量或者作为参数传递的时候，对象字面量会被特殊对待，而且会经过额外的属性检查。

怎么绕开这些检查呢？我们可以使用类型断言：

```javascript
let mySquare = createSquare({color1 : 'black'} as SquareConfig);

// {color1 : 'black'}会被假设成实现了SquareConfig，使得编译通过
```

除了上面的方式，我们也可以在定义的接口中添加一个字符串索引签名，比如：

```javascript
interface SquareConfig {
    color?: string;
    width?: number;
    [propName: string]: any;
}
```
### 函数类型
接口除了描述带有属性的普通对象外，还可以描述函数类型。为了使用接口表示函数类型，我们需要给接口定义一个调用签名。它就像是一个只有参数列表和返回值类型的函数定义。参数列表里的每个参数都需要名字和类型。

```javascript
interface SearchFn {
	(source : string , substring : string) : boolean;
}
let mySearch : SearchFn;
mySearch = function (source : string , aa : string) {
	let result = source.search(aa);
	return result > -1;
};
```
上面代码中，我们定义了一个函数类型的接口，函数类型有两个参数，第一个参数的类型是字符串，第二个参数的类型也是字符串，并且函数返回一个布尔值。

### 可索引的类型
我们可以使用接口来描述那些能够"通过索引得到"的类型，比如数组中的某个元素，或对象中的某个属性。可索引类型具有一个索引签名，它描述了对象索引的类型，还有相应的索引返回值类型。

```javascript
interface StringArray {
    [index: number]: string;
}
let myArray: StringArray;
myArray = ['andy' , 'jack'];
let myStr: string = myArray[0];
```
typescript支持两种索引签名：字符串和数字。如果同时使用两种类型的索引，那么数字索引的返回值必须是字符串索引返回值类型的子类型。这是因为当使用number来索引时，javascript会将它转换成string然后再去索引对象。也就是说用100(一个number)去索引等同于使用"100"(一个string)去索引，因此两者需要保持一致。

```javascript
class Animal {
    name : string;
}
class Dog extends Animal {
    bread : string;
}
interface NotOkay {
    [x : number] : Animal;
    [x : string] : Dog;
}
```
上面的代码中，定义了两个类，一个是Animal，一个是Dog，Dog类又继承Animal类，我们又定义了一个接口，用来描述可索引类型，该接口存在两个索引签名，一个是数字，一个是字符串，数字索引会得到一个Animal类型的对象，字符串索引会得到一个Dog类型的对象，然后，当使用number来索引时，会将number转为string然后再去索引对象，所以两个索引出来的对象类型不一致，这样就会导致报错，其实最后都是字符串索引。

字符串索引签名能够很好的描述dictionary模式，并且它们也会确保所有属性与其返回值类型相匹配。

```javascript
interface NumberDictionary {
    // 索引签名是字符串索引签名
    // 返回值是一个number类型
    [index : string] : number;
    length : number;
    name : number;
}
let a : NumberDictionary = {
    name : 1,
    age : 2,
    length : 3
};
console.log(a);
```
我们还可以将索引签名设置为只读，这样就可以防止给索引赋值。

```javascript
interface ReadonlyStringArray {
    readonly [index : number] : string;
}
let arr : ReadonlyStringArray = ['andy' , 'jack'];
arr[1] = 'peter';  // 错误
```
上面代码中，我们不能给arr[1]赋值，因为索引签名是只读的。

### 类类型
typescript也可以用来明确的强制一个类去符合某种契约。

```javascript
interface ClockInterface {
    currentTime : Date;
}
class Clock implements ClockInterface {
    currentTime : Date;
    constructor (h : number , m : number) {}
};
let clock = new Clock(1,2);
console.log(clock);
```
我们也可以在接口中描述一个方法，在类里去实现它，比如:

```javascript
interface ClockInterface {
    currentTime : Date;
    setTime(d : Date);
};
class Clock implements ClockInterface {
    currentTime : Date;
    setTime (d : Date) {
        this.currentTime = d;
    }
    constructor (h : number , m : number) {

    }
};
let clock = new Clock(1,2);
clock.setTime(new Date());
console.log(clock.currentTime);
```
接口描述了类的公共部分，而不是公共和私有两部分。它不会帮你检查类是否具有某些私有成员。

#### 类静态部分和实例部分的区别
当我们操作类和接口的时候，我们要知道类是具有两个类型的：静态部分的类型和实例的类型。当一个类实现了一个接口时，只会对其实例部分进行类型检查，不会对静态部分的类型进行检查。

```javascript
interface ClockConstructor {
    new (hour : number , minute : number);
}
class Clock implements ClockConstructor {
    currentTIme : Date;
    constructor (hour : number , minute : number) {}
}
```
上面代码中，我们定义了一个接口，接口中存在一个构造器签名，然后这个会得到一个错误，因为当一个类实现了一个接口时，只会对类的实例部分进行类型检查，constructor存在于类的静态部分，所以不在检查范围内。

那么我们可以直接操作类的静态部分。比如：

```javascript
interface ClockConstructor {
    new (hour : number , minute : number) : ClockInterface;
}
interface ClockInterface {
    tick();
}
function createClock (ctor : ClockConstructor , hour : number , minute : number) : ClockInterface {
    return new ctor(hour , minute);
};
class DigitalClock implements ClockInterface {
    constructor (h : number , m : number) {}
    tick () {
        console.log('beep beep');
    }
};
class AnalogClock implements ClockInterface {
    constructor (h : number , m : number) {}
    tick () {
        console.log('tick tock');
    }
}

let digital = createClock(DigitalClock , 12 , 17);
let analog = createClock(AnalogClock , 4 , 23);
```
上面代码中，因为createClock的第一个参数是ClockConstructor类型，在createClock(AnalogClock , 7 , 32)里，会检查AnalogClock是否符合构造函数签名。

### 继承接口
接口相互继承，这让我们可以从一个接口里复制成员到另一个接口，可以更灵活的将接口分割到可重用的模块里。

```javascript
interface Shape {
    color : string;
}
interface Square extends Shape {
    sideLength : number;
}
// 这里用的是类型断言
// 也可以这样使用：let s = {} as Square;
let s = <Square>{};
s.color = 'blue';
s.sideLength = 10;
console.log(s);
```
一个接口可以继承多个接口，创建出多个接口的合成接口。

```javascript
interface Shape {
    color : string;
}
interface PenStroke {
    penWidth : number;
}
interface Square extends Shape , PenStroke {
    sideLength : number;
}
let s = {} as Square;
s.color = 'blue';
s.sideLength = 10;
s.penWidth = 5.2;
```

### 混合类型
有时候你会希望一个对象可以同时具有上面提到的多种类型。比如：

```javascript
interface Counter {
    (start : number) : string;
    interval : number;
    reset() : void;
}
function getCounter() : Counter {
    let counter = <Counter>function (start : number) {};
    counter.interval = 123;
    counter.reset = function () {};
    return counter;
};
let c = getCounter();
c(12);
c.reset();
c.interval = 3;
```
上面代码中，counter既是一个函数，也是一个对象。

### 接口继承类
当接口继承了一个类类型时，它会继承类的成员但不包括其实现。接口同样会继承到类的private和protected成员，这意味着当你创建了一个接口继承了一个拥有私有或受保护的成员的类时，这个接口类型只能被这个类或者其子类所实现。

```javascript
class Control {
    private state : any;
}
interface SelectableControl extends Control {
    select() : void;
}
class Button extends Control implements SelectableControl {
    select() {};
}
// 这里会报错，因为Images类型缺少state属性
class Images implements SelectableControl {
    select () {};
}
```
在上面的例子里，SelectableControl包含了Control的所有成员，包括私有成员state。 因为 state是私有成员，所以只能够是Control的子类们才能实现SelectableControl接口。 因为只有 Control的子类才能够拥有一个声明于Control的私有成员state，这对私有成员的兼容性是必需的。