const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const validator = require("validator");
const { type } = require("os");
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: [true, "username already exists"],
    },
    firstname: {
      type: String,
      // required: true,
    },
    lastname: {
      type: String,
      // required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      // required: [true, "Address is required"],
    },
    accountType: {
      type: String,
      enum: ["fixed", "savings", "joint"],
    },
    gender: {
      type: String,
      enum: ["male", "femail"],
    },

    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "master admin"],
    },

    transaction: [
      {
        text: {
          type: String,
        },
        type: {
          type: String,
        },
        date: {
          type: Date,
        },
        status: {
          type: String,
        },
        id: {
          type: Number,
        },
      },
    ],
    withdraw: [
      {
        amount: {
          type: Number,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "declined"],
        },
        wallet: {
          type: String,
        },
        method: {
          type: String,
        },
        date: {
          type: Date,
        },
        index: {
          type: Number,
        },
        transactid: {
          type: String,
        },
      },
    ],
    deposit: [
      {
        amount: {
          type: Number,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "declined"],
        },
        method: {
          type: String,
        },
        date: {
          type: Date,
        },
        index: {
          type: Number,
        },
        transactid: {
          type: String,
        },
        reciept: {
          url: String,
          public_id: String,
        },
      },
    ],
    loan: [
      {
        amount: {
          type: Number,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "declined"],
        },
        type: {
          type: String,
        },
        date: {
          type: Date,
        },
        index: {
          type: Number,
        },
        transactid: {
          type: String,
        },
        accountName: {
          type: String,
        },
        accountNumber: {
          type: Number,
        },
        bankName: {
          type: String,
        },
        description: {
          type: String,
        },
      },
    ],

    balance: {
      type: Number,
      default: 0.0,
      // required: false,
    },
    country: {
      type: String,
      required: true,
    },

    number: {
      type: String,
      required: true,
    },

    referralBonus: {
      type: Number,
      // required: false,
      default: 0.0,
    },
    referals: [
      {
        name: { type: String },
        id: { type: String },
      },
    ],
    profit: {
      type: Number,
      // required: false,
      default: 0.0,
    },
    minimumWithdrawal: {
      type: Number,
      default: 0.0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    notifications: [
      {
        text: {
          type: String,
        },
        amount: {
          type: Number,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "declined"],
        },
        SSNTIN: {
          type: String,
          required: [true, "SSN is required"],
        },
        DOB: {
          type: Date,
          required: [true, "Date of birth is required"],
        },
        netIncome: {
          type: String,
        },
        description: {
          type: String,
        },
        method: {
          type: String,
          enum: ["crypto", "bank"],
        },
        date: {
          type: Date,
        },
        userid: {
          type: String,
        },
        index: {
          type: Number,
        },
        id: {
          type: String,
        },
        type: {
          type: String,
        },
        reciept: {
          url: String,
          public_id: String,
        },
      },
    ],
    newnotifications: [
      {
        text: {
          type: String,
        },
        amount: {
          type: Number,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "declined"],
        },
        method: {
          type: String,
          enum: ["crypto", "bank"],
        },
        date: {
          type: Date,
        },
        userid: {
          type: String,
        },
        index: {
          type: Number,
        },
        id: {
          type: String,
        },
        type: {
          type: String,
        },
        reciept: {
          url: String,
          public_id: String,
        },
      },
    ],
    totalbalance: {
      type: Number,
    },
    invested: {
      type: Boolean,
      default: false,
    },
    amountinvested: {
      type: Number,
      default: 0,
    },
    zipcode: {
      type: String,
    },
    state: {
      type: String,
    },
    accountNumber: {
      type: Number,
    },
    city: {
      type: String,
    },
    accountName: {
      type: String,
    },
    photo: {
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

userSchema.statics.signup = async function (data) {
  const {
    email,
    password,
    username,
    role,
    country,
    firstname,
    lastname,
    accountType,
    number,
  } = data;
  const emailExists = await this.findOne({ email });
  const userExists = await this.findOne({ username });

  // Validate required fields
  if (!email || !password || !username || !country || !role || !number) {
    throw Error("all fields must be filled!");
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    throw Error("email is not valid!");
  }

  // Check if email is already registered but not verified
  if (emailExists && emailExists.verified === false) {
    return {
      id: emailExists._id,
      isnot: true,
    };
  }

  // Check if email is already in use
  if (emailExists) {
    throw Error("email already in use!");
  }

  // Check if username is already in use
  if (userExists) {
    throw Error("username already in use");
  }

  // Generate a unique 10-digit account number
  let accountNumber;
  let accountNumberExists = true;

  // Keep generating a new account number until a unique one is found
  while (accountNumberExists) {
    accountNumber = Math.floor(1000000000 + Math.random() * 9000000000); // Generates a 10-digit number
    accountNumberExists = await this.findOne({ accountNumber });
    data.accountNumber = accountNumber;
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  data.password = hash;

  const accountName = firstname + " " + lastname;
  data.accountName = accountName;
  // Create a new user with the generated account number
  const user = await this.create({
    ...data,
  });

  return {
    _id: user._id,
    role: user.role,
    accountNumber: user.accountNumber,
  };
};

userSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    throw Error("all fields must be filled!");
  }
  const user = await this.findOne({ email });

  if (!user) {
    throw Error("no such user!");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw Error("incorrect password!");
  }
  const data = {
    _id: user._id,
    role: user.role,
  };
  return data;
};
module.exports = mongoose.model("User", userSchema);
