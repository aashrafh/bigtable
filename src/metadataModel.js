const mongoose = require("mongoose");

const metadataSchema = new mongoose.Schema({
  firstServer: Object,
  secondServer: Object,
});
module.exports = mongoose.model("metadata", metadataSchema);
