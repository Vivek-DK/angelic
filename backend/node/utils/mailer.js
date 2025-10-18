// utils/mailer.js
const nodemailer = require("nodemailer");

const mailHost = process.env.MAIL_HOST || "smtp.gmail.com";
const mailPort = parseInt(process.env.MAIL_PORT || "465", 10);
const mailSecure = (process.env.MAIL_SECURE || "true") === "true";

const transporter = nodemailer.createTransport({
  host: mailHost,
  port: mailPort,
  secure: mailSecure,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify once at startup and log result (very helpful)
transporter.verify((err, success) => {
  if (err) {
    console.error("Mail transporter verification FAILED:", err && err.message ? err.message : err);
  } else {
    console.log("Mail transporter verified — ready to send emails");
  }
});

module.exports = transporter;
