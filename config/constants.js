module.exports = {
    COLLECTIONS: {
        USER: "users",
        DOCTOR: "doctors",
        DOCTOR_EDUCATION: "doctoreducations",
        DOCTOR_PAYMENTS: "doctor_payments",
        PRESCRIPTION: "prescriptions",
        DIAGNOSTIC: "diagonostics",
        LAB: "labs",
        APPOINTMENT: "appointments",
        APPOINTMENT_SETTING: "appointmentsettings",
        AVAILABILITY: "availabilities",
        SLOT: "slots",
        SPECIALITY: "specialities",
        IVR_CALL: "ivr_calls",
        DOCUMENTS: "documents",
        DOCTOR_SUPPORT: "doctorsupports",
        REFERRAL: "referrals"
    },
    DATABASE: {
        APPOINTMENT: "meradoc_appointment",
        CMS: "meradoc_cms",
        PRESCRIPTION: 'meradoc_prescription',
        USER: "meradoc_user",
        USER_TEST: "meradoc_user_test",
        MISCELLANEOUS: "meradoc_miscellanious"
    },
    USER_TYPE: {
        REGISTERED: "REGISTERED",
        UNREGISTERED: "UNREGISTERED"
    },
    CALL_TYPE: ["MED_LAB", "SUPPORT_EXECUTIVE"],
    STATUS: ["PENDING", "COMPLETED"],
    EXCEL_HEADERS: {
        patient_table: {
            A: "patientDisplayId",
            B: "emailId",
            C: "password",
            D: "firstName",
            E: "dob",
            F: "gender",
            G: "addressDetails",
            H: "mobileNumber",
            I: "maritalStatus",
            J: "createdAt",
            K: "patientType",
            L: "corporateName",
            M: "referralCode",
            N: "isCompletedProfile"
        },
        doctor_table: {
            A: "doctorDisplayId",
            B: "emailId",
            C: "password",
            D: "firstName",
            E: "profileFileName",
            F: "dob",
            G: "mobileNumber",
            H: "gender",
            I: "erxSignatureFileName",
            J: "doctorType",
            K: "degreeName",
            L: "speciality",
            M: "medicalRegistrationNo",
            N: "profileCode",
            O: "exotelNumber",
            P: "createdAt"
        },
        doctor_schedule_table: {
            A: "scheduleId",
            B: "doctorId",
            C: "startDate",
            D: "start",
            E: "status"
        },
        appointment_table: {
            B: "doctorId",
            C: "patientId",
            D: "slotId",
            E: "appointmentId",
            F: "appointmentDate",
            G: "reason",
            H: "fileName",
            I: "createdAt",
            J: "source",
            K: "appointmentStatus"
        },
        prescription_table: {
            B: "appointmentId",
            C: "doctorId",
            D: "patientId",
            E: "allergies",
            F: "cheifComplaints",
            G: "medHistory",
            H: "examination",
            I: "diagnosis",
            J: "labTests",
            K: "radiology",
            L: "additionalAdvice",
            M: "expectedOutcome",
            N: "medicinesFromMigratedData",
            O: "isFollowUp"

        },
        ivr_call: {
            B: "callSid",
            C: "callFrom",
            D: "callTime"
        },
        support_refer: {
            B: "appointmentId",
            C: "doctorComments",
            D: "createdAt",
            E: "status",
            F: "adminComments",
            G: "adminId",
            H: "updatedAt"
        },
        unique_link_table: {
            B: "clientName",
            C: "contactName",
            D: "referralCode",
            F: "createdAt"
        },
    }
};