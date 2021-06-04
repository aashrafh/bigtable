const mongoose = require("mongoose");
const constants = require("../scripts/constants");

const totalTablets = 85800;

function connectDB() {
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
  //   db.imdbmovies.createIndex({ year: 1 }, { background: true });
  return Movie;
}

// Responsible for dividing data tables into tablets.
async function divideTables(Movie) {
  let docs = await Movie.find({}).sort({ year: 1 }).limit(30000);

  const tabletSize = Math.floor(docs.length / 4);
  let rangeKeys = [];
  for (let i = 0; i < 4; i++) {
    rangeKeys.push({
      startYear: docs[i * tabletSize]["year"],
      endYear: docs[(i + 1) * tabletSize - 1]["year"],
    });
  }
  return rangeKeys;
}

let Movie = connectDB();
divideTables(Movie)
  .then((rangeKeys) => {
    console.log(rangeKeys);
  })
  .catch((err) => {
    console.error(err);
  });

// Responsible for assigning tablets to tablet servers
// Metadata table indicating the row key range (start key-end key) for each tablet server.
