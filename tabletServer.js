const express = require('express');
const app = express();
const constants = require("./scripts/constants");
const socketIO = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = socketIO(server);
const mongoose = require('mongoose');
const MovieModel = require('./Movie_model');

mongoose.connect(`${constants.connectionString}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


  readRows = async (movie) => {
    return await MovieModel.find({title : movie.title}).sort({year : 1});
  }

  addRow = async (movie) => {
      let movieToSave = new MovieModel(movie);
      return await movieToSave.save();
  }
  
  deleteRows = async (movie) => {
    return await MovieModel.deleteOne({title : movie.title});
  }

  deleteCells = async (movie,cells) => {
      return await MovieModel.updateOne(movie,{
            $unset: cells
        });
  }

  setRow = async (movie) => {
    return await MovieModel.updateOne({ title: movie.title }, {
            $set: movie
        });
  }

io.on('connection',(socket) =>{
    console.log('new user connected');
     // listen for message from user
    socket.on('Set', async (Movie)=>{
        console.log(`set operation`);
        // lock the server
        const movie = await setRow(Movie);

        if (movie !== null)
            socket.emit('successful',"Set Row");
        else 
            socket.emit('unsuccessful',"Set Row");
        
    });
    
    socket.on('AddRow', async (Movie)=>{
        console.log(`add row operation`);
        // connect to the db and add the row from it
        const movie = await addRow(Movie);
        if (movie !== null)
            socket.emit('successful',"Add Row");
        else 
            socket.emit('unsuccessful',"Add Row");
        
    });
    
    socket.on('DeleteCells', async (Movie,Cells)=>{
        console.log(`delete cells operation`);
        // connect to the db and delete the cells from it
        movie = await deleteCells(Movie,Cells);
        if (movie !== null)
            socket.emit('successful',"delete Cells");
        else 
            socket.emit('unsuccessful',"delete Cells");
    });
    
    socket.on('DeleteRow', async (movie)=>{
        console.log(`delete row operation`);
        // connect to the db and delete the row from it
        movie = await deleteRows(movie);
        if (movie !== null)
            socket.emit('successful',"delete Row");
        else 
            socket.emit('unsuccessful',"delete Row");
    });
         
    socket.on('ReadRows', async (Message) => {
        console.log(`read rows operation`);
        // read the movie from server
        let movies = await readRows(Message);
        if (movies !== null)
            //send it back to the client
            socket.emit('read',movies);
        else 
            socket.emit('unsuccessful',"Read Rows");
    })
    
     // when server disconnects from user
     socket.on('disconnect', ()=>{
       console.log('disconnected from user');
     });
})

port = 4000
server.listen(port,() => `listening on port ${port}`);