# Vuex
Vuex是一个专门为Vuejs应用程序开发的状态管理模式。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。
## State
Vuex使用单一状态树，用一个对象就包含了全部的应用状态层级，它就是一个唯一的数据源，这就意味着每个应用仅仅只能包含一个store实例。我们来看一下是如何定义state的。
```javascript
const store = new Vuex.Store({
    state : {
        count : 1,
        name : 'andy',
        age : 12
    }
});
```
上面的代码中，我们就已经定义了一个state了，那么我们在组件中怎么获取到这个state呢？我们可以在组件的计算属性上返回我们需要的状态，比如：

```javascript
export default {
    data () {
        return {
            name : 'andy'
        }
    },
    computed : {
        count () {
            return this.$store.state.count;
        },
        name () {
            return this.$store.state.name;
        },
        age () {
            return this.$store.state.age;
        }
    }
}
```
通过上面的方式，我们可以在计算属性上返回我们当前组件需要使用的状态。但是这样的方式，让代码看起来会有点冗余和重复，这时候我们可以使用mapState函数来帮助我们生成计算属性。

```javascript
const store = new Vuex.Store({
    state : {
        count : 1,
        name : 'andy',
        age : 12
    }
});
```

```javascript
import { mapState } from 'vuex';
export default {
    data () {
        return {
            a : 1
        }
    },
    computed : mapState(['count' , 'name' , 'age'])
}
```
上面的代码中，我们可以看到，如果组件的计算属性的名称与状态名称一样的话，我们可以在调用mapState函数时传入一个数组，数组的元素就是组件的计算属性的名称，而计算属性的值就是这些名称对应的state的值。

如果计算属性的名称与state的名称不一样呢？那么我们可以是这样的：

```javascript
export default {
    data () {
        return {
            a : 1
        }
    },
    computed : mapState({
        num : state => state.count,
        who : "name"  // 类似于：who : state => state.name
    })
}
```
上面代码中，调用mapState函数，传入的是一个对象，对象的key就是计算属性的名称，key对应的value可以是一个函数或者字符串，如果是函数的话，那么函数接受一个state作为参数，返回对应的状态值。

如何将state和组件内的局部计算属性混合在一起使用呢？mapState函数返回的是一个对象，我们可以使用对象的扩展运算符，比如：

```javascript
export default {
    data () {
        return {
            a : 1
        }
    },
    computed : {
        address () {
            return '广州';
        },
        ...mapState({
            num : state => state.count,
            who : 'name'
        })
    }
}
```
## Getter
有时候我们需要从store中的state中派生出一些状态，比如对列表进行过滤等。Vuex允许我们在store中定义"getters"，这个我们可以理解为store的计算属性，就像计算属性一样，getter的返回值会根据它的依赖被缓存起来，只有当它的依赖值发生改变才会重新计算。getter接受state作为第一个参数。

```javascript
export default {
    data () {
        return {
            a : 1
        }
    },
    computed : {
        completedTodos () {
            return this.$store.getters.completedTodos;
        }
    }
}
```

```javascript
const store = new Vuex.Store({
    state : {
        todos : [
            {id : 1 , text : 'andy' , completed : true},
            {id : 2 , text : 'alex' , completed : false},
            {id : 3 , text : 'peter' , completed : true},
        ]
    },
    getters : {
        completedTodos (state) {
            return state.todos.filter(todo => {
                return todo.completed;
            })
        }
    }
});
```
上面代码中，我们可以在组件中通过$store.getters属性来访问我们需要的值。

我们也可以通过方法来访问，我们可以让getter返回一个函数，来实现给getter传入参数。比如：

```javascript
const store = new Vuex.Store({
    state : {
        todos : [
            {id : 1 , text : 'andy' , completed : true},
            {id : 2 , text : 'alex' , completed : false},
            {id : 3 , text : 'peter' , completed : true},
        ]
    },
    getters : {
        completedTodos (state) {
            return state.todos.filter(todo => {
                return todo.completed;
            })
        },
        getTodoById (state) {
            return (id) => {
                return state.todos.find(todo => todo.id == id);
            }
        }
    }
});
```

```javascript
export default {
    data () {
        return {
            a : 1
        }
    },
    computed : {
        completedTodos () {
            return this.$store.getters.completedTodos;
        },
        currentTodoText () {
            return this.$store.getters.getTodoById(2).text;
        }
    }
}
```
这里我们需要注意的是，getter在通过方法访问时，每次都会进行调用，而不会缓存结果。

除此之外，我们还可以使用mapGetters函数将store中的getter映射到局部计算属性上。

```javascript
export default {
    data () {
        return {
            a : 1
        }
    },
    computed : {
        ...mapGetters(['completedTodos'])
    }
}

export default {
    data () {
        return {
            a : 1
        }
    },
    computed : mapGetters({
        todos : 'completedTodos'  // 我们也可以使用不同的计算属性名
    })
}
```
## Mutation
更改Vuex的store中的状态的唯一方法就是提交mutation。Vuex中的mutation非常类似于事件，每个mutation有一个字符串的事件类型(type)和一个回调函数(handle)。回调函数就是我们实际进行状态更改的地方，并且它会接受state作为第一个参数。

```javascript
const store = new Vuex.Store({
    state : {
        todos : [
            {id : 1 , text : 'andy' , completed : true},
            {id : 2 , text : 'alex' , completed : false},
            {id : 3 , text : 'peter' , completed : true},
        ]
    },
    mutations : {
        addTodo (state , payload) {
            state.todos.push(payload);
        }
    }
});
```
```javascript
import { mapState } from 'vuex';
export default {
    data () {
        return {
            a : 1
        }
    },
    computed : mapState(['todos']),
    methods : {
        addTodo () {
            this.$store.commit('addTodo' , {
                id : new Date().getTime(),
                text : Math.random().toFixed(2)
            })
        }
    }
}
```
这里我们需要注意的是，mutation必须是一个同步函数，如果mutation中有异步操作（比如：请求数据），那么当mutation触发的时候，异步数据都还没有返回。在Vuex中，mutation都是同步事务。
## Action
action和mutation类似，不同在于，action提交的是mutation，而不是直接更改状态，action可以包含异步操作。

action函数接受一个与store实例具有相同方法行业属性的context对象，因此我们可以调用commit方法来提交一个mutation，或者通过context来获取state，getters等。

```javascript
const store = new Vuex.Store({
    state : {
        count : 1
    },
    mutations : {
        increment (state) {
            state.count++;
        }
    },
    actions : {
        increment (context) {
            context.commit('increment');
        }
    }
});
```
```javascript
import { mapState } from 'vuex';
export default {
    data () {
        return {
            a : 1
        }
    },
    methods : {
        increment () {
            this.$store.dispatch('increment');
        }
    },
    computed : mapState(['count'])
}
```
上面的代码感觉使用action有点多余，我直接commit一个mutation就可以，但是我们知道mutation必须是同步事务，而action是没有这个限制的，它里面可以包含异步事务。

```javascript
const store = new Vuex.Store({
    state : {
        count : 1
    },
    mutations : {
        increment (state) {
            state.count++;
        }
    },
    actions : {
        increment (context) {
            context.commit('increment');
        },
        asyncIncrement (context) {
            setTimeout(() => {
                context.commit('increment');
            } , 2000)
        }
    }
});
```

```javascript
import { mapState } from 'vuex';

export default {
    data () {
        return {
            a : 1
        }
    },
    methods : {
        increment () {
            this.$store.dispatch('increment');
        },
        asyncIncrement () {
            this.$store.dispatch('asyncIncrement');
        }
    },
    computed : mapState(['count'])
}
```
我们可以把异步封装成一个promise，那么我们可以在执行结束之后继续执行下面的逻辑：

```javascript
asyncIncrementBy (context) {
    return new Promise((resolve , reject) => {
        setTimeout(() => {
            context.commit('increment');
            resolve();
        } , 2000)
    })
}

methods : {
    ...mapActions(['increment']),
    asyncIncrementBy () {
        this.$store.dispatch('asyncIncrementBy').then(res => {
            console.log(res)
            console.log(2324)
        })
    }
}
```
或者我们也可以使用async/await来进行异步流程控制。
## Module
由于使用单一状态树，应用的所有状态会集中到一个比较大的对象，这样会显得store对象非常的臃肿。Vuex允许我们将store分割成模块，每个模块都有自己的state，mutation，action，getter。