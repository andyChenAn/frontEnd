# 类
从es6之后，js也能够使用基于类的面向对象的方式来创建对象。

```javascript
class Greeter {
    greeting : string;
    constructor (message : string) {
        this.greeting = message;
    }
    greet () {
        return 'hello ' + this.greeting;
    }
};
let greeter = new Greeter('world');
```

### 继承
我们可以使用继承的方式来扩展现有的类。

```javascript
class Animal {
    move (meters : number = 0) {
        console.log(`Animal moved ${meters}`);
    }
}
class Dog extends Animal {
    bark () {
        console.log('woof! woof!');
    }
};

let dog = new Dog();
dog.bark();
dog.move(10);
dog.bark();
```

```javascript
class Animal {
    name : string;
    constructor (name : string) {
        this.name = name;
    }
    move (meters : number = 0) {
        console.log(`${this.name} moved ${meters}m.`);
    }
};
class Snake extends Animal {
    constructor (name : string) {
        super(name);
    }
    move (meters : number = 5) {
        console.log('slithering...');
        super.move(meters);
    }
}
class Horse extends Animal {
    constructor (name : string) {
        super(name);
    }
    move (meters = 23) {
        console.log('Galloping...');
        super.move(meters);
    }
};
let sam = new Snake('Sammy the Python');
let tom : Animal = new Horse('Tommy the Palomino');
sam.move();
tom.move(34);
```
### 公共，私有与受保护的修饰符

#### public
在typescript中，类里面的成员默认为public，对公共是可见的。我们也可以显式的定义类的成员：

```javascript
class Animal {
    public name : string;
    public constructor (name : string) {
        this.name = name;
    }
    public move (meters : number) {
        console.log('${this.name} moved ${meters}');
    }
}
```
#### private
当类的成员被标记成private时，它就不能在声明他的类之外的地方访问，只能在类中访问。

```javascript
class Animal {
    private name : string;
    constructor (name : string) {
        this.name = name;
    }
};
let animal = new Animal('cat');
// 这里就会报错，因为name被标记为private，所以只能在类中访问，不能在类的外部访问。
animal.name = 'dog';
```
如果我们这样写，就不会报错了：

```javascript
class Animal {
    private name : string;
    constructor (name : string) {
        this.name = name;
    }
    sayName () {
        console.log(`my name is ${this.name}`);
    }
};
let animal = new Animal('cat');
animal.sayName();
```
TypeScript使用的是结构性类型系统。当我们比较两种不同的类型时，并不在乎它们从何处而来，如果所有成员的类型都是兼容的，那么我们就认为它们的类型是兼容的。

```javascript
class Animal1 {
    name : string;
}
class Animal2 {
    name : string;
}
let a = new Animal1();
let b = new Animal2();
a = b;
```
上面代码中，当我们将b赋值给a时，会对a和b的类型进行检查，我们会发现a和b的成员的类型是一样的，那么我们也认为它们的类型是兼容的，这样的话，赋值就不会报错了。

```javascript
class Animal1 {
    name : string;
}
class Animal2 {
    name : number;
}
let a = new Animal1();
let b = new Animal2();
a = b;
```
上面代码中，赋值的时候就会报错，因为a和b的类型不兼容(a中的name类型和b中的name类型不兼容)

但是，当我们比较带有private或protected成员的类型的时候，如果其中一个类型里包含一个private成员，那么只有当另外一个类型中也存在这样一个private成员，并且它们都是来自同一处声明时，我们才认为这两个类型是兼容的。对于protected成员也是如此。

```javascript
class Animal {
    private name : string;
    constructor (name : string) {
        this.name = name;
    }
}
class Rhino extends Animal {
    constructor () {
        super('Rhino');
    }
}
class Employee {
    private name : string;
    constructor (name : string) {
        this.name = name;
    }
}
let animal = new Animal('Goat');
let rhino = new Rhino();
let employee = new Employee('Bob');
animal = rhino;
// 报错
animal = employee;
```
上面代码中，Rhino继承Animal，所以Rhino里存在一个私有成员name，并且这个name也是在Animal中定义的，所以认为它们两个的类型是兼容的。虽然Employee里有一个私有成员name，但是这个name不是Animal里面定义的那个，所以认为它们两个的类型不兼容。
#### protected
protected与private修饰符的行为很相似，但是有一点不同，protected成员在派生类中仍然可以访问。比如：

```javascript
class Person {
    protected name : string;
    constructor (name : string) {
        this.name = name;
    }
}
class Employee extends Person {
    private department : string;
    constructor (name : string , department : string) {
        super(name);
        this.department = department;
    }
    public getElevatorPitch () {
        return `hello , my name is ${this.name} and I work in ${this.department}`;
    }
}
let andy = new Employee('Andy' , "Sales");
console.log(andy.getElevatorPitch());
// 这里会报错，因为name是受保护的成员，不能在类或者基于这个类的派生类的其他地方访问。
// 只能在当前类，或者当前类的派生类中访问
console.log(andy.name);
```
构造函数也可以被标记成protected，这意味着这个类不能在包含它的类外被实例化，但是能被继承。

```javascript
class Person {
    protected name : string;
    protected constructor (name : string) {
        this.name = name;
    }
}
class Employee extends Person {
    private department : string;
    constructor (name : string , department : string) {
        super(name);
        this.department = department;
    }
    public getElevatorPitch () {
        return `hello , my name is ${this.name} and I work in ${this.department}`;
    }
};
let andy = new Employee('andy' , 'sales');
// 会报错
let jack = new Person('jack');
```
上面代码中，创建Employee时，不会报错，因为是通过super(name)来调用Person类中的受保护构造函数，并且Employee类继承Person类，是Person类中的一个派生类。所以是可以执行的。创建Person时，会报错，是因为Person类中的构造函数受保护的，所以不能直接在外部访问。

#### readonly
使用readonly将属性设置为只读的。只读属性必须在声明时或构造函数里被初始化。

```javascript
class Octopus {
    readonly name : string;
    readonly numberOfLegs : number = 8;
    constructor (name : string) {
        this.name = name;
    }
}
let dad = new Octopus('Man with the 8 strong legs');
// 这里会报错，因为name被设置为只读
// 只能在一开始的时候或者在构造函数内被初始化
dad.name = 'Man with the 3-piece suit';
```
上面代码中，给name赋值会报错，因为name属性被设置为只读属性，只能在声明时或构造函数里被初始化。


```javascript
class Person {
    readonly name : string;
    constructor (theName : string) {
        this.name = theName;
    }
}
let andy = new Person('andy');
console.log(andy.name);
```
上面代码中，Person类中有一个构造函数，这个函数有一个参数，然后函数里会将传入的参数值赋值给name属性。

但是我们可以使用"参数属性"，定义并初始化一个成员，上面的例子，我们可以改写成这样：

```javascript
class Person {
    constructor (readonly name : string) {
        this.name = name;
    }
};
let andy = new Person('andy');
console.log(andy.name)
```
参数属性通过给构造函数参数前面添加一个访问限定符来声明。private，public，protected都一样。

### 存取器

