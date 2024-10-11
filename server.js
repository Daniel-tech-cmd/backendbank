const express = require("express");
const cron = require("node-cron");
const compression = require("compression");
const app = express();
const { checkprofit } = require("./controllers/transact");
app.use(compression());
const userRoutes = require("./routes/userroutes");
const transact = require("./routes/transactroute");

const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");

cron.schedule("0 * * * *", async () => {
  try {
    checkprofit();
  } catch (error) {
    console.error("Error updating documents:", error);
  }
});
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));

app.use(express.json({ limit: "200mb" }));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

app.use("/api/user", userRoutes);
app.use("/api/transact", transact);

mongoose
  .connect(process.env.STRING)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(
        `connected to db && listening to port ${process.env.PORT}!!!`
      );
    });
  })
  .catch((error) => {
    console.log(error.message);
  });
