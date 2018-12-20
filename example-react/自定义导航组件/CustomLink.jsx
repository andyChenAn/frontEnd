const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;
// 这里我们使用children来渲染组件，主要是因为不管是匹不匹配路径都会渲染组件
class CustomLink extends Component {
    constructor (props) {
        super(props);
    }
    render () {
        const { to , exact , label } = this.props;
        return (
            <Route path={to} exact={exact} children={({match}) => {
                return (
                    <div className={match ? 'active' : ''}>
                        {match ? '>' : ''}
                        <Link to={to}>{label}</Link>
                    </div>
                )
            }} />
        )
    }
}

class App extends Component {
    render () {
        return (
            <Router>
                <div>
                    <CustomLink to="/" exact={true} label="home" />
                    <CustomLink to="/about" label="about" />
                    <hr />
                    <Route exact path="/" component={Home} />
                    <Route path="/about" component={About} />
                </div>
            </Router>
        )
    }
}