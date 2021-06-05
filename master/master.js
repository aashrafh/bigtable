const mongoose = require("mongoose");
const constants = require("../scripts/constants");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const { Socket } = require("dgram");
const MovieModel = require('../Movie_model');
const io = new Server(server);

mongoose.connect(`${constants.connectionString}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("You'r connected!");
});

server.listen(3000, () => {
  console.log("Master: listening on *:3000");
});


function metadataDB() {
  const metadataSchema = new mongoose.Schema({
    firstServer: Object,
    secondServer: Object,
  });

  const Metadata = mongoose.model("metadata", metadataSchema);
  return Metadata;
}

/* 
1. Responsible for dividing data tables into tablets.
2. Responsible for assigning tablets to tablet servers 
3. Metadata table indicating the row key range (start key-end key) for each tablet server.
*/
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

function asignServers() {
  let Movie = MovieModel;
  divideTables(Movie)
    .then((rangeKeys) => {
      const metadata = {
        firstServer: {
          setA: {
            startYear: rangeKeys[0].startYear,
            endYear: rangeKeys[0].endYear,
          },
          setB: {
            startYear: rangeKeys[1].startYear,
            endYear: rangeKeys[1].endYear,
          },
          range: {
            startYear: rangeKeys[0].startYear,
            endYear: rangeKeys[1].endYear,
          },
        },
        secondServer: {
          setA: {
            startYear: rangeKeys[2].startYear,
            endYear: rangeKeys[2].endYear,
          },
          setB: {
            startYear: rangeKeys[3].startYear,
            endYear: rangeKeys[3].endYear,
          },
          range: {
            startYear: rangeKeys[2].startYear,
            endYear: rangeKeys[3].endYear,
          },
        },
      };
      metadataTable = metadataDB();
      metadataTable.collection.insertOne(metadata, function (err, metadata) {
        if (err) {
          return console.error(err);
        } else {
          console.log("Metadata inserted successfully");
        }
      });

      io.on("connection", (socket) => {
        socket.on("server connection", (msg) => {
          socket.emit("metadata has written successfully", metadata);
        });
      });
    })
    .catch((err) => {
      console.error(err);
    });
}
asignServers();
