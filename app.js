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


app.configure('development', function(){
  app.use(express.errorHandler());
});

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
