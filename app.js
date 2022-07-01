const express = require('express');
const bodyparser = require('body-parser');
const helmet = require("helmet");
const cors = require('cors');
const migration = require('./routes/migration');
const bulkUpload = require('./routes/bulkUpload');
const dashboard = require('./routes/dashboard');
const download = require('./routes/download');
const ivr = require('./routes/ivr');
const app = express();
const AWS = require('aws-sdk');
const region = "ap-south-1";

// Create a Secrets Manager client
let client = new AWS.SecretsManager({
    region: region
});

app.enable("trust proxy");

const { CustomLogger } = require("./middleware/logger");
let appLogger = new CustomLogger();
app.use(appLogger.requestDetails(appLogger));

app.use(helmet());
app.use(cors());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(bodyparser.text());
app.use((req, res, next) => {
    console.log(req.originalUrl);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

const args = process.argv.slice(2)[0];

if (args == undefined) {
    console.log("Error : Please provide environment");
} else {
    const CONFIG = require("./config/config")(args);
    const response = require('./middleware/responses')
    if (CONFIG.NA !== "NA") {
        if (['PREPROD', 'PROD'].indexOf(args) > -1) {
            client.getSecretValue({ SecretId: CONFIG.SECRET_KEY }, function (err, data) {
                if (err) {
                    console.log("Error", err);
                    throw err;
                }
                else {
                    if ('SecretString' in data) {
                        console.log("Secrret fetched", data)

                        let connectionUrl = JSON.parse(data.SecretString)
                        CONFIG.MONGO_URL = `mongodb://${connectionUrl.username}:${connectionUrl.password}@${connectionUrl.host}:${connectionUrl.port}?replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;
                        console.log("config", CONFIG)
                        const db = require("./lib/mongo");
                        console.log("config", CONFIG)
                        db.createConnection(CONFIG).then(function (dbo) {

                            app.CONFIG = CONFIG;

                            app.get('/healthCheck', async (req, res) => {
                                return response.success(req, res, 200, "Running", "Running")
                            });
                            bulkUpload.configure(app, dbo);
                            migration.configure(app, dbo);
                            dashboard.configure(app, dbo);
                            download.configure(app, dbo);
                            ivr.configure(app, dbo);

                            var server = app.listen(CONFIG.PORT, function () {
                                console.log("Meradoc miscellaneous on port " + server.address().port);
                            });


                            process.on('uncaughtException', function (error) {
                                console.log('whoops! There was an uncaught error', error);
                            });

                            process.on('unhandledRejection', function (reason, promise) {
                                console.log('Unhandled rejection', { reason: reason, promise: promise });
                            });

                        }, function (rej) {
                            console.log("Error starting APP");
                        });
                    }
                }
            });
        } else {
            const db = require("./lib/mongo");
            console.log("config", CONFIG)
            db.createConnection(CONFIG).then(function (dbo) {

                app.CONFIG = CONFIG;

                app.get('/healthCheck', async (req, res) => {
                    return response.success(req, res, 200, "Running", "Running")
                });
                bulkUpload.configure(app, dbo);
                migration.configure(app, dbo);
                dashboard.configure(app, dbo);
                download.configure(app, dbo);
                ivr.configure(app, dbo);

                var server = app.listen(CONFIG.PORT, function () {
                    console.log("Meradoc miscellaneous on port " + server.address().port);
                });


                process.on('uncaughtException', function (error) {
                    console.log('whoops! There was an uncaught error', error);
                });

                process.on('unhandledRejection', function (reason, promise) {
                    console.log('Unhandled rejection', { reason: reason, promise: promise });
                });

            }, function (rej) {
                console.log("Error starting the APP");
            });
        }



    } else {
        console.log("Unknown Environment");
    }
}