const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const logger = require("./logger");

const cors = require("cors");

const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URI || "mongodb://localhost/exercise-track");

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.get("/api/exercise/users", (req, res) => {
  res.json([]);
});
app.get("/api/exercise/log", (req, res) => {
  res.json({
    _id: req.query.userId,
    username: "TEST_USERNAME",
    count: 2,
    log: [
      {
        description: "TEST_ACTIVITY_1",
        duration: "TEST_DURATION",
        date: Date.now(),
      },
      {
        description: "TEST_ACTIVITY_2",
        duration: "TEST_DURATION",
        date: Date.now(),
      },
    ],
  });
});
app.post("/api/exercise/new-user", (req, res) => {
  res.json({ username: req.body.username, _id: "TEST_ID" });
});
app.post("/api/exercise/add", (req, res) => {
  res.json({
    _id: req.body.userId,
    username: "TEST_USERNAME",
    date: req.body.date || Date.now(),
    duration: req.body.duration,
    description: req.body.description,
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
    logger.info("Mongoose validation error", errMessage);
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
    logger.info(errMessage);
  }
  res.status(errCode).type("txt").send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  logger.info("Your app is listening on port " + listener.address().port);
});

module.exports = {
  listener,
  mongoose,
};
