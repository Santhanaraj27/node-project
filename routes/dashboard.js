require('dotenv').config();
const CONSTANTS = require("../config/constants");
const moment = require('moment-timezone');

module.exports = {
  configure: function (app, dbo) {
    //var self = this;

    let CONFIG = app.CONFIG;
    let KAFKA = CONFIG.KAFKA;

    var mongo = require("../models/common");
    mongo.configure(dbo);
    const UTIL = require("../common/util");
    const MESSAGES = require("../common/messages");
    const bookingCommon = require("../common/common")(CONFIG, MESSAGES, KAFKA, UTIL, mongo);
    const response = require('../middleware/responses')
    const request = require('../middleware/request')

    app.get('/count', request.decode, async function (req, res) {
      const now = new Date(moment.tz("Asia/Kolkata").startOf('day').format("YYYY-MM-DD"));
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      let [
        totalRegistration,
        completedProfile,
        bookedAppointments,
        totalAppointments,
        todayAppointments,
        todayIVRAppointments,
        todayWebAppointments,
        totalCompletedAppointments,
        doctorsOnboard,
        todayCreatedSlots,
        todaySlotCreatedDoctors,
        freeSlots
      ] = await Promise.all([
        /* totalRegistration */
        mongo.findWithCountData(CONSTANTS.DATABASE.USER, CONSTANTS.COLLECTIONS.USER, {}),
        /* completedProfile */
        mongo.findWithCountData(CONSTANTS.DATABASE.USER, CONSTANTS.COLLECTIONS.USER, { isCompletedProfile: true, isMedicalHistoryComplete: true }),
        /* bookedAppointments */
        mongo.findWithCountData(CONSTANTS.DATABASE.APPOINTMENT, CONSTANTS.COLLECTIONS.APPOINTMENT, {}),
        /* totalAppointments */
        mongo.findWithCountData(CONSTANTS.DATABASE.APPOINTMENT, CONSTANTS.COLLECTIONS.APPOINTMENT, { appointmentStatus: "COMPLETED" }),
        /* todayAppointments */
        mongo.findWithCountData(CONSTANTS.DATABASE.APPOINTMENT, CONSTANTS.COLLECTIONS.APPOINTMENT, { appointmentDate: moment.tz("Asia/Kolkata").format('YYYY-MM-DD') }),
        /* todayIVRAppointments */
        mongo.findWithCountData(CONSTANTS.DATABASE.APPOINTMENT, CONSTANTS.COLLECTIONS.APPOINTMENT, { appointmentDate: moment.tz("Asia/Kolkata").format('YYYY-MM-DD'), source: "IVR" }),
        /* todayWebAppointments */
        mongo.findWithCountData(CONSTANTS.DATABASE.APPOINTMENT, CONSTANTS.COLLECTIONS.APPOINTMENT, { appointmentDate: moment.tz("Asia/Kolkata").format('YYYY-MM-DD'), source: "WEB" }),
        /* totalCompletedAppointments */
        mongo.findWithCountData(CONSTANTS.DATABASE.APPOINTMENT, CONSTANTS.COLLECTIONS.APPOINTMENT, { appointmentDate: { $lte: moment.tz("Asia/Kolkata").format('YYYY-MM-DD') }, appointmentStatus: "COMPLETED" }),
        /* doctorsOnboard */
        mongo.findWithCountData(CONSTANTS.DATABASE.USER, CONSTANTS.COLLECTIONS.DOCTOR, {}),
        /* todayCreatedSlots */
        mongo.findWithCountData(CONSTANTS.DATABASE.APPOINTMENT, CONSTANTS.COLLECTIONS.SLOT, { createdAt: { $gte: today, $lt: tomorrow } }),
        /* todaySlotCreatedDoctors */
        mongo.findWithDistinctCountData(CONSTANTS.DATABASE.APPOINTMENT, CONSTANTS.COLLECTIONS.SLOT, { createdAt: { $gte: today, $lt: tomorrow } }, "doctorId"),
        /* freeSlots */
        mongo.findWithCountData(CONSTANTS.DATABASE.APPOINTMENT, CONSTANTS.COLLECTIONS.SLOT, { createdAt: { $gte: today, $lt: tomorrow }, status: "ACTIVE" })

      ])
      return response.success(req, res, 200, { totalRegistration, completedProfile, bookedAppointments, totalAppointments, todayAppointments, todayIVRAppointments, todayWebAppointments, totalCompletedAppointments, doctorsOnboard, todayCreatedSlots, todaySlotCreatedDoctors, freeSlots }, "Running")
    });

  },

};
