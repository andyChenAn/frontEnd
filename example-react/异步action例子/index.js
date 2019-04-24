import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import Root from './containers/Root';
import App from './App';
import fetch from 'cross-fetch';
import rootReducer from './reducers1';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';



let thunk = ({ dispatch , getState }) => next => action => {
    let {
        types,
        shouldCallApi = () => true,
        callApi,
        payload = {}
    } = action;
    if (!types) {
        return next(action);
    }
    if (!Array.isArray(types) || types.length !== 3 || !types.every(type => typeof type === 'string')) {
        throw new Error('Expected an array of three string types.');
    }
    if (typeof callApi !== 'function') {
        throw new Error('callApi must be function');
    }
    if (!shouldCallApi(getState())) {
        return;
    }
    let [startType , successType , failType] = types;
    dispatch(Object.assign({} , payload , {
        type : startType
    }));
    callApi().then(response => {
        return response.json();
    }).then(json => {
        dispatch(Object.assign({} , payload , {
            type : successType,
            posts : json.data.children.map(child => child.data)
        }))
    }).catch(err => {
        dispatch(Object.assign({} , payload , {
            type : failType,
            error : err.message
        }));
    })
}


let store = createStore(rootReducer , applyMiddleware(thunk));

store.subscribe(function () {
    console.log(store.getState());
})

//ReactDOM.render(<Root /> , document.getElementById('root'))
ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
