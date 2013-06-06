
/*
 * GET home page.
 */

var crypto = require('crypto')
   , User = require('../models/user.js')
   , Post = require('../models/post.js');

//导出
//exports.index = function(req, res) {
//  res.render('index', { title: 'Express', layout: 'layout'});
//};

module.exports = function (app) {
    //首页
    app.get('/', function (req, res) {
        //查询文章列表
        Post.get(null, function (err, posts) {
            if (err) {
                posts = [];
            }
            //var user = req.session.user;
            //console.log('Post.get ===>>> currentUser: ' + (user == null || user === 'undefined' ? "" : user.name));

            res.render('index', {
                title: '首页',
                layout: 'layout',
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });

    });

    //注册
    app.get('/reg', checkNotlogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '注册',
            layout: 'layout',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString(),
            inCodeError: req.flash('inCodeError').toString()
        });
    });

    app.post('/reg', checkNotlogin);
    app.post('/reg', function (req, res) {
        console.log("===== reg inint =====");

        var inCode = req.body.inCode;
        if (!inCode || inCode !== 'spring2013') {
            req.flash('inCodeError', '邀请码错, 不能注册!');
            return res.redirect('/reg');
        }

        if (req.body['password-repeat'] != req.body['password']) {
            req.flash('error', '两次输入密码不一致');
            return res.redirect('/reg');
        }
        //加密
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body['password']).digest('base64');

        var newUser = new User({
            name: req.body.username,
            password: password
        });

        //检查注册用户是否存在
        User.get(newUser.name, function (err, user) {
            console.log("===== reg result =====" + user);

            if (user) {
                err = '用户已存在';
                req.flash('error', err);
                return res.redirect('/reg');
            }
            console.log('request /reg svae user');
            //请求 FUN 保存用户
            newUser.save(function (err) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = newUser;
                req.flash('success', '注册成功');
                res.redirect('/');
            });

        });
    });

    //登陆
    app.get("/login", checkNotlogin);
    app.get("/login", function (req, res) {
        res.render('login', {
            title: '用户登陆',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });

    });

    app.post("/login", checkNotlogin);
    app.post("/login", function (req, res) {
        //生成 口令 散列值
        var md5 = crypto.createHash('md5'),
        //digest('hex') 可用 hex
            password = md5.update(req.body.password).digest('base64');

        console.log("====== login init ======");
        // function(req, user),此处曾写成req 报(TypeError: Cannot call method 'flash' of null)
        User.get(req.body.username, function (err, user) {

            if (!user) {
                req.flash('error', '用户不存在!');
                return res.redirect('/login');
            }

            //console.log(" pwd compare ===>>> login pwd: " + password + " db pwd: " + user.password)
            if (user.password != password) {
                req.flash('error', '用户口令错误!');
                return res.redirect('/login');
            }

            req.session.user = user;
            req.flash('success', '登陆成功');
            console.log('Login in success ===>>> currentUser: ' + user.name);
            res.redirect('/');
        });

    });

    //文章发表
    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user,
            post = new Post(currentUser.name, req.body.title, req.body.post);

        //保存发表
        post.save(function (err) {
            //异常回调
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            req.flash('success', '发表成功');
            res.redirect('/');
        });

    });


    //登出
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功');
        res.redirect("/");
    });

};

//检查登陆
function checkLogin(req, res, next){
    if(!req.session.user){
        req.flash('error', '未登陆!');
        return res.redirect('/login');
    }
    next();
}

function checkNotlogin(req , res, next){
    if(req.session.user){
        req.flash('error', '已登陆!');
        return res.redirect('/');
    }
    next();
}













