import { combineReducers } from 'redux';
const SELECT_SUBREDDIT = 'SELECT_SUBREDDIT';
const REQUEST_START = 'REQUEST_START';
const REQUEST_SUCCESS = 'REQUEST_SUCCESS';
const REQUEST_FAIL = 'REQUEST_FAIL';

function selectedSubreddit (state = 'reactjs' , action) {
    switch (action.type) {
        case SELECT_SUBREDDIT:
            return action.subreddit;
        default :
            return state;
    }
};

function posts (state = {
    isFetching : false,
    didInvalidate : false,
    items : []
} , action) {
    switch (action.type) {
        case REQUEST_START :
        return Object.assign({} , state , {
            isFetching : true,
            didInvalidate : false
        });
        case REQUEST_SUCCESS :
        return Object.assign({} , state , {
            isFetching : false,
            didInvalidate : false,
            items : action.posts
        });
        case REQUEST_FAIL :
        return Object.assign({} , state , {
            isFetching : false,
            didInvalidate : false,
            items : [],
            error : action.error
        })
        default : 
        return state;
    }
}

function postsBySubreddit (state = {} , action) {
    switch (action.type) {
        case REQUEST_SUCCESS:
        case REQUEST_START:
        case REQUEST_FAIL:
        return Object.assign({} , state , {
            [action.subreddit] : posts(state[action.subreddit] , action)
        });
        default : 
        return state;
    }
}

const rootReducer = combineReducers({
    postsBySubreddit,
    selectedSubreddit
});
export default rootReducer;


































