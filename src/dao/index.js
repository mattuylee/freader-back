const MongoClient = require("mongodb").MongoClient;
const globalConfig = require("../util/index").globalConfig;

const url = globalConfig.database.url;
const dbName = globalConfig.database.name;
const client = new MongoClient(url, { useNewUrlParser: true });

const out = {
  db: null,
  init: async function () {
    await client.connect();
    out.db = client.db(dbName);
    let db = client.db(dbName);
    if (!(await db.collection("meta").findOne(null))) {
      db.collection("user").createIndex({ uid: 1 });
      db.collection("ubook").createIndex({ uid: 1, bid: 1 });
      db.collection("book").createIndex({ bid: 1 });
      db.collection("chapter").createIndexes([
        { key: { uid: 1 } },
        { key: { cid: 1 } },
      ]);
      db.collection("meta").insertOne({ inited: true });
    } //初始化数据库
  },
};

module.exports = out;
