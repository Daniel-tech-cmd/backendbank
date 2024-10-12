const User = require("../models/usermodel");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Passwordrec = require("../models/passwordrec");
const Token = require("../models/token");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
require("dotenv").config();

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "365d" });
};
const generateRandomString = () => {
  const characters = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const randomBuffer = crypto.getRandomValues(new Uint8Array(6));

  const generatedString = Array.from(randomBuffer)
    .map((byte) => characters[byte % characters.length])
    .join("");

  return generatedString.substring(0, 6);
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user;
    try {
      const lowercaseEmail = email.toLowerCase();
      user = await User.login(lowercaseEmail, password);
      if (!user) {
        return res.status(400).json({ error: error.message });
      }
      const dat = await User.findById(user._id);
      if (user && dat.verified == false) {
        const deletetok = await Token.findOneAndDelete({ userId: user._id });
        try {
          const token = await Token.create({
            userId: user._id,
            token: crypto.randomBytes(32).toString("hex"),
            exp: Date.now() + 60 * 60 * 1000,
          });
          const url = `${process.env.BASE_URL}/${user._id}/verify/${token.token}`;
          const html = `<!DOCTYPE html>
          <html lang="en">
          
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                background-color: #f5f5f5;
                text-align: center;
                margin: 0;
                padding: 0;
              }
          
              .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
          
              h1 {
                color: #333;
              }
          
              p {
                color: #666;
                margin-bottom: 20px;
              }
          
              a {
                display: inline-block;
                padding: 10px 20px;
                margin: 10px 0;
                color: #fff;
                text-decoration: none;
                background-color: #3498db;
                border-radius: 5px;
              }
          
              a:hover {
                background-color: #2980b9;
              }
          
              b {
                color: #333;
              }
          
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          
          <body>
            <div class="container">
              <img src="https://peakfund.org/_next/image?url=%2Flogo.png&w=64&q=75" alt="Company Logo">
              <h1>Email Verification</h1>
              <p>Click the link below to verify your email</p>
              <a href="${url}">Verification Link</a>
              <p>The link expires in <b>1 hour</b></p>
            </div>
          </body>
          
          </html>
          `;
          await sendEmail(email, "verify email", url, html);
          return res.status(201).json({
            message:
              "an email has been sent to your email account.kindly verify our identity!",
          });
        } catch (error) {
          return res.status(400).json({ error: "error during verification" });

          // console.log(error)
        }
      }
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const token = createToken(user._id);

    user.token = token;

    return res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const signupUser = async (req, res) => {
  const {
    email,
    password,
    username,
    country,
    number,
    role,
    accountType,
    lastname,
    firstname,
  } = req.body;
  try {
    let photo = await cloudinary.uploader.upload(req.body.photo, {
      folder: "images",
      width: "auto",
      crop: "fit",
    });
    if (photo) {
      uploadedimg = {
        public_id: photo.public_id,
        url: photo.url,
      };
    }
    req.body.photo = photo;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "could not upload image" });
  }

  try {
    let user;
    try {
      const lowercaseEmail = email.toLowerCase();
      req.body.email = lowercaseEmail;
      user = await User.signup(req.body);
      if (user.isnot === true) {
        const deletetok = await Token.findOneAndDelete({ userId: user.id });
        try {
          const token = await Token.create({
            userId: user.id,
            token: crypto.randomBytes(32).toString("hex"),
            exp: Date.now() + 60 * 60 * 1000,
          });
          const url = `${process.env.BASE_URL}/${user.id}/verify/${token.token}`;
          const html = `<!DOCTYPE html>
          <html lang="en">
          
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                background-color: #f5f5f5;
                text-align: center;
                margin: 0;
                padding: 0;
              }
          
              .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
          
              h1 {
                color: #333;
              }
          
              p {
                color: #666;
                margin-bottom: 20px;
              }
          
              a {
                display: inline-block;
                padding: 10px 20px;
                margin: 10px 0;
                color: #fff;
                text-decoration: none;
                background-color: #3498db;
                border-radius: 5px;
              }
          
              a:hover {
                background-color: #2980b9;
              }
          
              b {
                color: #333;
              }
          
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          
          <body>
            <div class="container">
              <img src="https://peakfund.org/_next/image?url=%2Flogo.png&w=64&q=75" alt="Company Logo">
              <h1>Email Verification</h1>
              <p>Click the link below to verify your email</p>
              <a href="${url}">Verification Link</a>
              <p>The link expires in <b>1 hour</b></p>
            </div>
          </body>
          
          </html>
          `;
          await sendEmail(email, "Verify email", url, html);
          return res.status(201).json({
            message:
              "an email has been sent to your email account.kindly verify our identity!",
          });
        } catch (error) {
          return res.status(400).json({ error: "error during verification" });

          // console.log(error)
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(400).json({ error: error.message });
    }
    try {
      if (req.body.refer) {
        const referal = await User.findOne({ username: req.body.refer });
        referal.referals[referal.referals.length] = {
          name: username,
          id: generateRandomString(),
        };
        const updateref = await User.findByIdAndUpdate(
          { _id: referal._id },
          { ...referal },
          { new: false }
        );
      }
    } catch (error) {
      console.log(error);
      return res.status(400);
    }
    try {
      const token = await Token.create({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
        exp: Date.now() + 60 * 60 * 1000,
      });
      const url = `${process.env.BASE_URL}/${user._id}/verify/${token.token}`;
      const html = `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f5f5f5;
            text-align: center;
            margin: 0;
            padding: 0;
          }
      
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
      
          h1 {
            color: #333;
          }
      
          p {
            color: #666;
            margin-bottom: 20px;
          }
      
          a {
            display: inline-block;
            padding: 10px 20px;
            margin: 10px 0;
            color: #fff;
            text-decoration: none;
            background-color: #3498db;
            border-radius: 5px;
          }
      
          a:hover {
            background-color: #2980b9;
          }
      
          b {
            color: #333;
          }
      
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      
      <body>
        <div class="container">
          <img src="https://peakfund.org/_next/image?url=%2Flogo.png&w=64&q=75" alt="Company Logo">
          <h1>Email Verification</h1>
          <p>Click the link below to verify your email</p>
          <a href="${url}">Verification Link</a>
          <p>The link expires in <b>1 hour</b></p>
        </div>
      </body>
      
      </html>
      `;
      await sendEmail(email, "verify email", url, html);
      return res.status(201).json({
        message:
          "an email has been sent to your email account.kindly verify our identity!",
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ error: "error during verification" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifyuser = async (req, res) => {
  const userid = req.params.id;
  const usertoken = req.params.token;
  const user = await User.findById(userid);
  if (!user) {
    return res.status(404).json({ error: "Invalid link" });
  }
  let token;
  try {
    token = await Token.findOne({
      userId: userid,
    });
    if (token?.token !== usertoken) {
      return res.status(404).json({ error: "Invalid link" });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "Invalid link" });
  }

  if (!token) {
    return res.status(404).json({ error: "Invalid link" });
  }
  user.verified = true;
  const user3 = await User.findByIdAndUpdate(
    { _id: userid },
    {
      ...user,
    },
    { new: false }
  );

  await Token.findByIdAndDelete({ _id: token._id });
  const token2 = createToken(user._id);
  let user2 = {};
  try {
    const masteradmin = await User.findOne({ role: "admin" });
    const url = `${user.email} just resgistered`;

    const html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f5f5f5;
          text-align: center;
          margin: 0;
          padding: 0;
        }
    
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
    
        h1 {
          color: #333;
        }
    
        p {
          color: #666;
          margin-bottom: 20px;
        }
    
        a {
          display: inline-block;
          padding: 10px 20px;
          margin: 10px 0;
          color: #fff;
          text-decoration: none;
          background-color: #3498db;
          border-radius: 5px;
        }
    
        a:hover {
          background-color: #2980b9;
        }
    
        b {
          color: #333;
        }
    
        img {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    
    <body>
      <div class="container">
        <img src="https://peakfund.org/_next/image?url=%2Flogo.png&w=64&q=75" alt="Company Logo">
        <h1>Sign up</h1>
        <p>${user.email} just signed up!</p>
        <p>country : ${user.country}</p>
        <p>username : ${user.username}</p>
        <p>number : ${user.number}</p>
      </div>
    </body>
    
    </html>
    `;
    await sendEmail("support@peakfund.org", "Sign Up", url, html);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
  user2._id = user._id;
  user2.token = token2;
  return res.status(200).json(user2);
};

const getOneUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
const getAllUsers = async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.status(200).json(users);
};

const patch2 = async (req, res) => {
  const userid = req.params.id;
  const { data } = req.body;
  try {
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const user2 = await User.findByIdAndUpdate(
      { _id: userid },
      {
        ...req.body,
      },
      { new: false }
    );
    if (!user2) {
      return res.status(404).json({ error: "failed to update" });
    }
    res.status(200).json(user2);
  } catch {}
};
const invest = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const forgetpasswprd = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    try {
      await Passwordrec.findOneAndDelete({ userId: user._id });
      const passwordrec = await Passwordrec.create({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
        exp: Date.now() + 60 * 60 * 1000,
      });
      const url = `${process.env.BASE_URL}/password-reset/${user.id}/${passwordrec.token}`;
      const html = `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Jost', sans-serif;
            background-color: #f5f5f5;
            text-align: center;
            margin: 0;
            padding: 0;
          }
          body *{
            font-family: 'Jost', sans-serif;
          }
      
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
      
          h1 {
            color: #333;
          }
      
          p {
            color: #666;
            margin-bottom: 20px;
          }
      
          .a {
            display: inline-block;
            padding: 10px 20px;
            margin: 10px 0;
            color: #fff;
            text-decoration: none;
            background-color: #3498db;
            border-radius: 5px;
          }
      
          a:hover {
            background-color: #2980b9;
          }
      
          b {
            color: #333;
          }
      
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      
      <body>
        <div class="container">
          <img src="https://peakfund.org/_next/image?url=%2Flogo.png&w=64&q=75" alt="Company Logo">
          <h1>Hello</h1>
          <p>You are receiving this email because we received a password reset request for your account.</p>
          <a href="${url}" class="a">Reset Password</a>
          <p>This password reset link will expire in 60 minutes.</p>

          <p>If you did not request a password reset, no further action is required.</p>
          
          <p>Regards,</p>
          <p>PeakFund</p>
          <div>
          <p>If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:<a href="${url}" >${url}</a></p> </div>
        </div>
      </body>
      
      </html>
      `;
      await sendEmail(email, "Reset Password", url, html);
      return res.status(200).json({
        message:
          "an email has been sent to your email account.kindly verify our identity!",
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ error: "error during verification" });

      // console.log(error)
    }
  } catch (error) {
    return res.status(400).json({ error: "error during verification" });
  }
};

const verifypass = async (req, res) => {
  const { id, token } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ error: "No such user" });
  }

  try {
    const passtok = await Passwordrec.findOne({ userId: id });
    if (!passtok) {
      return res.status(404).json({ error: "Invalid Link" });
    }
    if (passtok.token !== token) {
      return res.status(404).json({ error: "Invalid Link" });
    }
    const del = await Passwordrec.findOneAndDelete({ userId: id });
    res.status(200).json(user.email);
  } catch (error) {
    return res.status(404).json({ error: "Invalid Link" });
  }
};

const changepassword = async (req, res) => {
  const { email, password, id } = req.body;

  const user = await User.findOne({ email: email.trim() });
  if (!user) {
    return res.status(404).json({ error: "User not found!" });
  }
  if (user._id != id) {
    return res.status(404).json({ error: "User not found!" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    user.password = hash;
    const user2 = await User.findByIdAndUpdate(
      { _id: user._id },
      { ...user },
      { new: false }
    );
    const gentok = createToken(user2._id);
    const dat = {
      token: gentok,
      _id: user2._id,
      role: user2.role,
    };
    res.status(200).json(dat);
  } catch (error) {
    return res.status(404).json({ error: "Invalid Link" });
  }
};
module.exports = {
  loginUser,
  changepassword,
  signupUser,
  verifyuser,
  getOneUser,
  patch2,
  invest,
  getAllUsers,
  verifypass,
  forgetpasswprd,
};
