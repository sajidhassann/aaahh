const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'attachments/');
  },
  filename: (req, file, cb) => {
    // const uniqueSuffix = `${Date.now()}.${file.originalname.split('.').pop()}`;
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

module.exports = multer({ storage });
