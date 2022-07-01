const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}-${file.originalname}`
    );
  },
});
const documentFilterForExcel = (req, file, cb) => {
  console.log("Inside document filter");
  if (
    file.mimetype ==
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype == "application/vnd.ms-excel"
  ) {
    console.log("valid extensions");
    cb(null, true);
  } else {
    console.log("Not valid extensions");
    return cb(new Error("Only .xlsx, .xls format allowed!"));
  }
};
var crypto = require("crypto");

const aes256gcm = key => {

  const encrypt = str => {
    const iv = new crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let enc1 = cipher.update(str, 'utf8');
    let enc2 = cipher.final();
    return Buffer.concat([enc1, enc2, iv, cipher.getAuthTag()]).toString("base64");
  };

  const decrypt = enc => {
    enc = Buffer.from(enc, "base64");
    const iv = enc.slice(enc.length - 28, enc.length - 16);
    const tag = enc.slice(enc.length - 16);
    enc = enc.slice(0, enc.length - 28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let str = decipher.update(enc, null, 'utf8');
    str += decipher.final('utf8');
    return str;
  };

  return {
    encrypt,
    decrypt
  };
};

const cipher = aes256gcm(Buffer.alloc(32));

module.exports = {
  uploadExcel: multer({
    storage: storage,
    fileFilter: documentFilterForExcel,
  }),
  encrypt: function encrypt(plainText) {
    if (!plainText) {
      return plainText;
    }
    try {
      var m = crypto.createHash("sha256");
      m.update(process.env.ENCRYPTION_KEY);
      var key = m.digest();
      var iv =
        "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f";
      var cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      var encoded = cipher.update(plainText, "utf8", "hex");
      encoded += cipher.final("hex");
      //console.log("encoded:", encoded);
      return encoded;
    } catch (e) {
      return plainText
    }
  },
  decrypt: function decrypt(encText) {
    //console.log(encText)
    if (!encText) {
      return encText;
    }
    try {
      var m = crypto.createHash("sha256");
      m.update(process.env.ENCRYPTION_KEY);
      var key = m.digest();
      var iv =
        "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f";
      var decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      var decoded = decipher.update(encText, "hex", "utf8");
      decoded += decipher.final("utf8");
      return decoded;
    } catch (e) {
      return encText
    }
  },
};
