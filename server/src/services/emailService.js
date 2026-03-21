const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOtpEmail = async (to, otp, purpose = "verification") => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`OTP (${purpose}) for ${to}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `Hospital HMS ${purpose} OTP`,
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
  });
};

module.exports = { sendOtpEmail };
