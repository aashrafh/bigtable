const mongoose = require("mongoose");
const constants = require("../scripts/constants");
const MovieModel = require("../Movie_model");

const express = require("express");
const app = express();
const http = require("http");
const master = http.createServer(app);

let metadata = {};
let tablets = [];
let servers = [];
// let clients = [];

mongoose.connect(`${constants.connectionString}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("You'r connected to the database!");
});

function metadataDB() {
  const metadataSchema = new mongoose.Schema({
    firstServer: Object,
    secondServer: Object,
  });

  const Metadata = mongoose.model("metadata", metadataSchema);
  return Metadata;
}

async function divideTables(Movie) {
  tablets = await Movie.find({}).sort({ year: 1 }).limit(100);

  const tabletSize = Math.floor(tablets.length / 4);
  let rangeKeys = [];
  for (let i = 0; i < 4; i++) {
    rangeKeys.push({
      startYear: tablets[i * tabletSize]["year"],
      endYear: tablets[(i + 1) * tabletSize - 1]["year"],
    });
  }
  return rangeKeys;
}

// async function metaToClients(meta) {
//   for (let i = 0; i < clients.length; i++) {
//     clients[i].emit("send-meta", meta);
//   }
// }

async function tabletsToServers(meta) {
  for (let i = 0; i < servers.length; i++) {
    servers[i].emit(
      "send-tablets",
      tablets.slice(
        i * Math.floor(tablets.length / 2),
        (i + 1) * Math.floor(tablets.length / 2)
      )
    );
    console.log("Emitting the tablets");
  }
}

function buildMeta(rangeKeys) {
  return {
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
}

async function asignServers() {
  const Movie = MovieModel;
  divideTables(Movie)
    .then((rangeKeys) => {
      metadata = buildMeta(rangeKeys);
      metadataTable = metadataDB();
      metadataTable.collection.insertOne(metadata, function (err, metadata) {
        if (err) {
          return console.error(err);
        } else {
          console.log("Metadata inserted successfully");
        }
      });
      tabletsToServers(metadata);

      const ioMaster = require("socket.io")(master);
      ioMaster.on("connection", (socket) => {
        servers.push(socket);
        console.log("A new server connected");
        tabletsToServers(metadata);
        socket.on("disconnect", () => {
          // servers.pop(socket);
        });
      });
    })
    .catch((err) => {
      console.error(err);
    });
}
asignServers()
  .then((res) => {
    console.log("Assigned!!");
  })
  .catch((err) => {
    console.error(err);
  });

master.listen(8080, () => {
  console.log("Master: listening on *:8080");
});
