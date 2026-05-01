const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",   // ✅ correct
  port: 465,
  secure: true,
  auth: {
    user: "amanpatel64907@gmail.com",
    pass: "vorz qxrw xamj ijsl"
  }
});
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}
const mailOptions = {
   from: "amanpatel64907@gmail.com",
  to: "iitjee2025a@gmail.com",
  subject: "otm generate email",
  text: `OPT FOR PASSWORD RESET IS ${ generateOTP()} `
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) console.log("Error:", err);
  else console.log("Email sent:", info.response);
});

transporter.verify((err, success) => {
  if (err) console.log(err);
  else console.log("Server ready");
});