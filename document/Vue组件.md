# Vue组件
在Vuejs中，组件是可复用的Vue实例，所以Vue组件接收与new Vue相同的选项。
## 全局组件和局部组件
在Vue中，组件可以分为全局组件和局部组件，全局组件可以通过Vue.component方法来定义，而局部组件可以通过在new Vue中通过components选项来配置。
```javascript
// 全局组件，可以在任意的vue应用中使用
Vue.component('my-demo' , {
  template : '<div>hello andy</div>'
});
```

```javascript
// 局部组件，只能在id为app的根元素中使用，其他vue应用是不能使用的。
new Vue({
    el : '#app',
    components : {
        'my-demo' : {
            template : '<div>hello world</div>'
        }
    }
})
```
对于Vue组件来说，接收的data属性必须是一个函数，不能像new Vue中的data那样是一个对象，因为每个组件都是可复用的，如果一个组件在多个地方被使用，那么每个组件可以维护一份被返回对象的独立的拷贝，不然每个组件都共用一个data。

## 通过Prop向子组件传递数据
在Vue组件中，我们可以注册一些自定义的属性。当一个值传递给一个prop属性时，它就变成了那个组件实例的一个属性。而在组件中我们可以使用props选项来包含这个组件可以接受的prop列表。

```html
<div id="app">
    <my-demo name="andy" age=12 address="guangzhou"></my-demo>
</div>
```
```javascript
new Vue({
    el : '#app',
    components : {
        'my-demo' : {
            template : '<div>{{name}}{{age}}{{address}}</div>',
            props : ['name' , 'age' , 'address']
        }
    }
})
```
上面代码中，我们都是静态绑定prop，当然我们也可以动态的绑定prop，使用v-bind指令(或者简写：":")，比如：

```html
<div id="app">
    <button @click="changeName">changeName</button>
    <my-demo :name="name"></my-demo>
</div>
```

```javascript
new Vue({
    el : '#app',
    data : {
        name : 'andy'
    },
    methods : {
        changeName () {
            this.name = 'peter';
        }
    },
    components : {
        'my-demo' : {
            template : '<div>{{name}}</div>',
            props : ['name']
        }
    }
})
```
有一点需要注意的是，每个组件都只能有一个根元素，所以一般我们都会将组件的所有内容包裹在一个div里面。

上面代码中，我们只看到了以字符串数组形式列出的prop，当然props也可以是一个对象，一般在我们需要对传入到组件的prop进行数据类型验证的时候，就会用到，prop不仅仅可以是字符串，也可以是数组，是对象，是数字，布尔值等。比如：

```html
<div id="app">
    <button @click="changeName">changeName</button>
    <my-demo :name="name"></my-demo>
</div>
```

```javascript
new Vue({
    el : '#app',
    data : {
        name : 'andy'
    },
    methods : {
        changeName () {
            this.name = 324;
        }
    },
    components : {
        'my-demo' : {
            template : `<div>{{name}}</div>`,
            props : {
                name : {
                    type : String
                }
            }
        }
    }
})
```
上面代码中，当我们点击按钮时，将name的值改为数字，那么控制台会发出警告：
```
vue.js:597 [Vue warn]: Invalid prop: type check failed for prop "name". Expected String, got Number.
```
#### prop验证
当我们通过props来向子组件传递数据的时候，很多时候我们需要对传递过来的数据进行验证，看是否满足我们的要求，此时我们可以将props设置为一个对象，而不是字符串数组，一般我们可以设置这几个字段：type（判断数据类型），default（默认值），required（是否是必须要有的），validator（验证函数）。比如：

```
props : {
    prop1 : {
        type : Boolean
    },
    prop2 : {
        type : String,
        required : true
    },
    prop3 : {
        type : Number,
        default : 10
    },
    prop4 : {
        type : String,
        validator (value) {
            return value == 'andy';
        }
    }
}
```
#### 单向数据流
prop数据传递是从父组件到子组件的，父组件的prop的更新会流动到子组件中，但是返过来就不行，这样会防止子组件修改父组件的状态，从而导致数据流向难以理解。每次父组件的数据发生更新时，子组件中所有的prop都将更新为最新值，所以我们不应该在子组件内部去改变prop。如果我们需要在子组件内部改变prop，那么一般会有两种情况，第一种情况是将prop作为子组件的一个初始值，第二种情况是以一种原始的值传入且需要进行转换。

```javascript
export default {
    props : ['name'],
    computed : {
        fullName () {
            return this.name.toUpperCase();
        }
    }
}
```

```javascript
export default {
    props : ['name'],
    data () {
        return {
            fullName : this.name
        }
    }
}
```
这里我们需要注意一点，如果父组件上传递的是class或者style，那么它们会与子组件的根元素的class和style进行合并，而不是替换。


## 监听子组件事件
上面的代码中，我们看到，如果父组件向子组件传递数据可以使用props，那么如果子组件要向父组件传递数据呢？我们可以通过事件消息的方式向父组件传递数据。

```html
<div id="app">
    <button @click="changeName">changeName</button>
    <my-demo :name="name" @enlarge-text="changeText" :style="{fontSize : size + 'px'}"></my-demo>
</div>
```

```javascript
new Vue({
    el : '#app',
    data : {
        name : 'andy',
        size : 16
    },
    methods : {
        changeName () {
            this.name = 'peter';
        },
        changeText (value) {
            this.size += value;
        }
    },
    components : {
        'my-demo' : {
            template : `<div>
                            <div>{{name}}</div>
                            <button @click="changeFontSize">放大字体</button>
                        </div>`,
            props : ['name'],
            methods : {
                changeFontSize () {
                    this.$emit('enlarge-text' , 2);
                }
            }
        }
    }
});
```
## 插槽分发内容
和html元素一样，我们经常需要向一个组件传递内容，比如：

```html
<div id="app">
    <my-demo title="VueJs">
        这是一个vuejs组件   
    </my-demo>
</div>
```

```javascript
new Vue({
    el : '#app',
    components : {
        'my-demo' : {
            template : `<div>
                        <div>{{title}}</div>
                        <slot></slot>
                    </div>`,
            props : ['title']
        }
    }
})
```
## 动态组件
有的时候我们需要使用到动态组件，比如说在不同组件之间进行动态切换
```html
<div id="app">
    <button @click="goHome">home</button>
    <button @click="goAbout">about</button>
    <button @click="goUser">user</button>
    <component :is="currentPage"></component>
</div>
```
```javascript
new Vue({
    el : '#app',
    data : {
        currentPage : 'home'
    },
    methods : {
        goHome () {
            this.currentPage = 'home';
        },
        goAbout () {
            this.currentPage = 'about';
        },
        goUser () {
            this.currentPage = 'user';
        }
    },
    components : {
        home : {
            template : `<div>this is home page</div>`
        },
        about : {
            template : `<div>this is about page</div>`
        },
        user : {
            template : `<div>this is user page</div>`
        }
    }
})
```