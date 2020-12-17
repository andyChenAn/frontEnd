# Vue的自定义组件使用v-model
如果我们是自定义组件使用v-model指令，默认会使用一个名为`value`的prop和名为`iput`的事件，来处理v-model指令。
```javascript
// 将自定义组件上的v-mode转为prop和handler
function transformModel (options, data) {
    // 获取prop，动态绑定的属性，默认是"value"
    var prop = (options.model && options.model.prop) || 'value';
    // 获取事件名称，默认是"input"
    var event = (options.model && options.model.event) || 'input';
    (data.attrs || (data.attrs = {}))[prop] = data.model.value;
    var on = data.on || (data.on = {});
    var existing = on[event];
    // 获取事件监听器
    var callback = data.model.callback;
    // 将事件监听器绑定到对应的事件上面
    if (isDef(existing)) {
      if (
        Array.isArray(existing)
          ? existing.indexOf(callback) === -1
          : existing !== callback
      ) {
        on[event] = [callback].concat(existing);
      }
    } else {
      on[event] = callback;
    }
}
```
通过上面代码，我们就将自定义组件的v-model转换成：
```javascript
{
    "input" : handler
}
```
当我们自定义组件内部触发`input`事件，那么就会执行对应的handler，handler其实就是这样的代码：
```javascript
function ($$v) {value=$$v}
```
##### 第一种实现自定义组件绑定v-model指令：
我们知道v-model其实就是value和input事件的语法糖，那么我们就可以在自定义组件中利用名为value的prop和input事件来实现v-model功能
```html
<!DOCTYPE html>
<html lang="en">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <script src="vue.js"></script>
    </head>
    <body>
    <div id="app">
      <modal v-model="showModal"></modal>
      <button @click="click">click</button>
    </div>
    <script>
      Vue.component('modal' , {
        template : `<div v-show="value">
            <div>hello andy</div>
            <button @click="hide">hide</button>
          </div>`,
        props : {
          value : Boolean
        },
        methods : {
          hide () {
            this.$emit('input' , false);
          }
        }
      })
      const vm = new Vue({
        el : '#app',
        data : {
          showModal : false
        },
        methods : {
          click (){
            this.showModal = true;
          }
        }
      });
    </script>
    </body>
</html>
```
##### 第二种实现自定义组件绑定v-model指令：
从Vue源码中我们知道，Vue默认是使用`value`和`input`来实现v-model，但是我们也可以使用model选项来实现，这个时候我们就可以自定义prop和事件名称。
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <script src="vue.js"></script>
  </head>
  <body>
    <div id="app">
      <modal v-model="showModal"></modal>
      <button @click="click">click</button>
    </div>
    <script>
      Vue.component('modal' , {
        template : `<div v-show="bb">
            <div>hello andy</div>
            <button @click="hide">hide</button>
          </div>`,
        model : {
          prop : 'bb',
          event : 'aa'
        },
        props : {
          bb : Boolean
        },
        methods : {
          hide () {
            this.$emit('aa' , false);
          }
        }
      })
      const vm = new Vue({
        el : '#app',
        data : {
          showModal : false
        },
        methods : {
          click (){
            this.showModal = true;
          }
        }
      });
    </script>
  </body>
</html>
```
上面代码中，我把value和input事件改成了bb和aa事件。