import React, { Component } from 'react';
import { createLogger } from 'redux-logger';
import { connect } from 'react-redux';

const SELECT_SUBREDDIT = 'SELECT_SUBREDDIT';
const REQUEST_START = 'REQUEST_START';
const REQUEST_SUCCESS = 'REQUEST_SUCCESS';
const REQUEST_FAIL = 'REQUEST_FAIL';

function selectSubreddit (subreddit) {
    return {
        type : SELECT_SUBREDDIT,
        subreddit
    }
};

function postData (subreddit) {
    return {
        types : [REQUEST_START , REQUEST_SUCCESS , REQUEST_FAIL],
        shouldCallApi : state => {
            let posts = state.postsBySubreddit[subreddit];
            if (!posts) {
                return true;
            } else if (posts.isFetching) {
                return false;
            } else {
                return posts.didInvalidate;
            }
        },
        callApi : () => fetch(`https://www.reddit.com/r/${subreddit}.json`),
        payload : {subreddit}
    }
};

class App extends Component {
    constructor (props) {
        super(props);
    }
    handleChange = (subreddit) => {
        const { dispatch } = this.props;
        dispatch(selectSubreddit(subreddit));
        dispatch(postData(subreddit));
    }
    componentDidMount () {
        const { dispatch } = this.props;
        dispatch(postData('reactjs'));
    }
    render () {
        return (
            <div>
                <select onChange={(e) => this.handleChange(e.target.value)}>
                    <option value="reactjs">reactjs</option>
                    <option value="frontend">frontend</option>
                    <option value="aa">aa</option>
                </select>
            </div>
        )
    }
};







export default connect()(App);

