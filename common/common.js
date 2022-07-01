const CONSTANTS = require("../config/constants");
const util = require("./util");
let moment = require('moment')
let momenttz = require('moment-timezone');
let mongoObjectId = require("mongodb").ObjectID
const excelToJson = require("convert-excel-to-json");
//let xlsx = require('xlsx');
// const excelJs = require("exceljs");
const path = require('path')

module.exports = function (CONFIG, MESSAGES, UTIL, mongo) {
    let actions = {
        //validation for appointment booking
        validateForPatient: function (params) {
            let returnObject = {};
            returnObject.msg = "";
            returnObject.missing = false;

            if (!params.hasOwnProperty("firstName") || params.firstName == null || params.firstName == "") {
                returnObject.msg += "FirstName is missing, ";
            }
            if (!params.hasOwnProperty("lastName") || params.lastName == null || params.lastName == "") {
                returnObject.msg += "LastName is missing, ";
            }

            if (!params.hasOwnProperty("gender") || params.gender == null || params.gender == "") {
                returnObject.msg += "Gender is missing, ";
            }

            if (!params.hasOwnProperty("mobileNumber") || params.mobileNumber == null || params.mobileNumber == "") {
                returnObject.msg += "Mobile number is missing, ";
            }
            if (!params.hasOwnProperty("date") || params.date == null || params.date == "") {
                returnObject.msg += "Date is missing, ";
            }
            if (!params.hasOwnProperty("slot") || params.slot == null || params.slot == "") {
                returnObject.msg += "slot is missing, ";
            }
            if (!params.hasOwnProperty("clinicId") || params.clinicId == null || params.clinicId == "") {
                returnObject.msg += "clinicId is missing, ";
            }
            if (!params.hasOwnProperty("screeningResult") || params.screeningResult == null || params.screeningResult == "") {
                returnObject.msg += "screeningResult is missing";
            }
            if (!params.hasOwnProperty("reasonCode") || params.reasonCode == null || params.reasonCode == "") {
                returnObject.msg += "reasonCode is missing";
            }
            if (returnObject.msg !== "") {
                returnObject.missing = true;
            }
            return returnObject;
        },
        excelToJsonMiddleware: function (req, res, next) {
            const file = req.file;
            const sheetName = req.body.sheet;
            if (file) {
                let doc_url = path.join(
                    __dirname,
                    `../uploads/${req.file.filename}`
                );
                console.log(doc_url, sheetName, CONSTANTS.EXCEL_HEADERS[sheetName])
                const excelData = excelToJson({
                    sourceFile: doc_url,
                    sheets: [
                        {
                            name: sheetName,
                            header: {
                                rows: 1,
                            },
                            columnToKey: CONSTANTS.EXCEL_HEADERS[sheetName],
                        },
                    ],
                });

                req.body = excelData[sheetName];
                next()
            }
        },
        createObjectForIvrCall: function (body) {
            let result = {};
            if (body.CallSid) {
                result.callSid = body.CallSid
            }
            if (body.CallFrom) {
                result.callFrom = body.CallFrom.substring(1)
            }
            if (body.StartTime) {
                result.callTime = body.StartTime
            }
            if (body.callType) {
                result.callType = body.callType
            }
            if (body.userType) {
                result.userType = body.userType
            }
            if (body.userId) {
                result.userId = body.userId
            }
            if(body.status) {
                result.status = body.status
            }
            if(body.createdAt) {
                result.createdAt = body.createdAt
            }
            if(body.updatedAt) {
                result.updatedAt = body.updatedAt
            }

            return result
        }
    };
    return actions;
};
