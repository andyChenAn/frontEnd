import React , { Component } from 'react';
import { Link , Switch , Route } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Contact from './Contact';

export default class Layout extends Component {
    constructor (props) {
        super(props);
        this.state = {
            title : 'react render server'
        }
    }
    render () {
        return (
            <div>
                <h1>{this.state.title}</h1>
                <div>
                    <Link to="/">Home</Link>
                    <Link to="/about">About</Link>
                    <Link to="/contact">Contact</Link>
                </div>
                <Switch>
                    <Route path="/" exact component={Home} />
                    <Route path="/about" exact component={About} />
                    <Route path="/contact" exact component={Contact} />
                </Switch>
            </div>
        )
    }
}