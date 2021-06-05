const mongoose = require('mongoose');

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
module.exports =  mongoose.model("IMDbMovies", moviesSchema);
    