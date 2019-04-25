# react之测试
测试react应用，主要就是测试react应用的各个功能是否都能正常使用。基本上一个功能都会涉及到以下几个部分：

- action creator函数
- 异步action creator函数
- reducer函数
- component组件

### action creator测试
当我们编写完一个action creator函数，我们需要测试一下这个函数是否能返回我们想要的值。测试的时候，我们只需要设置一个期望的值，然后通过调用action creator函数返回的值进行比较，如果相同，那么表示action creator函数没有问题，如果不同，那么表示编写的action creator函数有问题。
```javascript
// action.test.js
import { ADD_TODO , DELETE_TODO, addTodo, deleteTodo } from '../actions';
function addTodo (text) {
    return {
        type : ADD_TODO,
        text
    }
};
function deleteTodo (index) {
    return {
        type : DELETE_TODO,
        index
    }
};
describe('actions', () => {
    it('should create an action to add a todo', () => {
        const text = 'Finish docs'
        const expectedAction = {
            type: ADD_TODO,
            text
        }
        expect(addTodo(text)).toEqual(expectedAction)
    });
    it('should create an action to delete a todo' , () => {
        const index = 1;
        const expectedAction = {
            type : DELETE_TODO,
            index
        };
        expect(deleteTodo(index)).toEqual(expectedAction);
    })
})
```
### 异步action creator测试
对于异步action creator函数来说，虽然调用action creator函数返回的是一个函数，但是最终还是要dispatch一个同步的action，所以我们只需要测试同步的action creator函数返回的结果与我们自己设置的期望的结果是否相同，那么就能证明我们的异步action creator函数是否正常。

我们可以使用nock这个第三方库来模拟http请求响应。

通过使用redux-mock-store这个第三方库来mock出一个store，来测试异步aciton creator函数和中间件。

```javascript
// asyncAction.test.js
import fetch from 'isomorphic-fetch'
import thunk from 'redux-thunk';
import nock from 'nock';
import expect from 'expect';
import configureMockStore from 'redux-mock-store'

const REQUEST_POSTS = 'REQUEST_POSTS';
const RECEIVE_POSTS = 'RECEIVE_POSTS';


function requestPosts () {
    return {
        type : REQUEST_POSTS
    }
};

function receivePosts (json) {
    return {
        type : json.type,
        success : json.success
    }
};

function fetchPosts (subreddit) {
    return (dispatch , getState) => {
        dispatch(requestPosts(subreddit));
        return fetch(`https://cnodejs.org/api/v1/topics`)
        .then(response => response.json())
        .then(json => {
            dispatch(receivePosts(json))
        })
        .catch(err => {
            console.log(err);
        })
    }
};


const middlewares = [ thunk ]
const mockStore = configureMockStore(middlewares);

describe('async actions' , () => {
    afterEach(() => {
        nock.cleanAll();
    })
    it('creates RECEIVE_POSTS when fetching data has been done' , () => {
        // 这里我们向https://cnodejs.org/api/v1/topics发送了一个get请求，这时nock会拦截这个请求，并立即返回我们预先定义好的响应这里的响应就是{success : true , type : REECEIVE_POSTS}
        nock(`https://cnodejs.org`)
        .get('/api/v1/topics')
        .reply(200 , {
            success : true,
            type : RECEIVE_POSTS
        })
        const expectedActions = [
            {type : REQUEST_POSTS},
            {type : RECEIVE_POSTS , success : true}
        ];
        const store = mockStore({});
        return store.dispatch(fetchPosts('reactjs'))
        .then(() => {
            expect(store.getActions()).toEqual(expectedActions);
        })
    });
});
```
### Reducer函数测试
reducer函数的测试是比较简单的，我们可以这样：

```javascript
// reducer.test.js
const ADD_TODO = 'ADD_TODO';
const DELETE_TODO = 'DELETE_TODO';
function addTodo (text) {
    return {
        type : ADD_TODO,
        text
    }
};

function deleteTodo (index) {
    return {
        type : DELETE_TODO,
        index
    }
};

function reducer (state = [] , action) {
    switch (action.type) {
        case ADD_TODO :
        return [...state , action.text];
        case DELETE_TODO :
        return [
            ...state.slice(0 , action.index),
            ...state.slice(action.index + 1)
        ];
        default :
        return state;
    }
};

describe('reducer函数测试' , () => {
    it('应该返回初始值' , () => {
        const expectValue = [];
        expect(reducer(undefined , {})).toEqual(expectValue);
    });

    it('添加一个代办事项' , () => {
        const expectValue = ['andy' , 'jack'];
        expect(reducer(['andy'] , addTodo('jack'))).toEqual(expectValue);
    });

    it('删除一个代办事项' , () => {
        const expectValue = ['jack' , 'peter'];
        expect(reducer(['andy' , 'jack' , 'peter'] , deleteTodo(0))).toEqual(expectValue);
    });
});
```
### Component测试
组件测试，一般都是用来测试组件中的所有方法是否都会在满足相应的条件下执行，如果都执行了，那么说明这个组件的功能都是正常的。除此之外，我们还会去测试组件渲染是否都正常。component测试，我们可以使用enzyme库来进行测试。

```javascript
// component.test.js
import React , { Component } from 'react';
import Enzyme , { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
class TodoTextInput extends Component {
    constructor (props) {
        super(props);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.state = {
            value : ''
        }
    }
    handleKeyDown (e) {
        if (e.keyCode === 13) {
            this.props.onSave(this.state.value);
        }
    }
    handleChange (e) {
        let value = e.target.value;
        this.setState({
            value
        })
    }
    render () {
        const { placeholder } = this.props;
        return (
            <div>
                <input placeholder={placeholder} onChange={this.handleChange} onKeyDown={this.handleKeyDown} />
            </div>
        )
    }
}

class MyComponent extends Component {
    constructor (props) {
        super(props);
        this.handleSave = this.handleSave.bind(this);
    }
    handleSave (text) {
        if (text.length !== 0) {
            this.props.addTodo(text);
        }
    }
    render () {
        return (
            <div className="header">
                <h1>todos</h1>
                <TodoTextInput newTodo={true} onSave={this.handleSave} placeholder="what needs to be done?" />
            </div>
        )
    }
};

function setup () {
    const props = {
        addTodo : jest.fn()
    };
    const enzymeWrapper = shallow(<MyComponent {...props} />);
    return {
        props,
        enzymeWrapper
    }
};

Enzyme.configure({ adapter: new Adapter() })

describe('components' , () => {
    describe('MyComponent' , () => {
        it("应该会选择组件本身以及子组件" , () => {
            const { enzymeWrapper } = setup();
            expect(enzymeWrapper.find('div').hasClass('header')).toBe(true);
            expect(enzymeWrapper.find('h1').text()).toBe('todos');
            const todoInputProps = enzymeWrapper.find('TodoTextInput').props();
            expect(todoInputProps.newTodo).toBe(true);
            expect(todoInputProps.placeholder).toBe('what needs to be done?');
        });
        it('如果text值的长度大于0，那么就会调用addTodo方法' , () => {
            const { enzymeWrapper , props } = setup();
            const input = enzymeWrapper.find('TodoTextInput');
            input.props().onSave('');
            expect(props.addTodo.mock.calls.length).toBe(0);
            input.props().onSave('andy');
            expect(props.addTodo.mock.calls.length).toBe(1);
        })
    })
});
```
