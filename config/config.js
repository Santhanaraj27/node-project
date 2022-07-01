require('dotenv').config();
module.exports = function (env) {
  const DEV_CONSTANTS = {
    PORT: 2090,
    MONGO_URL: "mongodb+srv://mrmed:mrmed@cluster0.qz1mw.mongodb.net/?retryWrites=true&w=majority",
    // MONGO_URL: "mongodb://localhost:27017/",
    DB_NAME: "imandari",
    KAFKA_URL: "127.0.0.1:9092",
    SECRET_KEY: "imandaridevdb",
    CAPTCHA_VERIFY: process.env.CAPTCHA_VERIFY,
    NODE_ENV: process.env.NODE_ENV,
    BUCKET_NAME: "imandari-image-upload-dev",
    LAB_BUCKET_NAME: "imandari-image-upload-dev",
    END_POINT_URL: "https://apis-dev.mdnius.com"
  };

  const TEST_CONSTANTS = {
    PORT: 2273,
    MONGO_URL: "mongodb+srv://mrmed:mrmed@cluster0.qz1mw.mongodb.net/imandari?retryWrites=true&w=majority",
    DB_NAME: "imandari",
    KAFKA_URL: "13.232.191.159:9092",
    GET_USER_BY_ID: "http://doodlebluelive.com:2275/api/v1/public/getUserById",
    CAPTCHA_VERIFY: process.env.CAPTCHA_VERIFY,
    NODE_ENV: process.env.NODE_ENV,
    BUCKET_NAME: "imandari-image-upload-dev",
    LAB_BUCKET_NAME: "imandari-image-upload-dev",
    END_POINT_URL: "https://apis-dev.mdnius.com"
  };
  const PREPROD_CONSTANTS = {
    PORT: 2004,
    MONGO_URL: process.env.MONGO_URL,
    DB_NAME: process.env.DB_NAME,
    KAFKA_URL: process.env.KAFKA_URL,
    GET_USER_BY_ID: process.env.GET_USER_BY_ID,
    SECRET_KEY: "arn:aws:secretsmanager:ap-south-1:464233631740:secret:meradoc-preprod-db-secret-dwsXgS",
    CAPTCHA_VERIFY: process.env.CAPTCHA_VERIFY,
    NODE_ENV: process.env.NODE_ENV,
    BUCKET_NAME: "imandari-image-upload-prod",
    LAB_BUCKET_NAME: "imandari-lab",
    END_POINT_URL: "https://apis.mdnius.com"
  };
  const PROD_CONSTANTS = {
    PORT: 2004,
    MONGO_URL: process.env.MONGO_URL,
    DB_NAME: process.env.DB_NAME,
    KAFKA_URL: process.env.KAFKA_URL,
    GET_USER_BY_ID: process.env.GET_USER_BY_ID,
    SECRET_KEY: "arn:aws:secretsmanager:ap-south-1:464233631740:secret:meradoc-prod-db-secret-6xSN5t",
    CAPTCHA_VERIFY: process.env.CAPTCHA_VERIFY,
    NODE_ENV: process.env.NODE_ENV,
    BUCKET_NAME: "imandari-image-upload-prod",
    LAB_BUCKET_NAME: "imandari-lab",
    END_POINT_URL: "https://apis.mdnius.com"
  };
  let envType;
  switch (env) {
    case "DEV": envType = DEV_CONSTANTS;
      break;

    case "TEST": envType = TEST_CONSTANTS;
      break;

    case "PROD": envType = PROD_CONSTANTS;
      break;
    case "PREPROD": envType = PREPROD_CONSTANTS;
      break;

    default: envType = { NA: "NA" };
      break;
  }

  return envType;
};
