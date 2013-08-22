
/*
 * GET home page.
 */

var crypto = require('crypto')
   , User = require('../models/user')
   , Post = require('../models/post');

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
            //可写为全局共享调用函数
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


    //文章发表
    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        //查询用户文章
        Post.get(req.session.user.name, function (err, posts) {
            if (err) posts = [];

            res.render('post', {
                title: '发表',
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });

    });

    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var postTitle = req.body.title;
        console.log("post log ===>>>"+ postTitle );

        var currentUser = req.session.user,
            post = "",
            tIndex = 0,
            title = "",
            savePost = null;

        if ( postTitle ) {
            title = postTitle;
            post = req.body.editor_post;
        } else {
            post = req.body.post;
            tIndex = post.indexOf(":");
            title = (post ? post.substr(0, tIndex) : "");
            post = (post ? post.substr(tIndex + 1, post.length) : "");
        }

        savePost = new Post(currentUser.name, title, post);

        //保存发表
        savePost.save(function (err) {
            //异常回调
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            req.flash('success', '发表成功');
            res.redirect('/');
        });

    });

  /** 
    * 用户链接
    * (用户相关发帖以条形显示, 同时需查询出回帖信息)
    */
    //app.get('/:name', checkLogin);
    app.get('/user/:name', function (req, res) {
        var username = req.params.name;
        console.log("link user ===>>> " + username);
        User.get(username, function (err, user) {
            if (err || !user) {
                //中文提示可配置 config 文件中
                req.flash('error', '用户不存在!');
                return res.redirect('/');
            }

            //提出公共方法
            Post.get(user.name, function (err, posts) {
                if (err) {
                    req.flash('error', err);
                    res.redirect('/');
                }


                res.render('user', {
                    title: user.name,
                    posts: posts,
                    current_user: user,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });

        });
    });

    //文章标题链接
    /**
    * 需天添加回帖功能, 点击文章时显示回复信息
    */
    app.get('/topic/:topicId', function (req, res) {

        var topicId = req.params.topicId;

        if (!topicId) {
            req.flash("error", "文章 ID 不存在!");
            return res.redirect("/");
        } 

        Post.getOne(topicId, function (err, post) {
            //处理回调异常
            if (err) {
                req.flash('error', err);
                res.redirect('/');
            }

            res.render('article', {
                posts: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });

    });

    /**
     * 刷新文章
     */
    app.get('/refreshArticle', function (req, res) {

        var current_user = req.session.user;
        console.log("===>>> refresh posts: "+ current_user);

        if (!current_user || current_user.name !== 'admin'){
            req.flash('error', '对不起您不是管理员, 无法刷新文章列表!');
            return res.redirect("/");
        }

        Post.delArticl(function (err, status) {
            if (err) {
                req.flash('error', '更新文章列表失败!');
                return res.redirect('/'); 
            } 

            req.flash('success', '文章列表已更新');
            return res.redirect('/');
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

    //登出
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        console.log("logout fun===>>> ");

        req.session.user = null;
        req.flash('success', '登出成功');
        res.redirect("/");
    });

    app.get('/k_explain', function (req, res) {
        return res.render('explain', {user: req.session.user});
    });
};

//检查登陆
function checkLogin(req, res, next){
    
    if(!req.session.user){
        req.flash('error', '未登陆!');
        return res.redirect('/login');
    }
    console.log("logout ===>>> " + req.session.user.name);

    next();
}

function checkNotlogin(req , res, next){
    if(req.session.user){
        req.flash('error', '已登陆!');
        return res.redirect('/');
    }

    next();
}













