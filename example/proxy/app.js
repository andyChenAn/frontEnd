const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
app.use('/public' , express.static('public'));
app.set('view engine' , 'html');
app.engine('html' , require('ejs').renderFile);
app.set('views' , './views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(cookieParser());
app.use(session({
	cookie : {path : '/'},
	secret : 'proxy',
	resave : true,
	saveUninitialized : true
}));

/**
 * 登录拦截器
 * 拦截用户登录，如果用户没有登录，那么就引导用户去登录
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
function checkLogin (req , res , next) {
    if (req.session.username) {
        next();
    } else {
        req.session.originalUrl = req.originalUrl;
        res.redirect('/login');
    }
};
/**
 * 在路径是info下的所有页面都需要验证用户是否已经登录
 */
app.use('/info' , checkLogin);

app.get('/' , function (req , res) {
    res.render('./index.html');
});

app.get('/login' , function (req , res) {
    res.render('./login.html');
});
/**
 * 登录逻辑处理
 */
app.post('/login' , function (req , res) {
    let username = req.body.username;
    req.session.username = username;
    if (req.session.originalUrl) {
        res.redirect(req.session.originalUrl);
        req.session.originalUrl = null;
    } else {
        res.redirect('/');
    }
});

app.get('/info' , function (req , res) {
    res.render('./info.html');
});
/**
 * 退出登录
 */
app.get('/loginout' , function (req , res) {
    req.session.username = null;
    res.redirect('/');
});

app.listen(3000 , function () {
    console.log('listening port 3000');
})