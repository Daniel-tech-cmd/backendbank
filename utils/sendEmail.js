const nodemailer = require("nodemailer");
require("dotenv").config();

module.exports = async (email, subject, url, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.SECURE,

      auth: {
        user: process.env.USER,
        pass: `Daniel650$`,
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      text: url,
      html: html,
    });
  } catch (error) {
    throw Error("Error during verification");
  }
};
