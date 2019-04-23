# Redux之减少样板代码
我们在写react应用的时候，基本上都会使用到redux用来管理react应用的状态。那么在管理状态的过程中，我们会编写大量的action creator函数。但是action creator函数的模板样式其实都比较类似，那么有什么方法可以通过编写一个函数，来生成我们想要的action creator，这样我们就不需要单独写很多哥action creator函数了。

### action creator生成器
其实我们可以编写一个函数，专门用来生成action creator。首先我们都知道，action creator函数都会返回一个对象，这个对象有一个type属性，然后还有其他属性。那么我们可以这样一步一步的来实现（假设这个函数名叫做actionCreatorFnMaker）：

- 首先，函数actionCreatorFnMaker会返回一个函数，返回的这个函数就是aciton creator
- 其次，返回的这个函数会返回一个对象，这个对象有一个type字段和其他字段（比如需要更新的数据），所以我们要在创建action creator函数的时候把需要的action字段确定好

```
function actionCreatorFnMaker (type , ...args1) {
    return function (...args2) {
        let result = {type};
        args1.forEach((arg , index) => {
            result[args1[index]] = args2[index];
        });
        return result;
    }
};
```
我们来测试一下：

```
const ADD_TODO = 'ADD_TODO';
const DELETE_TODO = 'DELETE_TODO';
const addTodo = actionCreatorFnMaker(ADD_TODO , 'name');
const deleteTodo = actionCreatorFnMaker(DELETE_TODO , 'index');
console.log(addTodo('andy'))
console.log(deleteTodo(0));
```
结果为：

![image](https://github.com/andyChenAn/frontEnd/raw/master/images/react/34.png)

### 异步aciton creator生成器
