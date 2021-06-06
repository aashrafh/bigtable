const mongoose = require("mongoose");
const constants = require("../scripts/constants");
const MovieModel = require("../Movie_model");

const express = require("express");
const app = express();
const http = require("http");
const master = http.createServer(app);
const ioServer = require("socket.io");

let metadata = {};
let tablets = [];
let servers = [];
let clients = [];
let tabletServerCount = 0;

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

async function metaToClients(meta) {
  for (let i = 0; i < clients.length; i++) {
    clients[i].emit("send-meta", meta);
  }
}

async function tabletsToServers(meta) {
  for (let i = 0; i < servers.length; i++) {
    servers[i].emit(
      "send-tablets",
      {
        tablets: tablets.slice(
          i * Math.floor(tablets.length / 2),
          (i + 1) * Math.floor(tablets.length / 2)
        ),
        index = i
      }
    );
    console.log("Emitting the tablets");
  }
}

function buildMeta(rangeKeys) {
  if (!tabletServerCount) return {};
  else if (tabletServerCount === 1)
    return {
      firstServer: {
        setA: {
          startYear: rangeKeys[0].startYear,
          endYear: rangeKeys[1].endYear,
        },
        setB: {
          startYear: rangeKeys[2].startYear,
          endYear: rangeKeys[3].endYear,
        },
        range: {
          startYear: rangeKeys[0].startYear,
          endYear: rangeKeys[3].endYear,
        },
      },
    };
  else
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

function send(meta) {
  if (!tabletServerCount) metaToClients(meta);
  else {
    tabletsToServers(meta);
    metaToClients(meta);
  }
}

function processMeta(rangeKeys) {
  metadata = buildMeta(rangeKeys);
  metadataTable = metadataDB();
  metadataTable.collection.insertOne(metadata, function (err, metadata) {
    if (err) {
      return console.error(err);
    } else {
      console.log("Metadata inserted successfully");
    }
  });
}

async function balanceLoad() {
  const Movie = MovieModel;
  divideTables(Movie).then((rangeKeys) => {
    processMeta(rangeKeys);
    send(metadata);
  });
}

async function asignServers() {
  const Movie = MovieModel;
  divideTables(Movie)
    .then((rangeKeys) => {
      processMeta(rangeKeys);
      send(metadata);

      const ioMaster = ioServer(master);
      ioMaster.on("connection", (socket) => {
        servers.push(socket);
        console.log(
          "Master: new server has attached with index: ",
          tabletServerCount++
        );

        send(metadata);
        balanceLoad();

        socket.on("serverWrite", () => {
          balanceLoad();
        });

        socket.on("disconnect", () => {
          servers = servers.filter(
            (tabletServer) => tabletServer.id !== socket.id
          );
          tabletServerCount--;
          console.log("Master: a server has disconnected, re-balancing...");
          balanceLoad();
        });
      });
    })
    .catch((err) => {
      console.error(err);
    });
}

function connectToClient(){
  const clientServer = http.createServer(app);
  const clientSocket = ioServer(clientServer);
  clientSocket.on('connection', socket => {
    clients.push(socket);
    console.log('Master: a new client has connected successfully');
    socket.emit('sendMeta', metadata);
  })
}

asignServers()
  .then((res) => {
    console.log("Assigned!!");
    connectToClient();
    console.log("Connected to Clients!!");
  })
  .catch((err) => {
    console.error(err);
  });

master.listen(8080, () => {
  console.log("Master: listening on *:8080");
});
