const MongoClient = require('mongodb').MongoClient

const url = 'mongodb://localhost:27017'
const dbName = 'freader'
const client = new MongoClient(url, { useNewUrlParser: true })

const out = {
    db: null,
    init: async function () {
        await client.connect()
        out.db = client.db(dbName)
    }
}

module.exports = out