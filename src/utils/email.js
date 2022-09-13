/* eslint-disable prefer-arrow-callback */
/* eslint-disable prefer-template */
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "lmht498@gmail.com", //Tài khoản gmail vừa tạo
      pass: "itvmlubrchwbedhm", //Mật khẩu tài khoản gmail vừa tạo
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: "lmht498@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Actually send the email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = sendEmail;
