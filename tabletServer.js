const express = require('express');
const app = express();
const socketIO = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = socketIO(server);

io.on('connection',(socket) =>{
    console.log('new user connected');
    
     // listen for message from user
    socket.on('Set', (Message)=>{
        console.log(`set operation ${Message.name}`);
        // lock the server
        socket.emit('block',{
            message : "block until the add happens" 
        });
        setTimeout(() => 
        {
            // connect to the db and add the tablet to it
            // unlock the server
            socket.emit('unblock',{
                message : "the cells added successfully" 
            });
        }
        ,5000);
        
        
    });
    
    socket.on('AddRow', (Message)=>{
        console.log(`add row operation`);
        // lock the server
        socket.emit('block',{
            message : "block until the add happens" 
        });
        // connect to the db and add the row from it
        // unlock the server
        socket.emit('unblock',{
            message : "the row added successfully" 
        });
    });
    
    socket.on('DeleteCells', (Message)=>{
        console.log(`delete cells operation`);
        // lock the server
        socket.emit('block',{
            message : "block until the delete happens" 
        });
        // connect to the db and delete the cells from it
        // unlock the server
        socket.emit('unblock',{
            message : "the cells deleted successfully" 
        });
    });
    
    socket.on('DeleteRow', (Message)=>{
        console.log(`delete row operation`);
        // lock the server
        socket.emit('block',{
            message : "block until the delete happens" 
        });
        //Message.movieName
        // connect to the db and delete the row from it
        // unlock the server
        socket.emit('unblock',{
            message : "the row deleted successfully" 
        });
    });
         
    socket.on('ReadRows', (Message) => {
        console.log(`read rows operation`);
        // read the movie from server


        socket.emit('read ',{
            // send the movie objects required 
        });
    })

    socket.on('reBalance',() => {});  // rebalancing logic 
    
     // when server disconnects from user
     socket.on('disconnect', ()=>{
       console.log('disconnected from user');
     });
})

port = 4000
server.listen(port,() => `listening on port ${port}`);