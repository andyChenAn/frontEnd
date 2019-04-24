import React , { Component } from 'react';
import { Provider } from 'react-redux';
import configureStore from '../configureStore';
import AysncApp from './AsyncApp';

const store = configureStore();

export default class Root extends Component {
    render () {
        return (
            <Provider store={store}>
                <AysncApp />
            </Provider>
        )
    }
}