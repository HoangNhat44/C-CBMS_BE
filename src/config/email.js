const nodemailer = require("nodemailer");

function createEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function getEmailFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@cbms.vn";
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
}

module.exports = {
  createEmailTransporter,
  getEmailFromAddress,
  getFrontendUrl,
};
