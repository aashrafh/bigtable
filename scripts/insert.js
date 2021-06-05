const fs = require("fs");
const mongoose = require("mongoose");
const constants = require("./constants");

let moviesJSON = JSON.parse(fs.readFileSync("../movies.json"));

mongoose.connect(`${constants.connectionString}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("You'r connected!");
});

const moviesSchema = new mongoose.Schema({
  imdb_title_id: String,
  title: String,
  original_title: String,
  year: String,
  date_published: String,
  genre: String,
  duration: Number,
  country: String,
  language: String,
  director: String,
  writer: String,
  production_company: String,
  actors: String,
  description: String,
  avg_vote: Number,
  votes: Number,
  budget: String,
  usa_gross_income: String,
  worlwide_gross_income: String,
  metascore: String,
  reviews_from_users: Number,
  reviews_from_critics: Number,
});

const Movie = mongoose.model("IMDbMovies", moviesSchema);

Movie.collection.insert(moviesJSON, function (err, moviesJSON) {
  if (err) {
    return console.error(err);
  } else {
    console.log("Documents inserted to Collection");
  }
});
