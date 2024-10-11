const jwt = require("jsonwebtoken");
const User = require("../models/usermodel");
require("dotenv").config();
const auth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "authorization token required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const { _id } = jwt.verify(token, process.env.SECRET);

    req.user = await User.findOne({ _id }).select("_id");

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "request is not authorised" });
  }
};

const isAdmin = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "authorization token required" });
  }
  const token = authorization.split(" ")[1];

  try {
    const { _id } = jwt.verify(token, process.env.SECRET);

    const user = await User.findOne({ _id });

    if (user.role !== "admin") {
      return res.status(401).json({ error: "you are not an admin" });
    }

    req.user = user._id;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "request is not authorised" });
  }
};

module.exports = { auth, isAdmin };
