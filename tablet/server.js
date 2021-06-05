// const mongoose = require("mongoose");
// const constants = require("../scripts/constants");
// const MovieModel = require("../Movie_model");

// const express = require("express");
// const app = express();
// const http = require("http");
// const serverTablet = http.createServer(app);

const masterURL = "http://localhost:8080";
const ioClient = require("socket.io-client");
// const ioServer = require("socket.io")(serverTablet);

// mongoose.connect(`${constants.connectionString}`, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "connection error:"));
// db.once("open", function () {
//   console.log("You'r connected to the database!");
// });

// masterSocket.on("initServer", () => {
//   serverTablet.listen(3000, () => {
//     console.log("Server: listening on *:3000");
//   });
// });

function connectToMaster() {
  const masterSocket = ioClient(masterURL);
  masterSocket.on("connect", () => {
    console.log("Connected to the master");
    masterSocket.on("send-tablets", (tablets) => {
      console.log("Recieved tablets successfully");
    });
  });
}

connectToMaster();
