import React, { Component } from 'react';
import { BrowserRouter as Router , Route , Switch , Link , withRouter , Redirect } from 'react-router-dom';
import Footer from './components/Footer';
import AddTodo from './containers/AddTodo';
import VisibleTodoList from './containers/VisibleTodoList';

const App = () => (
    <div>
        <AddTodo />
        <VisibleTodoList />
        <Footer />
    </div>
)

export default App;
