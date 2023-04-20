// 文章内容压缩，储存到文件 提交到github
var cluster = require('cluster');

var path = require("path")
var pool = require("./bin/mysql2_hs")
const md5 = require('md5');
const fs = require('fs');
const crypto = require("crypto");
const { exec } = require('child_process')

const zlib = require('zlib');

if (cluster.isMaster) {
    cluster.fork();

    cluster.on('exit', function (worker, code, signal) {
        console.log("exit")
        cluster.fork();
    });
} else {


    // main("hs_novelsee_blog", "m_articles", 0)
    main("hs_xuetuwu", "m_articles", 0)

    function main(database, table, minId) {
        if (fs.existsSync(`./${database}-${table}-minId.txt`)) {
            minId = fs.readFileSync(`./${database}-${table}-minId.txt`)
        }
        if (minId) {
            minId = Number(minId)
        }

        console.log(new Date(), database, table, minId)

        pool.query('select id,content from ??.?? where id>? order by id asc limit 10000', [database, table, minId], async function (error, res, fields) {
            if (error) {
                logger.error("读取错误", error)
                return;
            }
            // console.log(res)
            // return;
            for (let tr of res) {
                // http://newsn.com.cn/say/node-zlib.html

                let dirPath = "./data/" + database + "/" + table + "/" + Math.floor(tr.id / 10000) + "/";

                if (!fs.existsSync(dirPath)) {
                    if (!fs.existsSync("./data/" + database + "/")) {
                        fs.mkdirSync("./data/" + database + "/")
                    }
                    if (!fs.existsSync("./data/" + database + "/" + table + "/")) {
                        fs.mkdirSync("./data/" + database + "/" + table + "/")
                    }
                    fs.mkdirSync(dirPath)
                }
                let filePath = dirPath + tr.id + ".txt";

                if (fs.existsSync(filePath)) {
                    // 发现有这个文件，就跳过
                    // 在文章更新的时候，其实是需要更新的，暂时先这样
                    continue;
                }

                // 压缩
                let gc = zlib.deflateSync(tr.content);
                let text = gc.toString("base64")
                if (text.length >= 200) {
                    text = text.slice(100, 110) + text;
                }
                // console.log(text)
                fs.writeFileSync(filePath, text)

                // if (text.length >= 210) {
                //     text = text.slice(10, text.length)
                // }
                // let texti = Buffer.from(text, 'base64')
                // // 解压
                // let gct = zlib.inflateSync(texti);
                // console.log(gct.toString())

                // break;
            }

            let end = res.pop();
            // console.log(end)
            // main(end.id)

            exec("git add .", function (error, stdout, stderr) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("add", stdout)
                }


                exec("git commit -m '" + new Date().toISOString() + "'", async function (error, stdout, stderr) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("commit", stdout)
                        // fs.writeFileSync(`./${database}-${table}-minId.txt`, end.id.toString())
                    }

                    while (true) {
                        let isbreak = await new Promise(function (resolve, reject) {
                            exec("git push", function (error, stdout, stderr) {
                                if (error) {
                                    console.log(error);
                                    resolve(false)
                                    return;
                                }
                                console.log("push", stdout)

                                fs.writeFileSync(`./${database}-${table}-minId.txt`, end.id.toString())
                                resolve(true)
                            })
                        })

                        if (isbreak) {
                            break;
                        }
                    }


                    // process.exit(1);
                })
            })

            // setTimeout(function () {
            // process.exit(1);
            // }, 1000)

        });
    }
}