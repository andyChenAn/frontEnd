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
typescript支持通过getters/setters来截取对对象成员的访问。
```javascript
class Employee {
    fullName : string;
}
let employee = new Employee();
employee.fullName = 'Bob Smith';
if (employee.fullName) {
    console.log(employee.fullName);
}
```
上面代码中，我们没有使用存取器来访问fullName。下面我们修改一下代码，通过存取器的方式来访问对象成员。

```javascript
let passcode = 'secret passcode';
class Employee {
    private _fullName : string;
    get fullName () : string {
        return this._fullName;
    }
    set fullName (newName : string) {
        if (passcode && passcode == 'secret passcode') {
            this._fullName = newName;
        } else {
            console.log('Error : Unauthorized update of employee!');
        }
    }
};
let employee = new Employee();
employee.fullName = 'Bob Smith';
if (employee.fullName) {
    console.log(employee.fullName);
};
```
这里我们需要注意，存取器要求我们将编辑器设置为es5或更高，不支持降级到ECMAScript3。如果只带有get不带有set的存取器自动被推断为readonly。

```javascript
let passcode = 'secret passcode';
class Employee {
    private _fullName : string;
    get fullName () : string {
        return this._fullName;
    }
};
let employee = new Employee();
// 这里会报错
employee.fullName = 'andy';
```
上面代码中，当我们给fullName赋值时，会报错，因为当只有get而没有set的存取器会被推断为readonly，所以fullName属性是只读的，不能被赋值。

### 静态属性
静态属性，存在于类本身上面而不是类的实例上面。

```javascript
class Person {
    static firstName = 'andy';
    constructor (public age : number) {}
    say () {
        console.log(`my name is ${Person.firstName} , my age is ${this.age}`);
    }
};
console.log(Person.firstName);
let person = new Person(12);
person.say();
```
我们通过"Person.firstName"来访问，通过类名.属性名。

### 抽象类
抽象类作为其他派生类的基类使用，它们一般不会直接被实例化，不同于接口，抽象类可以包含成员的实现细节，abstract关键字是用于定义抽象类和在抽象类内部定义抽象方法。

```javascript
abstract class Animal {
    abstract makeSound () : void;
    move () : void {
        console.log('roaming the earch...');
    }
}
```
抽象类中的抽象方法不包含具体实现并且必须在派生类中实现。

```javascript
abstract class Department {
    constructor (public name : string) {}
    printName () {
        console.log('department name :' + this.name);
    }
    abstract printMeeting() : void;
}
class AccountingDepartment extends Department {
    constructor () {
        super('Accounting and Auditing');
    }
    printMeeting () :void {
        console.log('The Accounting Department meets each Monday at 10am.');
    }
    generateReports () : void {
        console.log('Generating accounting reports...');
    }
}
let department : Department;
department = new AccountingDepartment();
department.printName();
department.printMeeting();
// 这里会报错
department.generateReports();
```
上面代码中，当调用generateReports方法时会报错，因为department的类型是Department类型，Department类中没有generateReports方法。如果想要不报错，我们可以用类型断言，断定他是AccountingDepartment类型。比如:
```javascript
(department as AccountingDepartment).generateReports();
```
