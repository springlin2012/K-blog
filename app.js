/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , partials = require('express-partials')
  , MongoStore = require('connect-mongo')(express)
  , settings = require('./settings')
  , flash = require('connect-flash');

 // express 3.0 使用方式
 var app = express();

//app.configure(function () {
    // 设置 port 参数
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    //app.engine('ejs',require('ejs-locals'));
    //app.locals._layoutFile = '/layout.ejs';
    app.set('view engine', 'ejs');

    //模板 (3.0 去掉了layout 页面布局模板风格)
    app.use(partials());
    
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    //存储
    //Cookie 解析中间件
    app.use(express.cookieParser());
    //会话支持
    app.use(express.session({
        secret: settings.cookieSecret,
        key: settings.db,
        //6000
        //30day: 1000 * 60 * 60 * 24 * 30
        cookie: { maxAge:  1000 * 60},
        store: new MongoStore({
            db: settings.db
        })
    }));

    //flash 存储值
    app.use(flash());
    //路由
    app.use(app.router);
    //静态资源
    app.use(express.static(path.join(__dirname, 'public')));
//});



//
/*app.use(function (req, res, next) {
    //console.log("======>>> req res filter...");

    var err = req.flash('error'),
    success = req.flash('success');

    res.locals.user = req.session.user;
    res.locals.error = err.length ? err : null;
    res.locals.success = success.length ? success : null;
    res.locals.test = "test";

    next();
});
*/

//开发模式, （为默认启动模式)
app.configure('development', function(){
  app.use(express.errorHandler());
});

//产品模式
app.configure('production', function () {
    app.user(express.errorHandler());
});


//错误处理
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.send(500, 'Something broke!');
    next();
});

//express 3.0 使用方式
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

routes(app);



//请求映射到routes目录,　exports.index
//app.get('/',routes.index);
//app.get('/login', routes.login);

// 3.0 前 (动态视图助手)
/*
app.dynamicHelpers({
    user: function (req, res) {
        return req.session.user;
    },
    error: function (req, res) {
        var err = req.flash('error');
        if (err.length)
            return err;
        else
            return '';
    },
    success: function (req, res) {
        var succ = req.flash('success');
        if (succ.length)
            return succ;
        else
            return '';
    }
});
*/