require('dotenv').config();
const CONSTANTS = require("../config/constants");

const { success, errors } = require('../middleware/responses')

module.exports = {
  configure: function (app, dbo) {

    let CONFIG = app.CONFIG;
    let KAFKA = CONFIG.KAFKA;

    var mongo = require("../models/common");
    mongo.configure(dbo);

    const UTIL = require("../common/util");
    const MESSAGES = require("../common/messages");

    const COMMON = require('../common/common')(CONFIG, MESSAGES, UTIL, mongo);

    app.get('/api/v1/ivr/getPatient', async (req, res, next) => {
      console.log("Here we are", req.query);
      let body = req.query
      let findPatient = await mongo.findOne(CONSTANTS.DATABASE.USER, CONSTANTS.COLLECTIONS.USER, { mobileNumber: UTIL.encrypt(body.CallFrom.substring(1)) })
      if (!findPatient) {
        body.userType = CONSTANTS.USER_TYPE.UNREGISTERED;
        body.createdAt = +new Date();
        body.updatedAt = +new Date();

        let ivrCallObj = COMMON.createObjectForIvrCall(body);
        console.log(ivrCallObj)
        mongo.insert(CONSTANTS.DATABASE.MISCELLANEOUS, CONSTANTS.COLLECTIONS.IVR_CALL, ivrCallObj);
        return errors(req, res, 404, findPatient, "Caller is not a registered user.")
      }
      return success(req, res, 200, findPatient, "Caller is a registered user.")
    })

    app.get('/api/v1/ivr/profileCheck', async (req, res, next) => {
      console.log("Here we are", req.query);
      let body = req.query
      let findPatient = await mongo.findOne(CONSTANTS.DATABASE.USER, CONSTANTS.COLLECTIONS.USER, { mobileNumber: UTIL.encrypt(body.CallFrom.substring(1))/*, isCompletedProfile: false*/ })
      if (!findPatient) {

        return errors(req, res, 404, findPatient, "Caller is not a registered user.")
      }
      return success(req, res, 200, findPatient, "Caller is a registered user.")
    })

    app.get('/api/v1/ivr/inbound', async (req, res, next) => {
      console.log("Here we are", req.query);
      let body = req.query;
      body.createdAt = +new Date();
      body.updatedAt = +new Date();
      body.status = CONSTANTS.STATUS[0];
      if (body.userType == CONSTANTS.USER_TYPE.REGISTERED) {
        let findPatient = await mongo.findOne(CONSTANTS.DATABASE.USER, CONSTANTS.COLLECTIONS.USER, { mobileNumber: UTIL.encrypt(body.CallFrom.substring(1)) });
        body.userId = findPatient._id.toString()
      }
      let ivrCallObj = COMMON.createObjectForIvrCall(body);
      console.log(ivrCallObj)
      mongo.insert(CONSTANTS.DATABASE.MISCELLANEOUS, CONSTANTS.COLLECTIONS.IVR_CALL, ivrCallObj);

      return success(req, res, 200, null, "Call Registered.")
    })

    app.get('/api/v1/ivr/callListByType', async (req, res, next) => {
      console.log("Here we are", req.query);
      let body = req.query;
      let clause = {
        callType: body.callType
      }
      if (body.callType) {
        if (CONSTANTS.CALL_TYPE.indexOf(body.callType) < 0) {
          return errors(req, res, 404, null, "Call type not known.")
        } else {
          clause.callType = body.callType
        }
      } else {
        clause.callType = { $in: CONSTANTS.CALL_TYPE }
      }
      let page = body?.page || 1;
      page = Number(page);
      let limit = body?.size || 10;
      let skip = (limit * (page - 1));

      if (body.status && CONSTANTS.STATUS.indexOf(body.status) > -1) {
        clause.status = body.status
      }
      let response = await mongo.findWithSort(CONSTANTS.DATABASE.MISCELLANEOUS, CONSTANTS.COLLECTIONS.IVR_CALL, clause, skip, limit, {});

      return success(req, res, 200, response, "Data listed successfully")
      // } else {
      //   return errors(req, res, 404, null, "Call type not known.")
      // }
    })

    app.get('/api/v1/ivr/callListById/:id', async (req, res, next) => {
      console.log("Here we are", req.params);
      let id = req.params.id;
      let response = await mongo.getById(CONSTANTS.DATABASE.MISCELLANEOUS, CONSTANTS.COLLECTIONS.IVR_CALL, id);
      if (response.callFrom) {
        response = JSON.parse(JSON.stringify(response));
        let findPatient = await mongo.findOne(CONSTANTS.DATABASE.USER, CONSTANTS.COLLECTIONS.USER, { mobileNumber: response.callFrom });
        response.patientData = findPatient;
      }
      return success(req, res, 200, response, "Call Registered.")
    })

    app.put('/api/v1/ivr/update', async (req, res, next) => {
      console.log("Here we are", req.body);
      let body = req.body;
      if (!body.comments || !body.adminId || !body._id) {
        let message = "";
        if (!body.comments) {
          message = "comments are required."
        } else if (!body._id) {
          message = "_id is required."
        } else {
          message = "Admin id is required."
        }
        return errors(req, res, 400, null, message)
      }
      let updateBody = {
        comments: body.comments,
        status: CONSTANTS.STATUS[1]
      }
      updateBody.adminId = body.adminId;
      if (req.user && req.user.type && req.user.type == "ADMIN") {
        updateBody.adminId = req.user.id
      }
      await mongo.updateById(CONSTANTS.DATABASE.MISCELLANEOUS, CONSTANTS.COLLECTIONS.IVR_CALL, body._id, updateBody);
      return success(req, res, 200, null, "Updated successfully")
    })

  }
};
