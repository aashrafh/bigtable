const fs = require("fs");

const mongoose = require("mongoose");
const constants = require("../scripts/constants");
const MovieModel = require("../Movie_model");
const MetadataModel = require("../metadataModel");

const express = require("express");
const app = express();
const clientApp = express();
const http = require("http");
const master = http.createServer(app);
const ioServer = require("socket.io");

let metadata = {};
let tablets = [];
let servers = [];
let clients = [];
let serverCounts = [];
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
  serverCounts.push(Math.floor(tablets.length / 2));
  serverCounts.push(Math.floor(tablets.length / 2));
  return rangeKeys;
}

async function metaToClients(meta) {
  for (let i = 0; i < clients.length; i++) {
    clients[i].emit("sendMeta", meta);
  }
}

async function tabletsToServers(meta) {
  for (let i = 0; i < servers.length; i++) {
    servers[i].emit("sendTablets", {
      tablets: tablets.slice(
        i * Math.floor(tablets.length / 2),
        (i + 1) * Math.floor(tablets.length / 2)
      ),
      index: i,
    });
    console.log("Emitting the tablets");
  }
}

function buildMeta(rangeKeys) {
  if (!tabletServerCount) return {};
  else if (tabletServerCount < 1)
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
        port: 3000,
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
        port: 3000,
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
        port: 4000,
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
  console.log("afterbuild", metadata);
  metadataTable = MetadataModel;
  metadataTable.collection.insertOne(metadata, function (err, metadata) {
    if (err) {
      return console.error(err);
    } else {
      console.log("Metadata inserted successfully");
    }
  });
}

async function balanceLoad() {
  if (Math.abs(serverCounts[0] - serverCounts[1]) > 10) {
    const Movie = MovieModel;
    divideTables(Movie).then((rangeKeys) => {
      processMeta(rangeKeys);
      send(metadata);
    });
    let content = `Re-balanced the tablets division and updated the metadata\n`;
    fs.appendFile("logFile.log", content, (err) => {
      if (err) console.log(err);
    });
  }
}

function handleLogging() {
  for (socket of servers) {
    socket.on("operation", (status, type, index) => {
      let content = `The operation of ${type} has  +  ((status == 'unsuccessfully' )? not : '')  + been done\n`;

      const today = new Date();
      const date =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      const time =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      const dateTime = date + " " + time;
      content += `at timestamp ${dateTime}\n`;
      fs.appendFile("logFile.log", content, (err) => {
        if (err) console.log(err);
      });

      if (type === "Add Row") {
        serverCounts[index]++;
        balanceLoad();
      } else if (type === "delete Row") {
        serverCounts[index]--;
        balanceLoad();
      }
    });
  }
}
async function asignServers() {
  const Movie = MovieModel;
  divideTables(Movie)
    .then((rangeKeys) => {
      processMeta(rangeKeys);
      send(metadata);

      const ioMaster = ioServer(master);
      ioMaster.on("connection", (socket) => {
        processMeta(rangeKeys);
        // console.log("Some server/client are trying to connect...");
        servers.push(socket);
        console.log(
          "Master: new server has attached with index: ",
          tabletServerCount++
        );

        // send(metadata);
        balanceLoad();

        // socket.on("serverWrite", () => {
        //   balanceLoad();
        // });
        handleLogging();

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

function listenToClient(clientServer) {
  clientServer.listen(8000, () => {
    console.log("Master: listening to clients on *:8000");
  });
}

function connectToClient() {
  const clientServer = http.createServer(clientApp);
  const clientSocket = ioServer(clientServer);
  clientSocket.on("connection", (socket) => {
    clients.push(socket);
    console.log("Master: a new client has connected successfully");
    console.log(metadata);
    socket.emit("sendMeta", metadata);
  });

  listenToClient(clientServer);
}

asignServers()
  .then((res) => {
    console.log("Assigned!!");
    console.log("Connected to Clients!!");
  })
  .catch((err) => {
    console.error(err);
  });

master.listen(8080, () => {
  console.log("Master: listening to servers on *:8080");
});
connectToClient();
