import { createStore , applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import rootReducer from './reducers';
const loggerMiddleware = createLogger();

const thunk = ({ dispatch , getState }) => next => action => {
    if (typeof action == 'function') {
        return action(dispatch , getState);
    }
    return next(action);
}

export default function configureStore (preloadedState) {
    return createStore(rootReducer , preloadedState , applyMiddleware(thunk , loggerMiddleware));
}