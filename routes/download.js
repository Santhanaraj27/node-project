require('dotenv').config();
const CONSTANTS = require("../config/constants");
const CsvParser = require("json2csv").Parser;

module.exports = {
  configure: function (app, dbo) {

    var mongo = require("../models/common");
    mongo.configure(dbo);
    const response = require('../middleware/responses')
    const request = require('../middleware/request')

    app.get('/download/patient', request.decode, async function (req, res) {
      let query = {};
      let { search, corporateName, patientType } = req.query || {};
      if (search) query.firstName = { $regex: `.*${search}.*`, $options: "$i" };
      if (corporateName) query.corporateName = { $regex: corporateName, $options: '$i' }
      if (patientType && patientType !== "ALL") query.patientType = { $regex: patientType, $options: '$i' }

      let data = await mongo.find(CONSTANTS.DATABASE.USER, CONSTANTS.COLLECTIONS.USER, query)
      if (data?.length) {
        data = data.map((user, index) => ({
          sNo: index + 1,
          userId: user.patientDisplayId,
          firstName: user.firstName,
          mobileNumber: user.mobileNumber,
          patientType: user.patientType,
          status: [true, false].includes(user.status) ? user.status ? "Active" : "InActive" : user.status,
          profileCompletion: Boolean(user.isCompletedProfile && user.isMedicalHistoryComplete),
          corporateName: user.corporateName
        }))
      }

      const csvFields = ["sNo", "userId", "firstName", "mobileNumber", "patientType", "status", "profileCompletion", "corporateName"];
      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=patient.csv");
      res.status(200).end(csvData);

      // return response.success(req, res, 200, data, "Running")
    });

    app.get('/download/doctor', request.decode, async function (req, res) {
      let query = {};
      let { speciality, status, doctorType } = req.query || {};
      if (speciality) query.speciality = speciality;
      if (status) query.status = status;
      if (doctorType) query.doctorType = doctorType;

      let data = await mongo.find(CONSTANTS.DATABASE.USER, CONSTANTS.COLLECTIONS.DOCTOR, query)
      if (data?.length) {
        data = data.map((doctor, index) => ({
          sNo: index + 1,
          userId: doctor.doctorDisplayId,
          firstName: doctor.firstName,
          speciality: doctor.speciality,
          emailId: doctor.emailId,
          mobileNumber: doctor.mobileNumber,
          gender: doctor.gender,
          status: doctor.status
        }))
      }

      const csvFields = ["sNo", "userId", "firstName", "speciality", "emailId", "mobileNumber", "gender", "status"];
      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=doctor.csv");
      res.status(200).end(csvData);

      // return response.success(req, res, 200, data, "Running")
    });
  }

};
