require('dotenv').config();
const CONSTANTS = require("../config/constants");
const moment = require('moment');
let momenttz = require('moment-timezone')
const ObjectId = require("mongodb").ObjectID;
const { createLogs } = require('../middleware/errorHandler')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
let mongoObjectId = require("mongodb").ObjectID

module.exports = {
  configure: function (app, dbo) {
    //var self = this;

    let CONFIG = app.CONFIG;
    let KAFKA = CONFIG.KAFKA;

    var mongo = require("../models/common");
    mongo.configure(dbo);
    let bookingCount = 0;
    const UTIL = require("../common/util");
    const MESSAGES = require("../common/messages");
    const bookingCommon = require("../common/common")(CONFIG, MESSAGES, KAFKA, UTIL, mongo);
    const response = require('../middleware/responses')
    const request = require('../middleware/request')

    app.get('/', request.decode, async function (req, res) {
      let data = await mongo.getAll(CONSTANTS.DATABASE.APPOINTMENT, CONSTANTS.COLLECTIONS.APPOINTMENT)
      return response.success(req, res, 200, data, "Running")
    });

  },

};
