require('dotenv').config();
const CONSTANTS = require("../config/constants");

const { success, errors } = require('./../middleware/responses')

module.exports = {
  configure: function (app, dbo) {

    let CONFIG = app.CONFIG;
    let KAFKA = CONFIG.KAFKA;

    var mongo = require("../models/common");
    mongo.configure(dbo);

    const UTIL = require("../common/util");
    const MESSAGES = require("../common/messages");
    const COMMON = require('./../common/common')(CONFIG, MESSAGES, UTIL, mongo)
    const moment = require('moment-timezone');
    const shortid = require('shortid');
    const puppeteer = require('puppeteer');
    const getStream = require("into-stream");
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path')
    const Handlebars = require("handlebars");
    const AWS = require('aws-sdk');

    const s3 = require('s3-client');


    AWS.config.update({
      accessKeyId: process.env.accessKeyId,
      secretAccessKey: process.env.secretAccessKey,
      region: process.env.region
    });

    let awsS3Client = new AWS.S3();

    let client = s3.createClient({
      s3Client: awsS3Client
    });

    app.post('/api/v1/migrate/patient', UTIL.uploadExcel.single('file'), COMMON.excelToJsonMiddleware, async (req, res, next) => {
      // console.log(req.body)
      let body = req.body;
      let data = []
      success(req, res, 200, null, "Migration Done")
      for (let item of body) {
        item.patientDisplayId = item.patientDisplayId.toString();
        item.isEmailVerified = false;
        item.isMobileVerified = true;
        item.isMedicalHistoryComplete = false;
        item.isCompletedProfile = item.isCompletedProfile && item.isCompletedProfile.toLowerCase() !== "no" ? true : false;
        if (item.dob) {
          // console.log("dob", item.dob)
          if (typeof item.dob == 'string') {
            if (item.dob.toLowerCase() == 'null') {
              item.dob = null
            } else {
              item.dob = UTIL.encrypt(item.dob)
            }
          } else {
            item.dob = moment(new Date(item.dob)).tz('Asia/kolkata').add(1, 'day').format("YYYY-MM-DD");
            item.dob = UTIL.encrypt(item.dob);
          }
        }
        item.gender = item.gender && item.gender.toLowerCase() !== 'null' ? UTIL.encrypt(item.gender) : null;
        console.log(item.addressDetails)
        // item.address = item.address && item.address !== 'NULL' ? item.address : null;
        if (item.addressDetails) {
          if (typeof item.addressDetails == 'string') {
            if (item.addressDetails.toLowerCase() == 'null') {
              item.addressDetails = null
            } else {
              item.addressDetails = UTIL.encrypt(item.addressDetails.toString())
            }
          } else {
            item.addressDetails = UTIL.encrypt(item.addressDetails.toString())
          }
        }
        item.mobileNumber = UTIL.encrypt(item?.mobileNumber?.toString());
        item.updatedAt = item.createdAt;
        item.maritalStatus = item.maritalStatus && item.maritalStatus.toLowerCase() !== 'null' ? item.maritalStatus : null;
        item.patientType = item.patientType.toUpperCase();
        item.corporateName = item.corporateName && item.corporateName.toLowerCase() !== 'null' ? item.corporateName : null;
        item.referralCode = item.referralCode && item.referralCode.toLowerCase() !== 'null' ? item.referralCode : null;
        item.isMigratedData = true;
        item.emailId = UTIL.encrypt(item?.emailId)
        data.push(item)
        //await dbo.db(CONSTANTS.DATABASE.USER_TEST).collection(CONSTANTS.COLLECTIONS.USER).updateOne({ mobileNumber: item.mobileNumber }, { $set: item }, { upsert: true })
      }
      let insertData = await dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.USER).insertMany(data)
      // mongo.insertMany(CONSTANTS.DATABASE.USER_TEST, CONSTANTS.COLLECTIONS.USER, body)
      console.log("inserted data", insertData)
    })

    app.post('/api/v1/migrate/doctor', UTIL.uploadExcel.single('file'), COMMON.excelToJsonMiddleware, async (req, res, next) => {
      // console.log(req.body)
      let body = req.body;
      let data = []
      for (let item of body) {
        let educationDetails = {};
        if (item.dob) {
          // console.log("dob", item.dob)
          if (typeof item.dob == 'string') {
            if (item.dob.toLowerCase() == 'null') {
              item.dob = null
            }
            item.dob = UTIL.encrypt(item.dob)
          } else {
            item.dob = moment(new Date(item.dob)).tz('Asia/kolkata').add(1, 'day').format("YYYY-MM-DD");
            item.dob = UTIL.encrypt(item.dob)
          }
        }
        item.mobileNumber = UTIL.encrypt(item?.mobileNumber?.toString());
        item.gender = item.gender && item.gender.toLowerCase() !== 'null' ? UTIL.encrypt(item.gender) : null;
        item.profileFileName = UTIL.encrypt(item?.profileFileName)
        item.profileFilePath = item.profileFileName;
        item.erxSignatureFileName = UTIL.encrypt(item.erxSignatureFileName);
        item.erxSignatureFilePath = item.erxSignatureFileName;
        item.updatedAt = item.createdAt;
        item.speciality = null;
        item.specialityId = null;
        item.isSendSms = false;
        item.isSendEmail = false;
        item.isTermsAndCondition = true;
        item.status = "APPROVED";
        item.isMobileVerified = true;
        item.language = ['HINDI', 'ENGLISH'];
        item.doctorDisplayId = item?.doctorDisplayId?.toString();
        item.profileCode = item?.profileCode?.toString();
        item.exotelNumber = UTIL.encrypt(item?.exotelNumber?.toString());
        item.isMigratedData = true;
        item.firstName = UTIL.encrypt(item?.firstName);
        item.emailId = UTIL.encrypt(item?.emailId)
        educationDetails.speciality = null;
        educationDetails.specialityId = null;
        educationDetails.medicalRegistrationNo = UTIL.encrypt(item?.medicalRegistrationNo?.toString());
        delete item.medicalRegistrationNo;
        educationDetails.createdAt = item.createdAt;
        educationDetails.updatedAt = item.createdAt;
        educationDetails.isMigratedData = true;
        educationDetails.graduationDetails = [{ degreeName: UTIL.encrypt(item?.degreeName) }];
        delete item.degreeName;
        //insert doctor details here
        let result = await dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.DOCTOR).insertOne(item)
        console.log("Result", result.insertedId)
        educationDetails.userId = result?.insertedId?.toString();
        let resultEdu = await dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.DOCTOR_EDUCATION).insertOne(educationDetails)

        data.push({ result, resultEdu })
        //await dbo.db(CONSTANTS.DATABASE.USER_TEST).collection(CONSTANTS.COLLECTIONS.USER).updateOne({ mobileNumber: item.mobileNumber }, { $set: item }, { upsert: true })
      }
      // console.log(data)
      // let insertData = await dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.USER).insertMany(data)
      // mongo.insertMany(CONSTANTS.DATABASE.USER_TEST, CONSTANTS.COLLECTIONS.USER, body)
      // console.log("inserted data", data)
      return success(req, res, 200, data, "Migration Done")
    })

    app.post('/api/v1/migrate/doctor/slots', UTIL.uploadExcel.single('file'), COMMON.excelToJsonMiddleware, async (req, res, next) => {
      // console.log(req.body)
      let body = req.body;
      let data = []
      let i = 0;
      for (let item of body) {
        item.scheduleId = item?.scheduleId?.toString();
        item.startDate = moment(item.startDate, "DD-MM-YYYY").format('YYYY-MM-DD');
        item.endDate = item.startDate;
        item.start = moment(item.start, "HH:mm:ss").format("HH:mm");
        item.end = moment(item.start, "HH:mm").add(15, "minutes").format("HH:mm");;
        if (item.status) {
          if (item.status.toLowerCase() == "free")
            item.status = 'ACTIVE'
          if (item.status.toLowerCase() == "booked")
            item.status = 'CLOSED'
          if (item.status.toLowerCase() == "cancelled")
            item.status = 'CANCELLED'
        }
        item.timingsId = null;
        item.doctorRole = "GP";
        item.speciality = null;
        item.specialityId = null;
        item.createdAt = new Date();
        item.updatedAt = new Date();
        let docId = await dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.DOCTOR).findOne({ doctorDisplayId: item.doctorId.toString() });
        console.log("DocId", docId._id)
        item.doctorId = docId?._id?.toString();
        item.isMigratedData = true;
        data.push(item)
        i++;
        console.log(i)
      }
      let insertData = await dbo.db(CONSTANTS.DATABASE.APPOINTMENT).collection(CONSTANTS.COLLECTIONS.SLOT).insertMany(data)
      return success(req, res, 200, data, "Migration Done")
    })

    app.post('/api/v1/migrate/appointment', UTIL.uploadExcel.single('file'), COMMON.excelToJsonMiddleware, async (req, res, next) => {
      // console.log(req.body)
      let body = req.body;
      let data = []
      let i = 0;
      for (let item of body) {
        item.doctorId = item?.doctorId?.toString();
        item.patientId = item?.patientId?.toString();
        item.slotId = item?.slotId?.toString();
        let [doctorDetails, patientDetails, slotDetails] = await Promise.all([
          dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.DOCTOR).findOne({ doctorDisplayId: item.doctorId }),
          dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.USER).findOne({ patientDisplayId: item.patientId }),
          dbo.db(CONSTANTS.DATABASE.APPOINTMENT).collection(CONSTANTS.COLLECTIONS.SLOT).findOne({ scheduleId: item.slotId })
        ])
        console.log(doctorDetails?._id, patientDetails?._id, slotDetails?._id, slotDetails?.startDate, slotDetails?.start, slotDetails?.end);
        item.doctorId = doctorDetails?._id?.toString();
        item.patientId = patientDetails?._id?.toString();
        item.slotId = slotDetails?._id?.toString();
        item.appointmentId = item?.appointmentId?.toString();
        item.appointmentDate = slotDetails?.startDate || item.appointmentDate;
        item.orderId = item.appointmentId;
        item.patientName = patientDetails?.firstName;
        item.appointmentStartTime = slotDetails?.start;
        if (slotDetails && slotDetails.start && slotDetails.end) {
          console.log("Slotdetails exists")
          if (slotDetails.end == slotDetails.start) {
            console.log("Is equal")
            item.appointmentEndTime = moment(slotDetails.start, "HH:mm").tz('Asia/kolkata').add(15, 'minutes').format("HH:mm")
          } else {
            item.appointmentEndTime = slotDetails.end
          }
        } else {
          item.appointmentEndTime = slotDetails?.end
        }
        // item.appointmentEndTime = slotDetails?.end;
        let appointmentDateTime = moment(`${item.appointmentDate} ${item.appointmentStartTime}`).tz("Asia/kolkata").format("YYYY-MM-DD HH:mm");
        item.appointmentDateTime = +new Date(appointmentDateTime) || null;
        if (item.appointmentStatus) {
          if (item.appointmentStatus.toLowerCase() == "completed") {
            item.appointmentStatus = "COMPLETED"
          }
          if (item.appointmentStatus.toLowerCase() == "booked") {
            item.appointmentStatus = "MISSED"
          }
          if (item.appointmentStatus.toLowerCase() == "pending") {
            item.appointmentStatus = "UPCOMING"
          }
          if (item.appointmentStatus.toLowerCase() == "cancelled") {
            item.appointmentStatus = "CANCELLED"
          }
        }
        item.reason = item?.reason || null;
        item.paymentStatus = 'NA';
        item.isFollowUp = false;
        item.doctorType = "GP";
        item.consultationCharges = 0;
        item.bookingCharges = 0;
        item.tax = 0;
        item.totalCharges = 0;
        item.meetingId = shortid.generate("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
        if (item.source) {
          if (item.source.toLowerCase() == "web") {
            item.source = "WEB"
          } else if (item.source.toLowerCase() == "ivr") {
            item.source = "IVR"
          } else {
            item.source = "UPCOMING"
          }
        }
        if (item.fileName && item?.fileName?.toLowerCase() !== 'null') {
          item.documents = [{
            fileName: item.fileName,
            filePath: item.fileName
          }]

          let documentObj = {
            patientId: patientDetails?._id?.toString(),
            fileType: "reports",
            fileName: item?.fileName,
            filePath: item?.fileName,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          await dbo.db(CONSTANTS.DATABASE.PRESCRIPTION).collection(CONSTANTS.COLLECTIONS.DOCUMENTS).insertOne(documentObj)
        }
        delete item.fileName;
        item.createdAt = new Date(moment(item.createdAt, 'DD-MM-YYYY  HH:mm:ss').tz('Asia/kolkata'));
        item.updatedAt = item.createdAt;
        item.isMigratedData = true;
        data.push(item)
        i++;
        console.log(i)
      }
      let insertData = await dbo.db(CONSTANTS.DATABASE.APPOINTMENT).collection(CONSTANTS.COLLECTIONS.APPOINTMENT).insertMany(data)
      return success(req, res, 200, data, "Migration Done")
    })

    app.get('/api/v1/migrate/appointment/delete', async (req, res, next) => {
      // console.log(req.body)
      let deleteData = await dbo.db(CONSTANTS.DATABASE.APPOINTMENT).collection(CONSTANTS.COLLECTIONS.APPOINTMENT).deleteMany({ isMigratedData: true })
      return success(req, res, 200, deleteData, "Migration Done")
    })

    app.get('/api/v1/migrate/doctor/delete', async (req, res, next) => {
      // console.log(req.body)
      let deleteData = await dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.DOCTOR).deleteMany({ isMigratedData: true })
      return success(req, res, 200, deleteData, "Migration Done")
    })

    app.post('/api/v1/migrate/prescription', UTIL.uploadExcel.single('file'), COMMON.excelToJsonMiddleware, async (req, res, next) => {
      // console.log(req.body)
      let body = req.body;
      let labTest, radiology;
      let data = []
      let i = 0;
      for (let item of body) {
        item.doctorId = item?.doctorId?.toString();
        item.patientId = item?.patientId?.toString();
        item.appointmentId = item?.appointmentId?.toString()
        let [doctorDetails, patientDetails, appointmentDetails] = await Promise.all([
          dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.DOCTOR).findOne({ doctorDisplayId: item.doctorId }),
          dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.USER).findOne({ patientDisplayId: item.patientId }),
          dbo.db(CONSTANTS.DATABASE.APPOINTMENT).collection(CONSTANTS.COLLECTIONS.APPOINTMENT).findOne({ appointmentId: item.appointmentId })
        ])
        let doctorEducation = await dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.DOCTOR_EDUCATION).findOne({ userId: doctorDetails._id.toString() });
        console.log(appointmentDetails)
        item.doctorId = doctorDetails?._id?.toString();
        item.patientId = patientDetails?._id?.toString();
        
        // item.appointmentId = appointmentDetails?.appointmentId?.toString();
        if (item.labTests) {
          labTest = item.labTests
          item.labTests = {
            name: [item.labTests],
            advice: ""
          }
        }

        if (item.radiology) {
          radiology = item.radiology
          item.radiology = {
            name: [item.radiology],
            advice: ""
          }
        }
        item.isFollowUpString = item.isFollowUp;
        item.isFollowUp = item.isFollowUp && item.isFollowUp.toLowerCase() == "no" ? false : true;
        item.files = [];
        item.createdAt = new Date();
        item.updatedAt = item.createdAt;
        item.isMigratedData = true;

        const filePath = path.join(__dirname, '../invoiceTemplates/consultated_online.hbs')
        let readFile = fs.readFileSync(filePath, 'utf8').toString();
        let templateData = {
          ...item,
          appointmentDate: appointmentDetails?.appointmentDate,
          patientName: patientDetails?.firstName,
          maritalStatus: patientDetails?.maritalStatus,
          dob: patientDetails.dob ? UTIL.decrypt(moment(patientDetails.dob, 'YYYY-MM-DD').fromNow().split(' ')[0]) : null,
          doctorName: UTIL.decrypt(doctorDetails?.firstName),
          degreeName: UTIL.decrypt(doctorEducation?.graduationDetails[0]?.degreeName),
          about: doctorDetails?.aboutUser || null,
          medicalRegistrationNo: UTIL.decrypt(doctorEducation?.medicalRegistrationNo),
          labTestsString: item?.labTests?.name?.join(),
          radiologyString: item?.radiology?.name?.join(),
          doctorErx: 'https://meradoc-prod.s3.ap-south-1.amazonaws.com/' + UTIL.decrypt(doctorDetails?.erxSignatureFilePath)
        }
        let template = Handlebars.compile(readFile);
        let uniqueSuffix = "file-" + Date.now() + "-" + Math.round(Math.random() * 1e9) + '.pdf';
        let fileDestination = `../uploads/${uniqueSuffix}`;
        let html = Handlebars.compile(readFile)(templateData);
        let compileResult = template(templateData);
        console.log('This is the compileResult -- ', compileResult);

        const browser = await puppeteer.launch({
          executablePath: process.env.CHROMIUM_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
          javascriptEnabled: true,
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0);
        page.setDefaultTimeout(30000000);
        page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36 WAIT_UNTIL=load"
        );

        await page.setContent(html, {
          timeout: 0,
          waitUntil: "networkidle0",
        })

        const pdf = await page.pdf({
          format: "A3",
          printBackground: true,
          margin: {
            top: "0",
            right: "0",
            bottom: "0",
            left: "0",
          },
        });
        const stream = getStream(pdf);
        stream.pipe(fs.createWriteStream(path.join(__dirname, fileDestination)));
        // let uploadPath = 'D:/Workspace/meradoc/meradoc_appointment'
        setTimeout(() => {
          console.log(path.join(__dirname, fileDestination))
          let params = {
            localFile: path.join(__dirname, fileDestination),
            s3Params: {
              Bucket: process.env.bucketName,
              Key: 'prescriptions' + "/" + uniqueSuffix,
            }
          };

          let uploader = client.uploadFile(params);

          uploader.on('end', function () {
            console.log("Done")
            //fs.unlinkSync(path.join(__dirname, fileDestination.replace("../", "")));
          });
        }, 1000)

        item.prescriptionFileName = UTIL.encrypt(uniqueSuffix);
        item.prescriptionFilePath = UTIL.encrypt('prescriptions' + "/" + uniqueSuffix)

        delete item.isFollowUpString;
        item.chiefComplaints = UTIL.encrypt(item.chiefComplaints);
        item.allergies = UTIL.encrypt(item.allergies);
        item.medHistory = UTIL.encrypt(item.medHistory)
        item.examination = UTIL.encrypt(item.examination)
        item.diagnosis = UTIL.encrypt(item.diagnosis)
        item.additionalAdvice = UTIL.encrypt(item.additionalAdvice)
        item.expectedOutcome = UTIL.encrypt(item.expectedOutcome)
        item.medicinesFromMigratedData = UTIL.encrypt(item.medicinesFromMigratedData)
        if (labTest) {
          item.labTests = {
            name: [UTIL.encrypt(labTest)],
            advice: ""
          }
        }

        if (radiology) {
          item.radiology = {
            name: [UTIL.encrypt(radiology)],
            advice: ""
          }
        }
        let prescriptionData = await dbo.db(CONSTANTS.DATABASE.PRESCRIPTION).collection(CONSTANTS.COLLECTIONS.PRESCRIPTION).insertOne(item);
        //prescriptionData?.insertedId?.toString();
        let documentObj = {
          prescriptionId: prescriptionData?.insertedId?.toString(),
          appointmentId: item?.appointmentId,
          doctorId: item?.doctorId,
          patientId: item?.patientId,
          fileType: "prescriptions",
          fileName: UTIL.decrypt(item?.prescriptionFileName),
          filePath: UTIL.decrypt(item?.prescriptionFilePath)
        }
        await dbo.db(CONSTANTS.DATABASE.PRESCRIPTION).collection(CONSTANTS.COLLECTIONS.DOCUMENTS).insertOne(documentObj)
        data.push(item)
        i++;
        console.log(i)
      }
      // let insertData = await dbo.db(CONSTANTS.DATABASE.APPOINTMENT).collection(CONSTANTS.COLLECTIONS.APPOINTMENT).insertMany(data)
      return success(req, res, 200, data, "Migration Done")
    })

    app.post('/api/v1/migrate/ivr', UTIL.uploadExcel.single('file'), COMMON.excelToJsonMiddleware, async (req, res, next) => {
      // console.log(req.body)
      let body = req.body;
      let data = []
      let i = 0;
      console.log(body)
      for (let item of body) {
        item.isMigratedData = true;
        item.createdAt = +new Date();
        item.updatedAt = item.createdAt;
        item.callFrom = item?.callFrom?.toString();
        item.callTime = item.callTime ? moment(item.callTime, "DD-MM-YYYY  HH:mm:ss").tz('Asia/kolkata').format("YYYY-MM-DD HH:mm:ss") : "0";
        data.push(item)
        i++;
        console.log(i)
      }
      if (data.length)
        await dbo.db(CONSTANTS.DATABASE.MISCELLANEOUS).collection(CONSTANTS.COLLECTIONS.IVR_CALL).insertMany(data)
      return success(req, res, 200, data, "Migration Done")
    })

    app.post('/api/v1/migrate/doctorSupport', UTIL.uploadExcel.single('file'), COMMON.excelToJsonMiddleware, async (req, res, next) => {
      // console.log(req.body)
      let body = req.body;
      let data = []
      let i = 0;
      console.log(body)
      for (let item of body) {
        item.isMigratedData = true;
        item.appointmentId = item?.appointmentId?.toString();
        if (item.status) {
          if (item.status.toLowerCase() == "completed") {
            item.status = "COMPLETED"
          }
        }
        item.adminId = item?.adminId?.toString();
        item.createdAt = item.createdAt ? new Date(moment(item.createdAt, "DD-MM-YYYY  HH:mm:ss").tz('Asia/kolkata')) : +new Date();
        item.updatedAt = item.updatedAt ? new Date(moment(item.updatedAt, "DD-MM-YYYY  HH:mm:ss").tz('Asia/kolkata')) : +new Date();
        data.push(item)
        i++;
        console.log(i)
      }
      if (data.length)
        await dbo.db(CONSTANTS.DATABASE.APPOINTMENT).collection(CONSTANTS.COLLECTIONS.DOCTOR_SUPPORT).insertMany(data)
      return success(req, res, 200, data, "Migration Done")
    })

    app.post('/api/v1/migrate/referral', UTIL.uploadExcel.single('file'), COMMON.excelToJsonMiddleware, async (req, res, next) => {
      // console.log(req.body)
      let body = req.body;
      let data = []
      let i = 0;
      console.log(body)
      for (let item of body) {
        item.isMigratedData = true;
        item.createdAt = item.createdAt ? new Date(moment(item.createdAt, "DD-MM-YYYY  HH:mm:ss").tz('Asia/kolkata')) : +new Date();
        item.updatedAt = item.createdAt;
        data.push(item)
        i++;
        console.log(i)
      }
      if (data.length)
        await dbo.db(CONSTANTS.DATABASE.USER).collection(CONSTANTS.COLLECTIONS.REFERRAL).insertMany(data)
      return success(req, res, 200, data, "Migration Done")
    })

  }
}