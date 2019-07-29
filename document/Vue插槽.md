# Vue插槽
在2.6.0中，我们为具名插槽和作用域插槽引入了一个新的统一的语法（v-slot指令），它取代了slot和slot-scope这两个特性。

```html
<Hello>hello andy</Hello>
```
```html
// Hello.vue
<template>
<div>
    <div>
        <!--组件里的内容会被插入到这里-->
        <slot />  
    </div>
</div>
</template>
```
如果组件没有包含一个slot元素，那么该组件其实标签和结束标签之间的内容就会被丢弃。
## 编译作用域
父级模板里的所有内容都是在父级作用域中编译的，子模板里的所有内容都是在子作用域中编译的。

```html
<Hello name="andy">
    hello {{name}}
</Hello>
```
上面代码中，父级模板中不能访问到name的值，因为name的作用域是在子模板中编译的。
## 后备内容
我们可以为插槽提供一个后备内容（也就是默认内容），它只会在组件没有提供任何内容的情况下被渲染。

```html
<!--父模板中-->
<Hello name="andy">
    hello world
</Hello>
```

```html
<!--子模板中-->
<div>
    <slot>hello andy</slot>
</div>
```
上面代码中，因为父模板中存在组件内容，所以会覆盖默认插槽的内容，如果父组件不存在内容，那么就会渲染默认的插槽内容。
## 具名插槽
有的时候，我们需要多个插槽，我们可以给slot上面添加一个特殊的特性name。利用这个特性可以定义额外的插槽。这里需要注意的是，v-slot只能添加在一个<template>上。

```html
<template>
<div id="app">
    <layout>
        <template v-slot:header>
            <h1>here might be a page title</h1>
        </template>
        <template v-slot:default>
            <p>A paragraph for the main content.</p>
            <p>And another one.</p>
        </template>
        <template v-slot:footer>
            <p>here is some contact info</p>
        </template>
    </layout>
</div>
</template>
```

```html
<template>
    <div>
        <header>
            <slot name="header"></slot>
        </header>
        <main>
            <slot></slot>
        </main>
        <footer>
            <slot name="footer"></slot>
        </footer>
    </div>
</template>
```

## 作用域插槽
有时候我们想让插槽内容能够访问子组件中才有的数据。

```html
<template>
    <div id="app">
        <layout>
            <template v-slot:default="slotProps">{{slotProps.user.firstName}}</template>
        </layout>
    </div>
</template>
```

```html
<template>
    <div>
        <slot :user="user">{{user.lastName}}</slot>
    </div>
</template>
```
