import React, { Component } from 'react';
import { CSSTransition , TransitionGroup } from 'react-transition-group';
class App extends Component {
	constructor (props) {
		super(props);
		this.state = {
			show : false
		}
	}
	show = () => {
		this.setState({
			show : !this.state.show
		})
	}
	render () {
		const renderChild = () => {
			return (
				<CSSTransition classNames="fade" timeout={300}>
					<div>
						<div>hello jack</div>
						<div>hello andy</div>
					</div>
				</CSSTransition>
			)
		};
		return (
			<div>
				<button onClick={this.show}>click</button>
				<TransitionGroup>
					{this.state.show ? renderChild() : null}
				</TransitionGroup>
				<div>这是一个简单的动画</div>
			</div>
		)
	}
}

export default App;