const mongoose = require("mongoose");
const constants = require("./scripts/constants");
const MovieModel = require("./Movie_model");

mongoose.connect(`${constants.connectionString}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("You'r connected!");
});

MovieModel.collection.deleteMany({ year: { $lt: "2010" } }, function (err) {
  if (err) return console.error(err);
  else console.log("Deleted successfully");
});
