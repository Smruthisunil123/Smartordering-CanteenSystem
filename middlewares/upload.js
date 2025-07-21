const util = require("util");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
require("dotenv").config();

const storage = new GridFsStorage({
  url: process.env.MONGO_URI, // Uses canteenDB from MONGO_URI
  file: (req, file) => {
    const match = ["image/png", "image/jpeg"];

    console.log(file);

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${Date.now()}-myFile-${file.originalname}`;
      return filename;
    }

    console.log(req.user.username);
    const username = req.user.username;
    return {
      bucketName: "MyImagesBucket", // GridFS bucket name
      filename: `${Date.now()}-by-${username}-${file.originalname}`,
    };
  },
});

const uploadFiles = multer({ storage }).array("file", 10);
const uploadFilesMiddleware = util.promisify(uploadFiles);

module.exports = uploadFilesMiddleware;