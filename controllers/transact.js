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
  const { amount, type } = req.body;
  const userId = req.params.id;
  // let lenth = 0
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let reciept;
    try {
      if (req.body.reciept) {
        let photo = await cloudinary.uploader.upload(req.body.reciept, {
          folder: "images",
          width: "auto",
          crop: "fit",
        });
        if (photo) {
          reciept = {
            public_id: photo.public_id,
            url: photo.url,
          };
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "could not upload image" });
    }
    // const deposit = user.deposit;
    user.deposit[user.deposit.length] = {
      amount: amount,
      status: "pending",
      method: method,
      date: Date.now(),
      index: user.deposit.length,
      reciept: reciept,
    };
    user.transaction[user.transaction.length] = {
      text: `deposit of ${amount}`,
      type: "deposit",
      date: Date.now(),
      status: "pending",
    };
    try {
      const masteradmin = await User.findOne({ role: "admin" });
      masteradmin.notifications[masteradmin.notifications.length] = {
        text: `${user.email} deposited $${amount}`,
        type: "deposit",
        date: Date.now(),
        userid: user._id,
        index: user.deposit.length - 1,
        id: generateRandomString(),
        amount: amount,
        reciept: reciept,
      };

      const adminupdate = await User.findByIdAndUpdate(
        { _id: masteradmin._id },
        {
          ...masteradmin,
        },
        { new: false }
      );
      if (!adminupdate) {
        return res.status(404).json({ error: "failed" });
      }
      try {
        const html2 = `<!DOCTYPE html>
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
          <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
            
            <div>
            <p> ${user.email} made a deposit request of ${amount} USD of type ${method} </p>
            <p><b>Details of your Deposit :<b/></p>
            <p>Amount : ${amount} USD
            <p>Charge: 0.0000 USD</p>
            
            
            <p></p>
            </div>
            <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
          </div>
          
        </body>
        
        </html>
        `;
        const url = `
      
        ${user.email} made a deposit request of ${amount} USD via ${method} .
        
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
                <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
                  
                  <div>
                  <p> ${user.email} made a deposit request of ${amount} USD via ${method} </p>
                  <p><b>Details of your Deposit :<b/></p>
                  <p>Amount : ${amount} USD
                  <p>Charge: 0.0000 USD</p>
                  
                  
                  <p></p>
                  <img src='${reciept?.url}' width="200px" height="200px" alt="recipt" >
                  </div>
                  <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
                </div>
                
              </body>
              
              </html>
              `;
        if (req.body.reciept) {
          await sendEmail("support@peakfund.org", "Deposit Request", url, html);
        } else {
          await sendEmail(
            "support@peakfund.org",
            "Deposit Request",
            url,
            html2
          );
        }
      } catch (error) {
        console.log(error);

        return res.status(404).json({ error: "failed to update" });
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
      } catch (error) {
        console.log(error);
        return res.status(404).json({ error: "failed to update" });
      }
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
    try {
      const url = `Hello ${user.username}

          Your deposit request of ${amount} USD via ${method} has been submitted successfully .

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
        <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your deposit request of ${amount} USD  via  ${method} has been submitted successfully .</p>
          <p><b>Details of your Deposit :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
        </div>
        
      </body>
      
      </html>
      `;
      await sendEmail(user.email, "Deposit Request", url, html);
      res.status(200).json(user);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
  } catch (error) {
    console.log(error);
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
        <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your Withdrawal request of ${amount} USD  via  ${method} has been submitted successfully .</p>
          <p><b>Details of your Withdrawal :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
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
      const masteradmin = await User.findOne({ role: "admin" });
      masteradmin.notifications[masteradmin.notifications.length] = {
        text: `${user.email} placed a withdrawal of $${amount}`,
        type: "withdraw",
        date: Date.now(),
        userid: user._id,
        index: user.withdraw.length - 1,
        id: generateRandomString(),
        amount,
      };

      const adminupdate = await User.findByIdAndUpdate(
        { _id: masteradmin._id },
        {
          ...masteradmin,
        },
        { new: false }
      );
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
          <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
            
            <div>
            <p> ${user.email} made a Withdrawal request of ${amount} USD via ${method} </p>
            <p><b>Details of your Withdrawal :<b/></p>
            <p>Amount : ${amount} USD
            <p>Charge: 0.0000 USD</p>
            <p>${method} wallet: ${wallet}</p>

            
            
            <p></p>
            </div>
            <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
          </div>
          
        </body>
        
        </html>
        `;
        await sendEmail(
          "support@peakfund.org",
          "Withdrawal Request",
          url,
          html
        );
      } catch (error) {
        console.log(error);
        return res.status(404).json({ error: "failed to update" });
      }
      if (!adminupdate) {
        return res.status(404).json({ error: "failed" });
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

const approvedeposit = async (req, res) => {
  // const userid = req.params.id;
  const { index, amount, userid, id } = req.body;

  try {
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (
      user.deposit[index].status === "approved" ||
      user.deposit[index].status === "declined"
    ) {
      return res
        .status(404)
        .json({ error: `Request already ${user.deposit[index].status}` });
    }
    // const deposit = user.deposit;
    (user.deposit[index].status = "approved"),
      (user.transaction[user.transaction.length] = {
        text: `deposit of $${amount} approved`,
        type: "deposit",
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
      // admin.notifications.splice(index, 1);
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
        <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your deposit request of ${amount} USD    has been approved .</p>
          <p><b>Details of your Deposit :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
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
};

const declinedepo = async (req, res) => {
  const { id, amount, userid, index } = req.body;

  try {
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (
      user.deposit[index].status === "approved" ||
      user.deposit[index].status === "declined"
    ) {
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
        <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your deposit request of ${amount} USD    has been declined .</p>
          <p><b>Details of your Deposit :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
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
};
const approvewithdraw = async (req, res) => {
  const { id, amount, userid, index } = req.body;

  try {
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (
      user.withdraw[index]?.status === "approved" ||
      user.withdraw[index].status === "declined"
    ) {
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
        <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your withdraw request of ${amount} USD    has been approved .</p>
          <p><b>Details of your withdraw :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
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
};

const declinewith = async (req, res) => {
  const { id, amount, userid, index } = req.body;

  try {
    const user = await User.findById(userid);
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
        <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your withdraw request of ${amount} USD    has been declined .</p>
          <p><b>Details of your withdraw :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
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
                <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
                  
                  <div>

                  <p>${req.body.message}</>
                  <p>Sent by: ${req.body.email}</p>
                  </div>
                  <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
                </div>
                
              </body>
              
              </html>
              `;

      await sendEmail("support@peakfund.org", req.body.subject, url, html);
      res.status(200).json(req.body);
    } catch (error) {
      return res.status(404).json({ error: "an error occured" });
    }
  } catch (error) {
    return res.status(404).json({ error: "an error occured" });
  }
};

const getLoan = async (req, res) => {
  const { amount, type, accountName, accountNumber, bankName, description } =
    req.body;
  const userId = req.params.id;
  // let lenth = 0
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.loan[user.loan.length] = {
      amount: amount,
      status: "pending",
      type: type,
      date: Date.now(),
      index: user.loan.length,
      accountName,
      accountNumber,
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
        text: `${user.email} requested for a ${type} loan of $${amount} `,
        type: "loan",
        date: Date.now(),
        userid: user._id,
        index: user.loan.length - 1,
        id: generateRandomString(),
        amount: amount,
      };

      const adminupdate = await User.findByIdAndUpdate(
        { _id: masteradmin._id },
        {
          ...masteradmin,
        },
        { new: false }
      );
      if (!adminupdate) {
        return res.status(404).json({ error: "failed" });
      }
      try {
        const html2 = `<!DOCTYPE html>
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
          <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
            
            <div>
            <p> ${user.email} requested for a loan of ${amount} USD of type ${type} </p>
       
            
            
            <p></p>
            </div>
            <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
          </div>
          
        </body>
        
        </html>
        `;
        const url = `
      
        ${user.email} requested for a loan of ${amount} USD of type ${type} .
     
        
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
                <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
                  
                  <div>
                  <p> ${user.email} made a deposit request of ${amount} USD of type ${type} </p>
                  <p><b>Details of your Deposit :<b/></p>
                  <p>Amount : ${amount} USD
                  <p>Charge: 0.0000 USD</p>
                  
                  
                  <p></p>
                  <img src='${reciept?.url}' width="200px" height="200px" alt="recipt" >
                  </div>
                  <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
                </div>
                
              </body>
              
              </html>
              `;
        if (req.body.reciept) {
          await sendEmail("support@peakfund.org", "Deposit Request", url, html);
        } else {
          await sendEmail(
            "support@peakfund.org",
            "Deposit Request",
            url,
            html2
          );
        }
      } catch (error) {
        console.log(error);

        return res.status(404).json({ error: "failed to update" });
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
      } catch (error) {
        console.log(error);
        return res.status(404).json({ error: "failed to update" });
      }
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
    try {
      const url = `Hello ${user.username}

          Your deposit request of ${amount} USD of type ${type} has been submitted successfully .

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
        <div class="imgcont"><img src="https://ozfront.vercel.app/_next/image?url=%2Flogo.png&w=96&q=75" alt="Company Logo" ></div>
          
          <div>
          <p>Hello ${user.username}<p>
          <p>Your deposit request of ${amount} USD  of type  ${type} has been submitted successfully .</p>
          <p><b>Details of your Deposit :<b/></p>
          <p>Amount : ${amount} USD
          <p>Charge: 0.0000 USD</p>
          
          
          <p></p>
          </div>
          <footer> &copy; 2024  PeakFund. All rights reserved.<footer>
        </div>
        
      </body>
      
      </html>
      `;
      await sendEmail(user.email, "Deposit Request", url, html);
      res.status(200).json(user);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: "failed to update" });
    }
  } catch (error) {
    console.log(error);
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
  const { accountName, accountNumber, bankName, amount, description } =
    req.body;

  try {
    // Find the user initiating the transfer
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(400).json({ error: `You don't have an account` });
    }

    // Check if the user has sufficient funds
    if (user.balance < amount) {
      return res.status(400).json({ error: `Insufficient funds` });
    }

    // Deduct the amount from the user's balance
    user.balance -= amount;

    // Record the transaction for the sender
    user.transaction.push({
      text: `Transfer of ${amount} to ${accountName} (${accountNumber}) at ${bankName}`,
      type: "transfer",
      date: Date.now(),
      status: "successful",
      description,
    });

    // Find the receiver based on the account number and bank name (for demo purposes)
    const receiver = await User.findOne({ accountNumber, bankName });

    if (!receiver) {
      return res.status(400).json({
        error: `The user with account number '${accountNumber}' at '${bankName}' does not have an account with us!`,
      });
    }

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

    return res.status(200).json({
      message: `Transfer of ${amount} to ${accountName} at ${bankName} was successful`,
      balance: user.balance,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: `Transfer of ${amount} failed` });
  }
};

module.exports = {
  deposit,
  withdraw,
  approvedeposit,
  invest,
  declinedepo,
  checkprofit,
  getLoan,
  localtransfer,
  approvewithdraw,
  declinewith,
  support,
  reinvest,
};
