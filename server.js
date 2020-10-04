const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const logger = require("./logger");

const cors = require("cors");

const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URI || "mongodb://localhost/exercise-track");
const userSchema = new mongoose.Schema({
  username: String,
});
const User = mongoose.model("User", userSchema);
const transformUser = (doc, ret) => {
  delete ret.__v;
  return ret;
};

const exerciseSchema = new mongoose.Schema({
  userId: String,
  duration: Number,
  description: String,
  date: Date,
});
const Exercise = mongoose.model("Exercise", exerciseSchema);
const formatDate = (dateTime) => {
  const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${dayOfWeek[dateTime.getDay()]} ${
    month[dateTime.getMonth()]
  } ${dateTime.getDate()} ${dateTime.getYear() + 1900}`;
};
const transformExercise = (doc, ret) => {
  //format date and remove properties
  return {
    duration: ret.duration,
    description: ret.description,
    date: formatDate(ret.date),
  };
};

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.get("/api/exercise/users", async (req, res, next) => {
  try {
    const users = await User.find();
    res.json(users.map((user) => user.toObject({ transform: transformUser })));
  } catch (err) {
    next(err);
  }
});
app.get("/api/exercise/log", async (req, res, next) => {
  let filter = { userId: req.query.userId };
  if (req.query.to && req.query.from) {
    filter.date = {
      $gt: req.query.from,
      $lt: req.query.to,
    };
  }
  const options = req.query.limit ? { limit: parseInt(req.query.limit) } : {};
  try {
    const user = await User.findById(req.query.userId);
    if (user === undefined) {
      res.status(400).send("Invalid userId");
      return;
    }
    const exercises = await Exercise.find(filter, null, options);
    res.json({
      ...user.toObject({ transform: transformUser }),
      count: exercises.length,
      log: exercises.map((exercise) =>
        exercise.toObject({ transform: transformExercise })
      ),
    });
  } catch (err) {
    next(err);
  }
});
app.post("/api/exercise/new-user", async (req, res, next) => {
  try {
    const user = new User({ username: req.body.username });
    const doc = await user.save();
    res.json(doc.toObject({ transform: transformUser }));
  } catch (err) {
    next(err);
  }
});
app.post("/api/exercise/add", async (req, res, next) => {
  try {
    const user = await User.findById(req.body.userId);
    if (user === undefined) {
      res.status(400).send("Invalid userId");
      return;
    }
    const date = req.body.date ? new Date(req.body.date) : new Date();
    const exercise = new Exercise({
      date,
      duration: parseInt(req.body.duration),
      description: req.body.description,
      userId: req.body.userId,
    });
    const doc = await exercise.save();
    res.json({
      ...doc.toObject({ transform: transformExercise }),
      ...user.toObject({ transform: transformUser }),
    });
  } catch (err) {
    next(err);
  }
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

app.post("/api/exercise/new-user", (req, res) => {
  res.json({ username: "testUser", _id: "testId" });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  logger.info("Your app is listening on port " + listener.address().port);
});

module.exports = {
  listener,
  mongoose,
};
