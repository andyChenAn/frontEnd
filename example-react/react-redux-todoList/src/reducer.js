import { VisibilityFilters , SET_VISIBILITY_FILTER , ADD_TODO , TOGGLE_TODO } from './actions';
const initialState = {
    visibilityFilter : VisibilityFilters.SHOW_ALL,
    todos : []
};
const { SHOW_ALL } = VisibilityFilters;

function visibilityFilter (state = SHOW_ALL , action) {
    switch (action.type) {
        case SET_VISIBILITY_FILTER :
        return action.filter;
        default : 
        return state;
    }
}

function todos (state = [] , action) {
    switch (action.type) {
        case ADD_TODO : 
        return [
            ...state ,
            {
                text : action.text,
                completed : false
            }
        ]
        case TOGGLE_TODO :
        return state.map((todo , index) => {
            if (index == action.index) {
                return Object.assign({} , todo , {
                    completed : !todo.completed
                })
            }
            return todo;
        });
        default :
        return state;
    }
}

function todoApp (state = initialState , action) {
    return {
        visibilityFilter : visibilityFilter(state.visibilityFilter , action),
        todos : todos(state.todos , action)
    }
}

export default todoApp;
