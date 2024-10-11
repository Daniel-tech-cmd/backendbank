const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passwordrec = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    token: {
      type: String,
      required: true,
    },

    exp: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Passwordrec", passwordrec);
