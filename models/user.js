var mongodb = require('./db');

function User(user){
    this.name = user.name;
    this.password = user.password;
};

module.exports = User;

//保存
User.prototype.save = function save(callback) {
    //存入 Mongodb 文档
    var user = {
        name: this.name,
        password: this.password
    };

    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        //读取users集合
        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            // 为 name 属性添加索引
            collection.ensureIndex('name', { unique: true });
            //写入用户数据 users 集合中
            collection.insert(user, { safe: true }, function (err, user) {
                mongodb.close();
                //数据插入成功, 回调函数返回用户信息
                callback(err, user);
            });
        });

    });
};

//获取
User.get = function get(username, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        //读取users 集合
        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            //查找name属性为username 的文档
            collection.findOne({ name: username }, function (err, doc) {
                mongodb.close();
                if (doc) {
                    //封装为 User 对象
                    var user = new User(doc);
                    console.log('user.js ===>>> login user:' + user.name);
                    callback(null, user);
                } else {
                    callback(err, null);
                }
            });

        });

    });
};