const User = require("../models/usermodel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const generateRandomString = () => {
  const characters = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const randomBuffer = crypto.getRandomValues(new Uint8Array(6));

  const generatedString = Array.from(randomBuffer)
    .map((byte) => characters[byte % characters.length])
    .join("");

  return generatedString;
};

const deposit = async (req, res) => {
  const { amount, method } = req.body;
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let receipt;
    try {
      if (req.body.receipt) {
        let photo = await cloudinary.uploader.upload(req.body.receipt, {
          folder: "images",
          width: "auto",
          crop: "fit",
        });
        if (photo) {
          receipt = {
            public_id: photo.public_id,
            url: photo.url,
          };
        }
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Could not upload image" });
    }

    user.deposit.push({
      amount: amount,
      status: "pending",
      method: method,
      date: Date.now(),
      index: user.deposit.length,
      userId: user._id,
      receipt: receipt,
    });

    user.transaction.push({
      text: `Deposit of ${amount}`,
      type: "deposit",
      date: Date.now(),
      status: "pending",
    });

    // Notify all master admins
    try {
      const masterAdmins = await User.find({ role: "admin" });
      const notification = {
        text: `${user.email} deposited $${amount}`,
        type: "deposit",
        date: Date.now(),
        userId: user._id,
        index: user.deposit.length - 1,
        id: generateRandomString(),
        amount: amount,
      };

      for (const admin of masterAdmins) {
        await User.findByIdAndUpdate(
          admin._id, // The admin's ID
          { $push: { notifications: notification } }, // Push the notification to the notifications array
          { new: true } // Return the updated document
        );
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to notify admins" });
    }

    // Save user deposit
    try {
      await user.save();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update user deposit" });
    }

    // Send email notifications
    try {
      const emailContent = `
        Hello ${user.username},
        Your deposit request of ${amount} USD via ${method} has been submitted successfully.
        
        Details:
        Amount: ${amount} USD
        Charge: 0.0000 USD
      `;
      const emailHtml = `
        <div>
          <h1>Deposit Request</h1>
          <p>Hello ${user.username},</p>
          <p>Your deposit request of <strong>${amount} USD</strong> via <strong>${method}</strong> has been submitted successfully.</p>
          <p>Details:</p>
          <ul>
            <li>Amount: ${amount} USD</li>
            <li>Charge: 0.0000 USD</li>
          </ul>
        </div>
      `;

      await sendEmail(user.email, "Deposit Request", emailContent, emailHtml);
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Failed to send email notification" });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const withdraw = async (req, res) => {
  const userid = req.params.id;
  const { amount, wallet, password, method } = req.body;
  let userlog;
  try {
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    try {
      userlog = await User.login(user.email, password);
    } catch (error) {
      console.log(error.message);
      return res.status(400).json({ error: error.message });
    }
    if (
      user.balance < amount &&
      user.amountinvested < amount &&
      user.amountinvested + user.balance < amount
    ) {
      return res.status(400).json({ error: "insufficient fund" });
    }
    if (user.minimumWithdrawal && amount < user.minimumWithdrawal) {
      return res.status(400).json({
        error: `minimum withdrawal is ${user.minimumWithdrawal}`,
      });
    }
    user.withdraw[user.withdraw.length] = {
      amount: amount,
      status: "pending",
      date: Date.now(),
      method: method,
      number: user.withdraw.length,
      wallet: wallet,
      index: user.withdraw.length,
    };
    user.transaction[user.transaction.length] = {
      text: `withdrawal of ${amount}`,
      type: "withdraw",
      date: Date.now(),
      status: "pending",
      id: user.transaction.length,
    };
    try {
      const url = `Hello ${user.username}

          Your withdrawal request of ${amount} USD via ${wallet} has been submitted successfully .

          Details of your withdrawal below :

          Amount : ${amount} USD

          Charge: 0.0000 USD

          `;
      const html = `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');
          body {
            font-family: 'Jost', sans-serif;
            text-align: center;
            margin: 0;
            padding:15px;
            background:#1daad9;
          }
      body *{
        font-family:"Jost",arial;
      }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            background:#e5e5e5;
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
            margin:auto;
          }
          .imgcont{
            display:flex;
            justify-content:center;
          }
          footer{
            background:#0066ff;
            color:#fff;
            text-align:center;
            padding:15px 0;
            margin-top:20px;
            height:fit-content;
          }
        </style>
      </head>
      
      <body>
        <div class="container">
      <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
  <span
    style={{
      backgroundClip: "text",
      color: "transparent",
      backgroundImage: "linear-gradient(to right, #3b82f6, #ffffff)",
      WebkitBackgroundClip: "text", // Required for WebKit browsers
      WebkitTextFillColor: "transparent", // Required for WebKit browsers
    }}
  >
    CSureCrest.
  </span>
</div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your Withdrawal request of ${amount} USD  via  ${method} has been submitted successfully .</p>
          <p><b>Details of your Withdrawal :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  capitalsurecrest. All rights reserved.<footer>
        </div>
        
      </body>
      
      </html>
      `;
      await sendEmail(user.email, "Withdrawal Request", url, html);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
    try {
      const masteradmin = await User.find({ role: "admin" });
      const notification = {
        text: `${user.email} placed a withdrawal of $${amount}`,
        type: "withdraw",
        date: Date.now(),
        userId: user._id,
        index: user.withdraw.length - 1,
        id: generateRandomString(),
        amount,
      };

      for (const admin of masteradmin) {
        await User.findByIdAndUpdate(
          admin._id, // The admin's ID
          { $push: { notifications: notification } }, // Push the notification to the notifications array
          { new: true } // Return the updated document
        );
      }

      try {
        const url = `
      
        ${user.email} made a Withdrawa request of ${amount} USD via ${method} .
        
        Details of your Withdrawa :
        
        Amount : ${amount} USD
        
        Charge: 0.0000 USD
        
        `;
        const html = `<!DOCTYPE html>
        <html lang="en">
        
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
          <style>
          @import url('https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');
            body {
              font-family: 'Jost', sans-serif;
              text-align: center;
              margin: 0;
              padding:15px;
              background:#1daad9;
            }
        body *{
          font-family:"Jost",arial;
        }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #fff;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              background:#e5e5e5;
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
              margin:auto;
            }
            .imgcont{
              display:flex;
              justify-content:center;
            }
            footer{
              background:#0066ff;
              color:#fff;
              text-align:center;
              padding:15px 0;
              margin-top:20px;
              height:fit-content;
            }
          </style>
        </head>
        
        <body>
          <div class="container">
        <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
  <span
    style={{
      backgroundClip: "text",
      color: "transparent",
      backgroundImage: "linear-gradient(to right, #3b82f6, #ffffff)",
      WebkitBackgroundClip: "text", // Required for WebKit browsers
      WebkitTextFillColor: "transparent", // Required for WebKit browsers
    }}
  >
    CSureCrest.
  </span>
</div>
            
            <div>
            <p> ${user.email} made a Withdrawal request of ${amount} USD via ${method} </p>
            <p><b>Details of your Withdrawal :<b/></p>
            <p>Amount : ${amount} USD
            <p>Charge: 0.0000 USD</p>
            <p>${method} wallet: ${wallet}</p>

            
            
            <p></p>
            </div>
            <footer> &copy; 2024  capitalsurecrest. All rights reserved.<footer>
          </div>
          
        </body>
        
        </html>
        `;
        await sendEmail(
          "support@capitalsurecrest.com",
          "Withdrawal Request",
          url,
          html
        );
      } catch (error) {
        console.log(error);
        return res.status(404).json({ error: "failed to update" });
      }

      try {
        const user2 = await User.findByIdAndUpdate(
          { _id: userid },
          {
            ...user,
          },
          { new: false }
        );
        if (!user2) {
          return res.status(404).json({ error: "failed to update" });
        }
        res.status(200).json(user2);
      } catch (error) {
        console.log(error);
        return res.status(404).json({ error: "failed to update" });
      }
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "failed to update" });
  }
};

const invest = async (req, res) => {
  const { amount, description } = req.body;
  const userId = req.params.id;
  // let lenth = 0
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.balance < amount) {
      return res.status(404).json({ error: "Insufficient funds!!" });
    }
    user.balance = Number(user.balance) - Number(amount);
    user.amountinvested = Number(user.amountinvested) + Number(amount);
    user.invested = true;
    try {
      const user2 = await User.findByIdAndUpdate(
        { _id: userId },
        {
          ...user,
        },
        { new: false }
      );
      if (!user2) {
        return res.status(404).json({ error: "failed to update" });
      }
      res.status(200).json(user2);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "failed to update" });
  }
};

const compareCode = async (req, res) => {
  const { code } = req.body;
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.code) {
      return res.status(400).json({ error: "No code saved for this user" });
    }

    if (Number(user.code) !== Number(code)) {
      return res.status(400).json({ error: "Code mismatch" });
    }

    // Code matches; delete the code from the database
    user.code = undefined; // Or use `null` depending on your schema preference
    await user.save();

    return res
      .status(200)
      .json({ success: "Code matches and has been deleted" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while verifying the code" });
  }
};

const approvedeposit = async (req, res) => {
  // const userid = req.params.id;
  const { index, amount, userId, id } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      const admins = await User.findById(req.params.id);
      const index = admins.notifications.findIndex(
        (obj) => JSON.stringify(obj) === JSON.stringify(req.body)
      );

      const array = admins.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admins.notifications = array;
      // admin.notifications.splice(index, 1);
      const admin2 = await User.findByIdAndUpdate(
        { _id: admins._id },
        {
          ...admins,
        },
        { new: false }
      );
      return res.status(404).json({ error: "User not found" });
    }
    console.log(user.deposit);
    console.log(index);
    if (!user.deposit[index]) {
      const admins = await User.findById(req.params.id);
      const index = admins.notifications.findIndex(
        (obj) => JSON.stringify(obj) === JSON.stringify(req.body)
      );

      const array = admins.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admins.notifications = array;
      // admin.notifications.splice(index, 1);
      const admin2 = await User.findByIdAndUpdate(
        { _id: admins._id },
        {
          ...admins,
        },
        { new: false }
      );
      return res.status(400).json({ error: "Request Expired" });
    }
    if (
      user.deposit[index].status === "approved" ||
      user.deposit[index].status === "declined"
    ) {
      const status = user.deposit[index].status;
      const admins = await User.findById(req.params.id);

      const array = admins.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admins.notifications = array;
      // admin.notifications.splice(index, 1);
      const admin2 = await User.findByIdAndUpdate(
        { _id: admins._id },
        {
          ...admins,
        },
        { new: false }
      );
      return res.status(404).json({ error: `Request already ${status}` });
    }

    const deposit = user.deposit;
    (user.deposit[index].status = "approved"),
      (user.transaction[user.transaction.length] = {
        text: `deposit of $${amount} approved`,
        type: "deposit",
        date: Date.now(),
        status: "approved",
      });
    try {
      const admins = await User.findById(req.params.id);
      const index = admins.notifications.findIndex(
        (obj) => JSON.stringify(obj) === JSON.stringify(req.body)
      );

      const array = admins.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admins.notifications = array;
      // admin.notifications.splice(index, 1);
      const admin2 = await User.findByIdAndUpdate(
        { _id: admins._id },
        {
          ...admins,
        },
        { new: false }
      );
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "Request already approved" });
    }
    try {
      const url = `Hello ${user.username}

      Your deposit request of ${amount} USD  via  has been approved.

          Details of your Deposit :

          Amount : ${amount} USD

          Charge: 0.0000 USD

          `;
      const html = `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');
          body {
            font-family: 'Jost', sans-serif;
            text-align: center;
            margin: 0;
            padding:15px;
            background:#1daad9;
          }
      body *{
        font-family:"Jost",arial;
      }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            background:#e5e5e5;
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
            margin:auto;
          }
          .imgcont{
            display:flex;
            justify-content:center;
          }
          footer{
            background:#0066ff;
            color:#fff;
            text-align:center;
            padding:15px 0;
            margin-top:20px;
            height:fit-content;
          }
        </style>
      </head>
      
      <body>
        <div class="container">
        <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
  <span
    style={{
      backgroundClip: "text",
      color: "transparent",
      backgroundImage: "linear-gradient(to right, #3b82f6, #ffffff)",
      WebkitBackgroundClip: "text", // Required for WebKit browsers
      WebkitTextFillColor: "transparent", // Required for WebKit browsers
    }}
  >
    CSureCrest.
  </span>
</div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your deposit request of ${amount} USD    has been approved .</p>
          <p><b>Details of your Deposit :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  capitalsurecrest. All rights reserved.<footer>
        </div>
        
      </body>
      
      </html>
      `;
      await sendEmail(user.email, "Deposit Request", url, html);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }

    user.balance = Number(user.balance) + Number(amount);
    try {
      const user2 = await User.findByIdAndUpdate(
        { _id: userId },
        {
          ...user,
        },
        { new: false }
      );
      if (!user2) {
        return res.status(404).json({ error: "failed to update" });
      }
      res.status(200).json(user2);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "failed to update" });
  }
};

const createCode = async (req, res) => {
  const { code } = req.body;
  const userId = req.params.id;

  if (!code || code.length !== 6) {
    return res.status(400).json({ error: "Code must be exactly 6 digits" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Save the code in the database
    user.code = code;

    await user.save();

    res.status(200).json({ success: "Code created successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the code" });
  }
};

const changePin = async (req, res) => {
  const { currentPin, newPin, confirmNewPin } = req.body;
  const userId = req.params.id;

  // Validate inputs
  if (!currentPin || !newPin || !confirmNewPin) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (newPin.length !== 4 || confirmNewPin.length !== 4) {
    return res.status(400).json({ error: "PIN must be exactly 4 digits" });
  }

  if (newPin !== confirmNewPin) {
    return res
      .status(400)
      .json({ error: "New PIN and Confirm PIN must match" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the current PIN matches the one in the database
    if (Number(user.transferPin) !== Number(currentPin)) {
      return res.status(401).json({ error: "Current PIN is incorrect" });
    }

    // Update the PIN
    user.transferPin = newPin;

    await user.save();

    res.status(200).json({ success: "PIN changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while changing the PIN" });
  }
};

const declinedepo = async (req, res) => {
  const { id, amount, userId, index } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (
      user.deposit[index].status === "approved" ||
      user.deposit[index].status === "declined"
    ) {
      const admin = await User.findOne({ role: "admin" });

      const array = admin.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admin.notifications = array;
      const admin2 = await User.findByIdAndUpdate(
        { _id: admin._id },
        {
          ...admin,
        },
        { new: false }
      );
      return res
        .status(404)
        .json({ error: `Request already ${user.deposit[index].status}` });
    }
    // const deposit = user.deposit;
    (user.deposit[index].status = "declined"),
      (user.transaction[user.transaction.length] = {
        text: `deposit of $${amount} declined`,
        type: "deposit",
        date: Date.now(),
        status: "declined",
      });
    try {
      const admin = await User.findOne({ role: "admin" });
      const index = admin.notifications.findIndex(
        (obj) => JSON.stringify(obj) === JSON.stringify(req.body)
      );

      const array = admin.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admin.notifications = array;
      const admin2 = await User.findByIdAndUpdate(
        { _id: admin._id },
        {
          ...admin,
        },
        { new: false }
      );
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "an error was encountered" });
    }
    try {
      const url = `Hello ${user.username}

      Your deposit request of ${amount} USD    has been declined.

          Details of your Deposit :

          Amount : ${amount} USD

          Charge: 0.0000 USD

          `;
      const html = `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');
          body {
            font-family: 'Jost', sans-serif;
            text-align: center;
            margin: 0;
            padding:15px;
            background:#1daad9;
          }
      body *{
        font-family:"Jost",arial;
      }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            background:#e5e5e5;
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
            margin:auto;
          }
          .imgcont{
            display:flex;
            justify-content:center;
          }
          footer{
            background:#0066ff;
            color:#fff;
            text-align:center;
            padding:15px 0;
            margin-top:20px;
            height:fit-content;
          }
        </style>
      </head>
      
      <body>
        <div class="container">
      <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
  <span
    style={{
      backgroundClip: "text",
      color: "transparent",
      backgroundImage: "linear-gradient(to right, #3b82f6, #ffffff)",
      WebkitBackgroundClip: "text", // Required for WebKit browsers
      WebkitTextFillColor: "transparent", // Required for WebKit browsers
    }}
  >
    CSureCrest.
  </span>
</div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your deposit request of ${amount} USD    has been declined .</p>
          <p><b>Details of your Deposit :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  capitalsurecrest. All rights reserved.<footer>
        </div>
        
      </body>
      
      </html>
      `;
      await sendEmail(user.email, "Deposit Request", url, html);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }

    user.balance = Number(user.balance);

    try {
      const user2 = await User.findByIdAndUpdate(
        { _id: userId },
        {
          ...user,
        },
        { new: false }
      );
      if (!user2) {
        return res.status(404).json({ error: "failed to update" });
      }
      res.status(200).json(user2);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "failed to update" });
  }
};
const approvewithdraw = async (req, res) => {
  const { id, amount, userId, index } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      const admins = await User.findById(req.params.id);
      const index = admins.notifications.findIndex(
        (obj) => JSON.stringify(obj) === JSON.stringify(req.body)
      );

      const array = admins.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admins.notifications = array;
      // admin.notifications.splice(index, 1);
      const admin2 = await User.findByIdAndUpdate(
        { _id: admins._id },
        {
          ...admins,
        },
        { new: false }
      );

      return res.status(404).json({ error: "User not found" });
    }
    if (
      user.withdraw[index]?.status === "approved" ||
      user.withdraw[index].status === "declined"
    ) {
      const admins = await User.findById(req.params.id);

      const array = admins.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admins.notifications = array;
      // admin.notifications.splice(index, 1);
      const admin2 = await User.findByIdAndUpdate(
        { _id: admins._id },
        {
          ...admins,
        },
        { new: false }
      );
      return res
        .status(404)
        .json({ error: `Request already ${user.withdraw[index].status}` });
    }
    // const deposit = user.deposit;
    (user.withdraw[index].status = "approved"),
      (user.transaction[user.transaction.length] = {
        text: `withdraw of $${amount} approved`,
        type: "withdraw",
        date: Date.now(),
        status: "approved",
      });
    try {
      const admin = await User.findOne({ role: "admin" });
      const index = admin.notifications.findIndex(
        (obj) => JSON.stringify(obj) === JSON.stringify(req.body)
      );

      const array = admin.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admin.notifications = array;
      const admin2 = await User.findByIdAndUpdate(
        { _id: admin._id },
        {
          ...admin,
        },
        { new: false }
      );
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "Request already approved" });
    }
    try {
      const url = `Hello ${user.username}

      Your withdraw request of ${amount} USD  via  has been approved.

          Details of your withdraw :

          Amount : ${amount} USD

          Charge: 0.0000 USD

          `;
      const html = `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');
          body {
            font-family: 'Jost', sans-serif;
            text-align: center;
            margin: 0;
            padding:15px;
            background:#1daad9;
          }
      body *{
        font-family:"Jost",arial;
      }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            background:#e5e5e5;
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
            margin:auto;
          }
          .imgcont{
            display:flex;
            justify-content:center;
          }
          footer{
            background:#0066ff;
            color:#fff;
            text-align:center;
            padding:15px 0;
            margin-top:20px;
            height:fit-content;
          }
        </style>
      </head>
      
      <body>
        <div class="container">
      <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
  <span
    style={{
      backgroundClip: "text",
      color: "transparent",
      backgroundImage: "linear-gradient(to right, #3b82f6, #ffffff)",
      WebkitBackgroundClip: "text", // Required for WebKit browsers
      WebkitTextFillColor: "transparent", // Required for WebKit browsers
    }}
  >
    CSureCrest.
  </span>
</div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your withdraw request of ${amount} USD    has been approved .</p>
          <p><b>Details of your withdraw :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>capitalsurecrest.com
          </div>
          <footer> &copy; 2024  capitalsurecrest. All rights reserved.<footer>
        </div>
        
      </body>
      
      </html>
      `;
      await sendEmail(user.email, "withdraw Request", url, html);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
    if (user.balance > amount) {
      user.balance = Number(user.balance) - Number(amount);
    } else if (user.profit > amount) {
      user.balance = Number(user.profit) - Number(amount);
    }

    try {
      const user2 = await User.findByIdAndUpdate(
        { _id: userId },
        {
          ...user,
        },
        { new: false }
      );
      if (!user2) {
        return res.status(404).json({ error: "failed to update" });
      }
      res.status(200).json(user2);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "failed to update" });
  }
};

const declinewith = async (req, res) => {
  const { id, amount, userId, index } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (
      user.withdraw[index].status === "approved" ||
      user.withdraw[index].status === "declined"
    ) {
      return res
        .status(404)
        .json({ error: `Request already ${user.withdraw[index].status}` });
    }
    // const deposit = user.deposit;
    (user.withdraw[index].status = "declined"),
      (user.transaction[user.transaction.length] = {
        text: `withdraw of $${amount} declined`,
        type: "withdraw",
        date: Date.now(),
        status: "declined",
      });
    try {
      const admin = await User.findOne({ role: "admin" });
      const index = admin.notifications.findIndex(
        (obj) => JSON.stringify(obj) === JSON.stringify(req.body)
      );

      const array = admin.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admin.notifications = array;
      const admin2 = await User.findByIdAndUpdate(
        { _id: admin._id },
        {
          ...admin,
        },
        { new: false }
      );
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "an error was encountered" });
    }
    try {
      const url = `Hello ${user.username}

      Your withdraw request of ${amount} USD    has been declined.

          Details of your withdraw :

          Amount : ${amount} USD

          Charge: 0.0000 USD

          `;
      const html = `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');
          body {
            font-family: 'Jost', sans-serif;
            text-align: center;
            margin: 0;
            padding:15px;
            background:#1daad9;
          }
      body *{
        font-family:"Jost",arial;
      }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            background:#e5e5e5;
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
            margin:auto;
          }
          .imgcont{
            display:flex;
            justify-content:center;
          }
          footer{
            background:#0066ff;
            color:#fff;
            text-align:center;
            padding:15px 0;
            margin-top:20px;
            height:fit-content;
          }
        </style>
      </head>
      
      <body>
        <div class="container">
      <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
  <span
    style={{
      backgroundClip: "text",
      color: "transparent",
      backgroundImage: "linear-gradient(to right, #3b82f6, #ffffff)",
      WebkitBackgroundClip: "text", // Required for WebKit browsers
      WebkitTextFillColor: "transparent", // Required for WebKit browsers
    }}
  >
    CSureCrest.
  </span>
</div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your withdraw request of ${amount} USD    has been declined .</p>
          <p><b>Details of your withdraw :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  capitalsurecrest. All rights reserved.<footer>
        </div>
        
      </body>
      
      </html>
      `;
      await sendEmail(user.email, "withdraw Request", url, html);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }

    user.balance = Number(user.balance);

    try {
      const user2 = await User.findByIdAndUpdate(
        { _id: userId },
        {
          ...user,
        },
        { new: false }
      );
      if (!user2) {
        return res.status(404).json({ error: "failed to update" });
      }
      res.status(200).json(user2);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "failed to update" });
  }
};

const checkprofit = async () => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });

    for (const user of users) {
      let profit = 0;

      switch (user.invested) {
        case true:
          profit = user.amountinvested * 0.00125;

          break;
        case false:
          profit = profit;
          break;
        default:
          break;
      }

      user.profit = Number(user.profit) + Number(profit);
      user.balance = Number(user.balance) + Number(profit);

      await User.findByIdAndUpdate(
        { _id: user._id },
        {
          ...user,
        },
        { new: false }
      );
    }
  } catch (error) {
    console.error("Error in checkprofit:", error);
  }
};
const support = async (req, res) => {
  try {
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(404).json({ error: "User not found" });
    }
    try {
      const url = `
      ${req.body.subject}
${req.body.message}
from ${req.body.email}
      `;
      const html = `<!DOCTYPE html>
              <html lang="en">
              
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
                <style>
                @import url('https://fonts.googleapis.com/css2?family=Henny+Penny&family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');
                  body {
                    font-family: 'Jost', sans-serif;
                    text-align: center;
                    margin: 0;
                    padding:15px;
                    background:#1daad9;
                  }
              body *{
                font-family:"Jost",arial;
              }
                  .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background:#e5e5e5;
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
                    margin:auto;
                  }
                  .imgcont{
                    display:flex;
                    justify-content:center;
                  }
                  footer{
                    background:#0066ff;
                    color:#fff;
                    text-align:center;
                    padding:15px 0;
                    margin-top:20px;
                    height:fit-content;
                  }
                </style>
              </head>
              
              <body>
                <div class="container">
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
  <span
    style={{
      backgroundClip: "text",
      color: "transparent",
      backgroundImage: "linear-gradient(to right, #3b82f6, #ffffff)",
      WebkitBackgroundClip: "text", // Required for WebKit browsers
      WebkitTextFillColor: "transparent", // Required for WebKit browsers
    }}
  >
    CSureCrest.
  </span>
</div>
                  
                  <div>

                  <p>${req.body.message}</>
                  <p>Sent by: ${req.body.email}</p>
                  </div>
                  <footer> &copy; 2024  capitalsurecrest. All rights reserved.<footer>
                </div>
                
              </body>
              
              </html>
              `;

      await sendEmail(
        "support@capitalsurecrest.com",
        req.body.subject,
        url,
        html
      );
      res.status(200).json(req.body);
    } catch (error) {
      return res.status(404).json({ error: "an error occured" });
    }
  } catch (error) {
    return res.status(404).json({ error: "an error occured" });
  }
};

const getLoan = async (req, res) => {
  const {
    amount,
    type,
    accountName,
    accountNumber,
    bankName,
    description,
    netIncome,
    transferPin,
  } = req.body; // Include transferPin in the request body
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Handle transferPin logic
    if (user.transferPin) {
      // If transferPin exists in the DB, validate it
      if (Number(user.transferPin) !== Number(transferPin)) {
        return res.status(400).json({ error: "Invalid transfer PIN" });
      }
    } else {
      // If no transferPin is set, save the provided transferPin
      user.transferPin = transferPin;
      await user.save(); // Save the updated user
    }

    // Add loan request
    user.loan[user.loan.length] = {
      amount: amount,
      status: "pending",
      type: type,
      date: Date.now(),
      index: user.loan.length,
      accountName,
      accountNumber,
      netIncome,
      bankName,
      description,
    };

    user.transaction[user.transaction.length] = {
      text: `Loan of ${amount}`,
      type: "loan",
      date: Date.now(),
      status: "pending",
    };

    try {
      const masteradmin = await User.findOne({ role: "admin" });
      masteradmin.notifications[masteradmin.notifications.length] = {
        text: `${user.email} requested for a ${type} loan of $${amount}`,
        type: "loan",
        date: Date.now(),
        userid: user._id,
        index: user.loan.length - 1,
        description,
        netIncome,
        id: generateRandomString(),
        amount: amount,
      };

      masteradmin.newnotifications[masteradmin.newnotifications.length] = {
        text: `${user.email} requested for a ${type} loan of $${amount}`,
        type: "loan",
        date: Date.now(),
        userid: user._id,
        index: user.loan.length - 1,
        description,
        netIncome,
        id: generateRandomString(),
        amount: amount,
      };

      const adminupdate = await User.findByIdAndUpdate(
        masteradmin._id,
        { ...masteradmin },
        { new: false }
      );
      if (!adminupdate) {
        return res.status(404).json({ error: "Failed to update admin" });
      }

      // Send email notifications
      const emailBody = `
        Hello ${user.username},

        Your loan request of ${amount} USD of type ${type} has been submitted successfully.

        Loan Details:
        Amount: ${amount} USD
        Type: ${type}
        Description: ${description}
      `;
      const htmlContent = `
        <p>Hello ${user.username},</p>
        <p>Your loan request of <strong>${amount} USD</strong> of type <strong>${type}</strong> has been submitted successfully.</p>
        <p><strong>Loan Details:</strong></p>
        <p>Amount: ${amount} USD</p>
        <p>Type: ${type}</p>
        <p>Description: ${description}</p>
      `;

      await sendEmail(
        user.email,
        "Loan Request Submitted",
        emailBody,
        htmlContent
      );
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Failed to notify admin" });
    }

    await user.save(); // Save user's updated loan and transaction data
    return res
      .status(200)
      .json({ message: "Loan request submitted successfully", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to process loan request" });
  }
};

const reinvest = async (req, res) => {
  const { amount } = req.body;
  const userId = req.params.id;
  // let lenth = 0
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.profit < amount) {
      return res.status(404).json({ error: "Insufficient funds!!" });
    }
    user.profit = Number(user.profit) - amount;
    user.amountinvested = Number(user.amountinvested) + Number(amount);
    try {
      const user2 = await User.findByIdAndUpdate(
        { _id: userId },
        {
          ...user,
        },
        { new: false }
      );
      if (!user2) {
        return res.status(404).json({ error: "failed to update" });
      }
      res.status(200).json(user2);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "failed to update" });
  }
};

const localtransfer = async (req, res) => {
  const userid = req.params.id;
  const { accountName, accountNumber, amount, description, transferPin } =
    req.body;

  try {
    // Find the user initiating the transfer
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(400).json({ error: `You don't have an account` });
    }

    // Check if the user has a transferPin
    if (user.transferPin) {
      if (Number(user.transferPin) !== Number(transferPin)) {
        return res.status(400).json({ error: "Invalid transfer PIN" });
      }
    } else {
      user.transferPin = transferPin;
      await user.save();
    }

    // Check if the user has sufficient funds
    if (user.balance < amount) {
      return res.status(400).json({ error: `Insufficient funds` });
    }

    const receiver = await User.findOne({
      accountNumber,
      accountName: { $regex: new RegExp(`^${accountName}$`, "i") },
    });

    if (!receiver) {
      return res.status(400).json({
        error: `The user with account number '${accountNumber}' and account name '${accountName}' does not have an account with us!`,
      });
    }

    if (receiver.accountName === user.accountName) {
      return res
        .status(400)
        .json({ error: "You can't make transfer to yourself!" });
    }

    // Deduct the amount from the user's balance
    user.balance -= amount;

    // Record the transaction for the sender
    user.transaction.push({
      text: `Transfer of ${amount} to ${accountName} (${accountNumber})`,
      type: "transfer",
      date: Date.now(),
      status: "successful",
      description,
    });

    // Credit the receiver's account
    receiver.balance = Number(receiver.balance) + Number(amount);

    // Record the transaction for the receiver
    receiver.transaction.push({
      text: `Received ${amount} from ${user.email}`,
      type: "credit",
      date: Date.now(),
      status: "successful",
      description,
    });

    // Add a notification for the receiver
    receiver.notifications.push({
      text: `${user.email} sent you ${amount}`,
      type: "credit",
      date: Date.now(),
    });
    receiver.newnotifications.push({
      text: `${user.email} sent you ${amount}`,
      type: "credit",
      date: Date.now(),
    });

    // Update both sender and receiver in the database
    await user.save();
    await receiver.save();

    // Prepare email bodies
    const senderEmailBody = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #fff;
              border: 1px solid #ddd;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background-color: #0047ab;
              color: #fff;
              padding: 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 20px;
              font-size: 16px;
              line-height: 1.5;
            }
            .footer {
              background-color: #f1f1f1;
              padding: 10px 20px;
              font-size: 14px;
              text-align: center;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Capital Surecrest</h1>
            </div>
            <div class="content">
              <p>Dear ${user.username},</p>
              <p>Your transfer of $${amount} to ${accountName} (${accountNumber}) was successful.</p>
              <p>Thank you for choosing Capital Surecrest.</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Capital Surecrest. All rights reserved.
              <br />
              Visit us at <a href="https://capitalsurecrest.com">capitalsurecrest.com</a>
            </div>
          </div>
        </body>
      </html>
    `;

    const receiverEmailBody = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #fff;
              border: 1px solid #ddd;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background-color: #0047ab;
              color: #fff;
              padding: 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 20px;
              font-size: 16px;
              line-height: 1.5;
            }
            .footer {
              background-color: #f1f1f1;
              padding: 10px 20px;
              font-size: 14px;
              text-align: center;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Capital Surecrest</h1>
            </div>
            <div class="content">
              <p>Dear ${receiver.username},</p>
              <p>You have received $${amount} from ${user.email}.</p>
              <p>Thank you for choosing Capital Surecrest.</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Capital Surecrest. All rights reserved.
              <br />
              Visit us at <a href="https://capitalsurecrest.com">capitalsurecrest.com</a>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails
    await sendEmail(
      user.email,
      "Transfer Successful",
      "Transfer Notification",
      senderEmailBody
    );
    await sendEmail(
      receiver.email,
      "Credit Alert",
      "Credit Notification",
      receiverEmailBody
    );

    return res.status(200).json({
      message: `Transfer of ${amount} to ${accountName} was successful`,
      balance: user.balance,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: `Transfer of ${amount} failed` });
  }
};

const approveLoan = async (req, res) => {
  const { index, amount, userid, id } = req.body;

  try {
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the loan request is already approved or declined
    if (
      user.loan[index].status === "approved" ||
      user.loan[index].status === "declined"
    ) {
      return res
        .status(400)
        .json({ error: `Loan request already ${user.loan[index].status}` });
    }

    // Update the loan status to approved
    user.loan[index].status = "approved";

    // Add the approved amount to the user's balance
    user.balance = Number(user.balance) + Number(amount);

    // Log the transaction for the approved loan
    user.transaction[user.transaction.length] = {
      text: `Loan of $${amount} approved`,
      type: "loan",
      date: Date.now(),
      status: "approved",
    };

    try {
      // Update the admin's notifications by removing the request notification
      const admin = await User.findOne({ role: "admin" });
      const updatedNotifications = admin.notifications.filter(
        (item) => item.id !== req.body.id
      );
      admin.notifications = updatedNotifications;

      // Add the loan approval notification to the user's new notifications
      user.newnotifications[user.newnotifications.length] = {
        text: `Your loan of $${amount} has been approved.`,
        type: "loan",
        date: Date.now(),
        id: generateRandomString(),
        amount,
      };

      // Update the admin record with the new notifications
      await User.findByIdAndUpdate(
        { _id: admin._id },
        {
          ...admin,
        },
        { new: false }
      );
    } catch (error) {
      console.error("Error updating admin notifications:", error);
      return res
        .status(500)
        .json({ error: "Failed to update admin notifications" });
    }

    try {
      // Prepare the email content for the user
      const emailContent = `Hello ${user.username},

      Your loan request of $${amount} has been approved.

      Details of your Loan:
      Amount: $${amount}

      Best regards,
      capitalsurecrest Team`;

      const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Jost', sans-serif;
            background: #1daad9;
            text-align: center;
            padding: 20px;
          }
          .container {
            background: #e5e5e5;
            border-radius: 10px;
            max-width: 600px;
            margin: auto;
            padding: 20px;
          }
          .header {
            font-size: 24px;
            color: #333;
          }
          .message {
            color: #666;
            margin: 20px 0;
          }
          .footer {
            background: #0066ff;
            color: #fff;
            padding: 10px;
            border-radius: 0 0 10px 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Loan Approval</div>
          <p class="message">Hello ${user.username},</p>
          <p class="message">Your loan request of $${amount} has been approved.</p>
          <p class="message"><b>Amount:</b> $${amount}</p>
          <div class="footer">&copy; 2024 capitalsurecrest. All rights reserved.</div>
        </div>
      </body>
      </html>
      `;

      await sendEmail(
        user.email,
        "Loan Approval Notification",
        emailContent,
        emailHtml
      );
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }

    try {
      // Update the user with the new balance and loan status
      const updatedUser = await User.findByIdAndUpdate(
        { _id: userid },
        {
          ...user,
        },
        { new: false }
      );

      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user" });
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  } catch (error) {
    console.error("Error processing loan approval:", error);
    return res.status(500).json({ error: "Failed to process loan approval" });
  }
};

const internationalTransfer = async (req, res) => {
  const userid = req.params.id;
  const {
    accountName,
    accountNumber,
    bankName,
    bankAddress,
    swiftCode,
    routingNumber,
    country,
    amount,
    description,
    currency,
    transferReason,
    additionalInfo,
    transferPin,
  } = req.body;
  try {
    // Find the user initiating the transfer
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(400).json({ error: "You don't have an account" });
    }

    // Check if the transfer PIN is set in the database
    if (user.transferPin) {
      // Compare the provided PIN with the stored PIN
      if (Number(user.transferPin) !== Number(transferPin)) {
        console.log(user.transferPin, transferPin);
        return res.status(400).json({ error: "Invalid transfer PIN" });
      }
    } else {
      // If no transfer PIN exists, save the provided PIN
      if (!transferPin || transferPin.toString().length !== 4) {
        return res.status(400).json({
          error: "Please provide a valid 4-digit transfer PIN to set",
        });
      }
      user.transferPin = transferPin;
      await user.save();
      return res.status(200).json({
        message: "Transfer PIN set successfully. Please retry your transfer.",
      });
    }

    // Check if the user has sufficient funds
    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // Validate the amount (must be positive)
    if (amount <= 0) {
      return res.status(400).json({ error: "Invalid transfer amount" });
    }

    // Simulate finding the receiver (assuming international transfers require bank and SWIFT verification)
    // const receiver = await ExternalBank.findOne({
    //   accountNumber,
    //   accountName,
    //   bankName,
    //   swiftCode,
    // });

    // if (!receiver) {
    //   return res.status(400).json({
    //     error: `No account found with the provided details in ${bankName}, ${country}`,
    //   });
    // }

    // Deduct the amount from the sender's account
    user.balance -= amount;

    // Record the transaction for the sender
    user.transaction.push({
      text: `International transfer of ${amount} ${currency} to ${accountName} (${accountNumber}) at ${bankName}, ${country}`,
      type: "international_transfer",
      date: Date.now(),
      status: "successful",
      description,
      transferReason,
      additionalInfo,
    });

    // Update the sender's account
    await user.save();

    try {
      const masterAdmins = await User.find({ role: "admin" });
      const notification = {
        text: `${user.email} transferred $${amount} to ${accountName} (${accountNumber}) at ${bankName}, ${country}`,
        type: "deposit",
        date: Date.now(),
        userId: user._id,
        index: user.deposit.length - 1,
        id: generateRandomString(),
        amount: amount,
      };

      for (const admin of masterAdmins) {
        await User.findByIdAndUpdate(
          admin._id, // The admin's ID
          { $push: { notifications: notification } }, // Push the notification to the notifications array
          { new: true } // Return the updated document
        );
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to notify admins" });
    }

    // Simulate sending data to the receiver's bank
    console.log("Sending transfer details to external bank...");

    // Return success response
    return res.status(200).json({
      message: `International transfer of ${currency}${amount}  to ${accountName} at ${bankName}, ${country} was successful`,
      balance: user.balance,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "International transfer failed" });
  }
};

const forgotPin = async (req, res) => {
  const { id } = req.params; // Extract user ID from request parameters

  try {
    // Find the user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Save the token and expiration date to the user's account
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Generate the reset link
    const resetLink = `${process.env.BASE_URL}/reset-pin/${user._id}/${token}`;

    const emailBody = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f9f9f9;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background-color: #0047ab;
                color: #fff;
                padding: 20px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                padding: 20px;
                font-size: 16px;
                line-height: 1.5;
              }
              .content a {
                color: #0047ab;
                text-decoration: none;
                font-weight: bold;
              }
              .content a:hover {
                text-decoration: underline;
              }
              .button-container {
                text-align: center;
                margin: 20px 0;
              }
              .reset-button {
                background-color: #0047ab;
                color: #fff;
                padding: 10px 20px;
                text-decoration: none;
                font-size: 16px;
                border-radius: 5px;
                display: inline-block;
                text-decoration: none
              }
                a{
                color:#fff;
                }
              .reset-button:hover {
                background-color: #003380;
              }
              .footer {
                background-color: #f1f1f1;
                padding: 10px 20px;
                font-size: 14px;
                text-align: center;
                color: #555;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Capital Surecrest</h1>
              </div>
              <div class="content">
                <p>Dear ${user.username},</p>
                <p>
                  We received a request to reset your transfer PIN for your account with Capital Surecrest. If you initiated this request, please click the button below to set up a new transfer PIN:
                </p>
                <div class="button-container">
                  <a href="${resetLink}" class="reset-button">Reset PIN</a>
                </div>
                <p>
                  Alternatively, you can copy and paste the following link into your browser:
                  <br />
                  <a href="${resetLink}">${resetLink}</a>
                </p>
                <p>
                  If you did not request a PIN reset, please ignore this email or contact our support team immediately.
                </p>
                <p>
                  Thank you for choosing Capital Surecrest for your financial needs.
                </p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Capital Surecrest. All rights reserved.
                <br />
                Visit us at <a href="https://capitalsurecrest.com">capitalsurecrest.com</a>
              </div>
            </div>
          </body>
        </html>
      `;

    await sendEmail(user.email, "Reset Transfer Pin", "Pin Reset", emailBody);

    res.status(200).json({ success: "Reset link sent to your email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

const validateResetToken = async (req, res) => {
  const { id, token } = req.params;

  try {
    // Validate the input
    if (!id || !token) {
      return res.status(400).json({ error: "ID and token are required." });
    }

    // Fetch the user from the database
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if the token matches
    if (user.resetToken !== token) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    // Optionally, check if the token has expired
    if (user.resetTokenExpires && Date.now() > user.resetTokenExpires) {
      return res.status(400).json({ error: "Reset token has expired." });
    }

    // If valid, return success
    return res
      .status(200)
      .json({ success: "Token is valid. Proceed with reset." });
  } catch (error) {
    console.error("Error validating token:", error);
    return res.status(500).json({
      error: "An error occurred while validating the reset token.",
    });
  }
};

const updateUserCardInfo = async (req, res) => {
  const userid = req.params.id;
  const { cardNumber, ccv, cardType, name, expiry, valid } = req.body; // Assuming the necessary fields in the request body

  try {
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add the new card to the user's cards array
    const updatedUser = await User.findByIdAndUpdate(
      { _id: userid },
      {
        $push: {
          card: {
            // Assuming 'card' is an array in the user model
            cardNumber,
            ccv,
            cardType,
            expiry,
            valid,
            name,
            createdAt: new Date(), // Optionally, track when the card was added
          },
        },
      },
      { new: true } // Return the updated user
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ error: "Failed to update card information" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while updating card information" });
  }
};

module.exports = {
  deposit,
  withdraw,
  approveLoan,
  approvedeposit,
  changePin,
  updateUserCardInfo,
  invest,
  validateResetToken,
  createCode,
  declinedepo,
  compareCode,
  checkprofit,
  getLoan,
  localtransfer,
  approvewithdraw,
  internationalTransfer,
  declinewith,
  support,
  forgotPin,
  reinvest,
};
