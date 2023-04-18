var mysql = require('mysql2');


// 连接
let hs_group = {
    host: 'data07.pc',
    user: 'article',
    password: 'a@fj303t92t',
    database: 'hs_site_group_publics',
    port: '55116',

    dateStrings: true,
    // timezone: 'Z',
    charset: 'utf8mb4_general_ci'
}

// 连接池
var pool = mysql.createPool(hs_group);

function query(sql, para, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log("建立连接失败 local");
        } else {
            // console.log("建立连接成功 local", pool._allConnections.length);

            if (!callback) {
                callback = para;
                para = [];
            }

            connection.query(sql, para, function (error, result, fields) {

                // （3）当连接不再使用时，用connection对象的release方法将其归还到连接池中。
                connection.release();

                // （4）当一个连接不再需要使用且需要从连接池中移除时，用connection对象的destroy方法。
                // connection.destroy();
                // 连接移除后，连接池中的连接数减一。

                // （5）当一个连接池不再需要使用时，用连接池对象的end方法关闭连接池。
                // pool.end();

                callback(error, result, fields);
            });
        }
        // pool.end();
    })
}

function close() {
    // 还到连接池
    pool.release();
    // 从连接池删除
    // pool.destroy();
    // 关闭连接池
    // pool.end();
}

module.exports = {
    query: query,
    close: close
};
