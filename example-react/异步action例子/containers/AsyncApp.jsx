import React , { Component } from 'react';
import { connect } from 'react-redux';
import {
    selectSubreddit,
    fetchPostsIfNeeded
} from '../actions';
import Picker from '../components/Picker';
import Posts from '../components/Posts';

class AsyncApp extends Component {
    constructor (props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }
    componentDidMount () {
        const { dispatch , selectedSubreddit } = this.props;
        dispatch(fetchPostsIfNeeded(selectedSubreddit));
    }
    componentWillReceiveProps (nextProps) {
        if (nextProps.selectedSubreddit != this.props.selectedSubreddit) {
            const { dispatch , selectedSubreddit } = nextProps;
            dispatch(fetchPostsIfNeeded(selectedSubreddit));
        }
    }
    handleChange (nextSubreddit) {
        this.props.dispatch(selectSubreddit(nextSubreddit));
    }
    render () {
        const { selectedSubreddit , posts , isFetching , lastUpdated } = this.props;
        return (
            <div>
                <Picker value={selectedSubreddit} onChange={this.handleChange} options={['reactjs' , 'frontend']} />
                <p>
                    {
                        lastUpdated && 
                        <span>last updated at {new Date(lastUpdated).toLocaleTimeString()}</span>
                    }
                </p>
                {
                    isFetching && posts.length == 0 && <h2>Loading...</h2>
                }
                {
                    !isFetching && posts.length == 0 && <h2>Empty.</h2>
                }
                {
                    posts.length > 0 &&
                    <div style={{opacity : isFetching ? 0.5 : 1}}>
                        <Posts posts={posts} />
                    </div>
                }
            </div>
        )
    }
}

function mapStateToProps(state) {
    const { selectedSubreddit, postsBySubreddit } = state
    const {
      isFetching,
      lastUpdated,
      items: posts
    } = postsBySubreddit[selectedSubreddit] || {
      isFetching: true,
      items: []
    }
  
    return {
      selectedSubreddit,
      posts,
      isFetching,
      lastUpdated
    }
  }

export default connect(mapStateToProps)(AsyncApp);