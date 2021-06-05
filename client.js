const io = require('socket.io-client')
const socket = io('http://localhost:4000/',{reconnect : true});
let metaData = {}
let block = 0;

const operation = 'Set'
const message = {
    name : 'Marvel End Game'
}
// Add a connect listener
socket.on('connect',() => { 
    console.log('Connected!');
});

socket.on('block', (message) => { 
    // block the client till a unblock comes
    console.log('block');
    block = 1;
});

socket.on('unblock', (message) => { 
    // block the client till a unblock comes 
    console.log('unblock');
    block = 0;
});

socket.on('metaData',(metaData) => { // this for receiving the meta data from the master upon connection or upon update
    metaData = this.metaData
})

//set of queries to be sent
while (block); // blocking condition
socket.emit(operation, message); // send a set request




socket.on('read' , (message) => {
    console.log(`movie received and it's name is ${message.name}`);
})


socket.on("disconnect", () => {
    console.log('disconnected from server'); // undefined
});