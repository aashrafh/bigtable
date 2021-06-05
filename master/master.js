const mongoose = require("mongoose");
const constants = require("../scripts/constants");
const express = require("express");
const app = express();
const http = require("http");
const master = http.createServer(app);
const { Server } = require("socket.io");
const MovieModel = require("../Movie_model");
const io = new Server(master);
const fs = require('fs');

let metadata = {};
let tablets = [];

mongoose.connect(`${constants.connectionString}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("You're connected!");
});

master.listen(8080, () => {
  console.log("Master: listening on *:8080");
});

function metadataDB() {
  const metadataSchema = new mongoose.Schema({
    firstServer: Object,
    secondServer: Object,
  });

  const Metadata = mongoose.model("metadata", metadataSchema);
  return Metadata;
}

const balanceThreshold = 10;
async function balanceLoad() {
  if (
    Math.abs(servers[0].tabletsNumber - servers[1].tabletsNumber) >
    balanceThreshold
  ) {
    console.log('unbalance detected');
    await assignServers();
    return false;
  }
  return true;
}

let serverCount = 0;
let servers = [
  {
    id: "",
    tabletsNumber: Math.floor(tablets.length / 2),
  },
  {
    id: "",
    tabletsNumber: Math.floor(tablets.length / 2),
  },
];
io.on("connection", (socket) => {


  socket.on("get-meta", (msg) => {
    socket.emit("send-meta", metadata);
  });
  


  socket.on("server-connect", () => {
    if (tablets.length != 0)
    { 
      servers[serverCount].id = socket.id;
      socket.emit(
        "send-data",
        tablets.slice(
          serverCount * Math.floor(tablets.length / 2),
          (serverCount + 1) * Math.floor(tablets.length / 2)
        )
      );
      serverCount++;
    }
    else 
      socket.emit ('reconnect');
  });



  socket.on("confirm-load", async (tabletsNumber) => {
    if (servers[0].id == socket.id) {
      servers[0].tabletsNumber = tabletsNumber;
    } else {
      servers[1].tabletsNumber = tabletsNumber;
    }

    let balanced = await balanceLoad();
    if (!balanced) {
      socket.emit("update-meta", metadata);
      socket.emit("update-data");
    }
  });



  socket.on("update-data", (socketServer) => {
    if (servers[0].id == socket.id) {
      socket.emit(
        "new-data",
        tablets.slice(0, Math.floor(tablets.length / 2))
      );
    } else {
      socket.emit(
        "new-data",
        tablets.slice(Math.floor(tablets.length / 2), tablets.length)
      );
    }
  });

  socket.on('operation',(status,type,movies,cells) => {
    let content = `The operation ${type} has ` +  ((status == 'unsuccessfully' )? `not` : '')  + `been done to the following movies :\n`;
    if (Array.isArray(movies))
      movies.forEach(movie => {
        content += `\t the movie number ${movies.indexOf(movie)} is ${movie.title} and the year is ${movie.year} \n`;
      });
    else 
      content += `\t the movie ${movies} and the year is ${movies} \n`
    const today = new Date();
    const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = date+' '+time;
    content += `at timestamp ${dateTime}`;
    fs.appendFile('logFile.log',content,(err)=>{ if(err) console.log(err)});

  });

  
});

/* 
1. Responsible for dividing data tables into tablets.
2. Responsible for assigning tablets to tablet servers 
3. Metadata table indicating the row key range (start key-end key) for each tablet server.
*/
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


async function assignServers() {
  let Movie = MovieModel;
  divideTables(Movie)
    .then((rangeKeys) => {
      metadata = {
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
    })
    .catch((err) => {
      console.error(err);
    });
}

assignServers().then((res) => {
    console.log("Done reading and dividing data");
});
