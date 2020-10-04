const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const logger = require("./logger");

const cors = require("cors");

const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URI || "mongodb://localhost/exercise-track");
const userSchema = new mongoose.Schema({
  username: String,
  log: [
    {
      duration: Number,
      description: String,
      date: String,
    },
  ],
});
const User = mongoose.model("User", userSchema);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.get("/api/exercise/users", async (req, res, next) => {
  try {
    res.json(await User.find());
  } catch (err) {
    next(err);
  }
});
app.get("/api/exercise/log", async (req, res, next) => {
  const filter = { _id: req.query.userId };
  try {
    const [user] = await User.find(filter);
    res.json({
      _id: user._id,
      username: user.username,
      count: user.log.length,
      log: user.log,
    });
  } catch (err) {
    next(err);
  }
});
app.post("/api/exercise/new-user", async (req, res, next) => {
  const user = new User({ username: req.body.username });
  try {
    const savedUser = await user.save();
    res.json({
      _id: savedUser._id,
      username: savedUser.username,
    });
  } catch (err) {
    next(err);
  }
});
app.post("/api/exercise/add", async (req, res, next) => {
  const filter = { _id: req.body.userId };
  try {
    const [user] = await User.find(filter);
    if (user === undefined) {
      res.status(400).send("Invalid userId");
      return;
    }

    const exercise = {
      date: req.body.date ? new Date(req.body.date) : Date.now().toString(),
      duration: req.body.duration,
      description: req.body.description,
    };
    const doc = { $push: { log: exercise } };
    await User.update(filter, doc);
    res.json({
      ...exercise,
      _id: user._id,
      username: user.username,
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
