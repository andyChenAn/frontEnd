# Vue-Router基础
Vue-Router是Vuejs的路由管理器。

```javascript
import Vue from 'vue';
import VueRouter from 'vue-router';
import About from './components/About.vue';
import Home from './components/Home.vue';
Vue.use(VueRouter);
const router = new VueRouter({
    routes : [
        {
            path : '/home',
            component : Home,
            name : 'Home'
        },
        {
            path : '/about',
            component : About,
            name : 'About'
        }
    ]
});
export default router;
```
有了路由，vuejs可以很容易的搭建单页应用项目，我们可以将不同的路由路径映射到不同的组件。

## 动态路由匹配
我们经常需要把某种模式匹配的所有路由都全部映射到同一个组件，比如，我们有一个Company组件，对于所有的companyId的公司，都要使用这个组件来渲染，那么这个时候我们可以使用动态路径参数来实现这个效果。

```javascript
{
    // 动态路径参数以冒号开头
    path : '/company/:id',
    component : Company,
    name : 'Company'
}
```
上面的代码中，/company/234和/company/123其实都将映射到相同的组件。那我们怎么访问到动态路径参数呢？我们使用动态路由时，当匹配到一个路由，动态路径参数就会被设置到this.$route.params上，我们可以在组件内使用。

```javascript
export default {
    data () {
        return {
            companyId : ''
        }
    },
    created () {
        const id = this.$route.params.id;
        this.companyId = id;
    }
}
```
当使用路由参数时，如果从/company/123导航到/company/324，原来的组件实例会被复用。因为这两个路由都是渲染同一个组件，比起销毁再重新创建，复用的效率要高一点。不过这也意味着，组件的生命周期钩子不会再被调用。

```javascript
<template>
    <div>
        公司ID为{{companyId}}
    </div>
</template>
<script>
    export default {
        data () {
            return {
                companyId : ''
            }
        },
        created () {
            const id = this.$route.params.id;
            this.companyId = id;
        }
    }
</script>
```
上面代码中，当我们匹配到不同的路由时，都是渲染同一个组件，但是组件显示的公司id永远都是第一个匹配路由的id，因为组件被复用，所以不会再调用生命周期钩子，那此时我们应该怎么去获取到不同路由下的公司id呢？其实我们可以通过监听$route的变化来获取。

```javascript
<template>
    <div>
        公司ID为{{companyId}}
    </div>
</template>
<script>
    export default {
        data () {
            return {
                companyId : ''
            }
        },
        created () {
            const id = this.$route.params.id;
            this.companyId = id;
        },
        watch: {
            // 这里我们可以监听$route的变化，to表示的是要跳转到的路由对象，from表示的是原路由对象
            $route (to , from) {
                this.companyId = to.params.id;
            }
        }
    }
</script>
```
除了上面这种方式，我们也可以使用导航守卫来实现

```javascript
<template>
    <div>
        公司ID为{{companyId}}
    </div>
</template>
<script>
    export default {
        data () {
            return {
                companyId : ''
            }
        },
        created () {
            const id = this.$route.params.id;
            this.companyId = id;
        },
        // 当路由发生变化的时候，就会调用这个钩子，记得一定要调用next
        beforeRouteUpdate (to , from , next) {
            this.companyId = to.params.id;
            next();
        }
    }
</script>
```
我们这里要区分一下$router和$route的区别，$router表示的是VueRouter实例，$route表示的是当前的路由对象。
## 嵌套路由
在很多界面，通常由多层嵌套的组件组合而成。同样的，url中各段动态路径也按某种结构对应嵌套的各层组件，如果我们想要实现这种效果，那么我们可以给vue-router添加一个children属性。比如：

```javascript
Vue.use(VueRouter);
const router = new VueRouter({
    routes : [
        {
            path : '/home',
            component : Home,
            name : 'Home'
        },
        {
            path : '/about',
            component : About,
            name : 'About'
        },
        {
            path : '/company/:id',
            component : Company,
            name : 'Company',
            children : [
                {
                    path : 'photo',
                    component : Photo
                }
            ]
        }
    ]
});
export default router;
```
这里我们需要注意的是，以"/"开头的嵌套路径会被当做是根路径，所以我们在使用的时候一定不要在children里面的path加上/。而嵌套路由中对应的组件会被渲染到父路由的组件里，所以我们只需要在父路由的组件中添加一个<router-view></router-view>就可以了。

```javascript
<template>
    <div>
        公司ID为{{companyId}}
        <router-view></router-view>
    </div>
</template>
```
## 编程式的导航
我们除了可以使用<router-link></router-link>标签来定义导航链接之外，我们还可以使用router的实例方法，通过代码是来实现导航。

##### 1、router.push(location , onComplete? , onAbort?)

router实例我们可以通过this.$router来访问，当我们调用push方法时，会导航到不同的url，这个方法会向history栈中添加一条记录，当我们使用浏览器的回退按钮时，就会回退到之前的url。

```javascript
// App.vue文件
<template>
<div id="app">
    <div>
        <button @click="goAbout">about</button>
        <button @click="goHome">home</button>
        <button @click="goCompany">company</button>
        <button @click="goCompanyInfo">companyInfo</button>
    </div>
    <router-view></router-view>
</div>
</template>

<script>

export default {
    methods: {
        goAbout () {
            this.$router.push('/about');
        },
        goHome () {
            this.$router.push({path : '/home'});
        },
        goCompany () {
            this.$router.push({
                name : 'Company',
                params : {id : 12}
            })
        },
        goCompanyInfo () {
            this.$router.push({
                name : 'Photo',
                params : {id : 3242 , photo : 'photo'}
            })
        }
    }
}
</script>
```
```javascript
// routes.js文件
import Vue from 'vue';
import VueRouter from 'vue-router';
import About from './components/About.vue';
import Home from './components/Home.vue';
import Company from './components/Company';
import Photo from './components/Photo';
Vue.use(VueRouter);
const router = new VueRouter({
    routes : [
        {
            path : '/home',
            component : Home,
            name : 'Home'
        },
        {
            path : '/about',
            component : About,
            name : 'About'
        },
        {
            path : '/company/:id',
            component : Company,
            name : 'Company',
            children : [
                {
                    path : 'photo',
                    component : Photo,
                    name : 'Photo'
                }
            ]
        }
    ]
});
export default router;
```
这里我们需要注意一点，如果location参数是一个对象，那么当对象中存在path字段，使用params字段是不会生效的，我们可以使用name字段和params字段，或者只使用一个path字段，将动态参数写入到path字段的值中。

##### 2、router.replace(location , onComplete? , onAbort?)
这个方法和router.push方法很类似，唯一的不同就是，这个方法不会向history栈中添加一个记录，而是替换掉当前的history记录。

##### 3、router.go(n)
这个方法主要就是在history记录中向前或向后多少步，类似window.history.go(n)方法。

## 命名路由
我们可以在创建Router实例的时候，在routes配置中给路由设置一个名称，这样我们在做路由跳转的时候，我们可以这样使用：

```javascript
const router = new VueRouter({
  routes: [
    {
      path: '/user/:userId',
      name: 'user',
      component: User
    }
  ]
})
```
```
<router-link :to="{ name: 'user', params: { userId: 123 }}">User</router-link>
```
或者

```javascript
router.push({ name: 'user', params: { userId: 123 }})
```
## 命名视图
命名视图，说白了就是给视图取个名字，也就是给<router-view></router-view>添加一个name属性，如果router-view没有设置name属性，那么默认为default。

```javascript
<template>
<div id="app">
    <div>
        <router-link to="/all">all</router-link>
    </div>
    <router-view name="a"></router-view>
    <router-view name="b"></router-view>
</div>
</template>

<script>

export default {

}
</script>
```

```javascript
import Vue from 'vue';
import VueRouter from 'vue-router';
import About from './components/About.vue';
import Home from './components/Home.vue';
Vue.use(VueRouter);
const router = new VueRouter({
    routes : [
        {
            path : '/all',
            components : {
                a : About,
                b : Home
            }
        }
    ]
});
export default router;
```
## 重定向
重定向也是通过routes配置来完成，比如：

```javascript
Vue.use(VueRouter);
const router = new VueRouter({
    routes : [
        {
            path : '/all',
            components : {
                a : About,
                b : Home
            }
        },
        {
            path : '/home',
            redirect : '/about'
        },
        {
            path : '/about',
            component : About
        }
    ]
});
export default router;
```
重定向的目标也可以是一个命名的路由，比如：

```javascript
Vue.use(VueRouter);
const router = new VueRouter({
    routes : [
        {
            path : '/all',
            components : {
                a : About,
                b : Home
            }
        },
        {
            path : '/home',
            redirect : {name : 'about'}
        },
        {
            path : '/about',
            name : 'about',
            component : About
        }
    ]
});
export default router;
```
## 路由组件传参




