
var mongodb = require('./db')
   //, markdown = require('markdown').markdown;

//init Post
function Post(name, title, post){
    this.name = name;
    this.title = title;
    this.post = post;
};

function Posts(name, title, post, time){
    this.name = name;
    this.title = title;
    this.post = post;
    this.time = time;
};

//导出
module.exports = Post;

Post.prototype.save = function (callback) {

    var date = new Date();
    //各种事件类型
    var time = {
        date: date,
        year: date.getFullYear(),
        mothod: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
    }

    var post = {
        name: this.name,
        title: this.title,
        post: this.post,
        time: time
    }

    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                callback(err);
            }
            //用户名字添加索引
            collection.ensureIndex('name');
            //保存 post 对象到数据库
            collection.insert(post, { safe: true }, function (err, post) {
                mongodb.close();
                //callback(null, post) 回调方多返回参数,导致用户失效,后台不报错!
                callback(null);
            });
        });

    });
};

 //获取文章
Post.get = function get(username, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            //查找name为 username的文档
            var query = {};
            if (username) {
                query.name = username;
            }

            collection.find(query).sort({ time: -1 }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                //把查询出 post 对象放入 posts 数据中
                // 方式一
                var posts = [];
                docs.forEach(function (doc, index) {
                    var post = new Posts(doc.name, doc.title, doc.post, doc.time);
                    posts.push(post);
                });
                callback(null, posts);
                
                //方式二,解析 markdown 为 html
                /* docs.forEach(function (doc) {
                    doc.post = markdown.toHTML(doc.post);
                });
                callback(err, docs);
                */
            });
        });
    });
};

//查询单条数据
Post.getOne = function (arguments, callback) {
    //开启数据库连接
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            callback(err);
        }

        //获取文档集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //查询条件
            var query = {},
                username = arguments.username,
                title = arguments.title;
            if (username)
                query.name = username;
            if (title)
                query.title = title;

            //查询单条数据
            collection.findOne(query, function (err, doc) {
                mongodb.close();
                if (err) callback(err, null);

                callback(null, new Posts(doc.name, doc.title, doc.post, doc.time));
            });
        })
    });

};