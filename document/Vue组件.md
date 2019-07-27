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