
var mongodb = require('./db')
   , markdown = require('markdown').markdown;

//init Post
function Post(name, title, post){
    this.name = name;
    this.title = title;
    this.post = post;
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
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours + ":" + date.getMinutes()
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
                callback(err, post);
            });
        });

    });

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
                        callback(err);
                    }
                    //把查询出 post 对象放入 posts 数据中
                    var posts = [];
                    docs.forEach(function (doc, index) {
                        var post = new Post(doc.name, doc.post, doc.time);
                        post.push(post);
                    });
                    callback(null, posts);
                });
            });
        });
    };

};
