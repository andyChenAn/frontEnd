import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import Layout from './components/Layout';

const app = document.getElementById('app');

const jsx = (
    <Router>
        <Layout />
    </Router>
)
ReactDOM.hydrate(jsx , app);
