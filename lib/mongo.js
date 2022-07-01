module.exports = {
    createConnection: function (CONFIG) {
        const mongo = require('mongodb').MongoClient;
        return new Promise(function (resolve, reject) {
            mongo.connect(CONFIG.MONGO_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }, async function (err, db) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    console.log("MongoDB Connected");
                    resolve(db);
                }
            });
        });
    }
};