# Vue-Router进阶
上次主要介绍了Vue-Router的基础知识，这次我们来看一下Vue-Router的进阶知识。
## 导航守卫
"导航"表示路由正在发生改变。Vue-Router提供的导航守卫主要用来通过跳转或取消的方式守卫导航。有多种机会植入路由导航过程中：全局的，单个路由独享的，组件级的。

需要注意的是，参数或查询字符串的改变并不会触发进入/离开的导航守卫。我们可以通过监测$route对象来应对这些变化，或者使用beforeRouteUpdate的组件内守卫。

```javascript
watch : {
    $route (to , from) {
        this.id = to.params.id;
    }
}
```
```javascript
beforeRouteUpdate (to , from , next) {
    this.id = to.params.id;
    next();
}
```
##### 1、全局前置守卫
我们可以使用router.beforeEach注册一个全局前置守卫

```javascript
const router = new VueRouter({...});
router.beforeEach((to , from , next) => {
    console.log(1);
    next();
})
router.beforeEach((to , from , next) => {
    console.log(2);
    next();
})
```
当一个导航触发时，全局前置守卫会按照创建顺序调用。守卫都是异步执行的，此时导航在所有守卫resolve之前一直都处于等待中状态。当一个守卫执行完成之后，一定要调用next来resolve这个钩子。不然没办法进入到下一个守卫中，而只有所有的守卫都调用了next方法，那么菜证明所有的钩子都执行完了，那么这个时候导航的状态才会是确认的。

调用next()，就是进行管道中的下一个钩子。

调用next(false)：中断当前的导航。

调用next('/')或者next({path : '/'})：跳转到一个不同的地址。当前导航被中断，然后进行一个新的导航。

调用next(error)：如果传入的是一个Error实例，则导航会被终止且该错误会被传递给router.onError()注册过的回调中。

**确保要调用next方法，否则钩子就不会被resolved。导航也不会跳转**
##### 2、全局解析守卫
我们可以使用router.beforeResolve注册一个全局守卫，这个钩子会在导航被确认之前，同时在所有组件内守卫和异步路由组件被解析之后，解析守卫就被调用。
##### 3、全局后置钩子
我们可以使用router.afterEach注册一个全局后置钩子，钩子与守卫的区别在于，钩子不会接收next参数。

```javascript
router.afterEach((to , from) => {
    
})
``` 
##### 4、路由独享的守卫
我们可以在路由配置上面定义beforeEnter守卫

```javascript
const router = new VueRouter({
    routes : [
        {
            path : '/home',
            component : Home,
            beforeEnter (to , from , next) {
                // ...
            }
        }
    ]
})
```
##### 5、组件内的守卫
组件内的守卫，是我们可以直接在路由组件中定义，beforeRouteEnter，beforeRouteUpdate，beforeRouteLeave这三个组件内的守卫。

```javascript
const Foo = {
  template: `...`,
  beforeRouteEnter (to, from, next) {
    // 在渲染该组件的对应路由被 confirm 前调用
    // 不！能！获取组件实例 `this`
    // 因为当守卫执行前，组件实例还没被创建
  },
  beforeRouteUpdate (to, from, next) {
    // 在当前路由改变，但是该组件被复用时调用
    // 举例来说，对于一个带有动态参数的路径 /foo/:id，在 /foo/1 和 /foo/2 之间跳转的时候，
    // 由于会渲染同样的 Foo 组件，因此组件实例会被复用。而这个钩子就会在这个情况下被调用。
    // 可以访问组件实例 `this`
  },
  beforeRouteLeave (to, from, next) {
    // 导航离开该组件的对应路由时调用
    // 可以访问组件实例 `this`
  }
}
```
##### 完整的导航解析流程
- 1、导航被触发
- 2、在失活的组件里调用离开守卫(beforeRouteLeave)
- 3、调用全局的beforeEach守卫
- 4、在重用的组件里调用beforeRouteUpdate守卫
- 5、在路由配置里调用beforeEnter守卫
- 6、解析异步路由组件
- 7、在被激活的组件里调用beforeRouteEnter守卫
- 8、调用全局的beforeResolve守卫
- 9、导航被确认
- 10、调用全局的afterEach钩子
- 11、触发DOM更新
- 12、用创建好的实例调用beforeRouteEnter守卫中的next的回调函数

## 数据获取
有时候在进入某个路由后，需要从服务器获取数据，比如，在渲染用户信息时，你需要从服务器获取用户的数据，我们可以通过两种方式俩实现：
- 1、导航完成之后获取：先完成导航，然后在组件生命周期钩子中获取数据，在数据获取期间显示“加载中”之类的提示。
- 2、导航完成之前获取：导航完成前，在路由进入到守卫中获取数据，在数据获取成功后执行导航。

## 滚动行为
使用前端路由，当切换到新路由时，想要页面滚动顶部，或者保持原来的滚动位置，就像重新加载页那么，我们可以在路由配置里面添加scrollBehavior字段。

```javascript
const router = new VueRouter({
    scrollBehavior (to , from , savedPosition) {
        // return 期望滚动到哪个位置
    }
})
```
除此之外，我们还能实现异步滚动，可以在scrollBehavior函数内返回一个promise，来得出预期要滚动的位置。

```
scrollBehavior (to , from , savedPosition) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({
                x : 0,
                y : 300
            })
        } , 2000)
    })
}
```
## 路由懒加载
我们可以把不同路由对应的组件分割成不同的代码块，然后当路由被访问的时候才加载对应组件。

```javascript
const router = new VueRouter({
    routes : [
        {
            path : '/about',
            name : 'about',
            component : () => import('./components/About.vue')
        },
        {
            path : '/home',
            name : 'home',
            component : () => import('./components/Home.vue')
        }
    ]
})
```
