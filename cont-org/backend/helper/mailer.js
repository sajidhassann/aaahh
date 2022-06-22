const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  port: 465,
  host: 'smtp.gmail.com',
  auth: {
    user: 'socilianet@gmail.com',
    pass: 'ajepovuqgztywvul',
  },
  tls: {
    rejectUnauthorized: false,
  },
  secure: true, // upgrades later with STARTTLS -- change this based on the PORT
});
const sendMail = (mailData) =>
  new Promise((res, rej) =>
    transporter.sendMail(mailData, (error, info) => {
      if (error) {
        rej(error);
      } else {
        res(info);
      }
    })
  );
module.exports = sendMail;
