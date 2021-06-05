const masterURL = "http://localhost:8080";
const ioClient = require("socket.io-client");

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
