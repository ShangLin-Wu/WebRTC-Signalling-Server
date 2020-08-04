'use strict';
var http = require('http');
var express = require('express');

var serveIndex = require('serve-index');
var socketIo = require('socket.io');

var app = express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

var server = http.createServer(function(request, response){
  console.log('connected');
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.write('Hello, World.');
  response.end();
});

server.listen(3199);

var userArr = [];

var io = socketIo.listen(server);

io.sockets.on('connect', (socket) => {

  var info = {
    'socketID': socket.id
  }

  socket.emit('connectedData',info)  

  var info = {
    'roomList': userArr
  }
  socket.emit('newRoom',info) 
  
  socket.on('newRoom', (room) => {
    
    if(!userArr.includes(`${room.socketID}+${room.roomID}`))
      userArr.push(`${room.socketID}+${room.roomID}`)

    var info = {
      'roomList': userArr
    }

    io.emit('newRoom', info);

    console.log('[newRoom] room:', room);
  });

  socket.on('startCall', (data) => {
    var socketRoom = data.socketRoom
    var socketID = data.socketID

    socket.join(socketRoom)

    var myRoom = io.sockets.adapter.rooms[socketRoom]

    console.log(myRoom)
    console.log('startCall',socketID)
    console.log(myRoom.sockets)

    var info = {
      'socketID': socketID,
      'socketRoom': socketRoom,
      'socketRoomMember': myRoom.sockets
    }

    io.to(socketID).emit('startCall',info);


    // var myRoom = io.sockets.adapter.rooms[roomID];
    // var users = Object.keys(myRoom.sockets).length;

    // if (users <= 2) {
    //   socket.emit('joined', roomID, socket.id);  // 发消息给房间里除自己之外的所有人

    //   console.log('[joined] room:', roomID, 'user_id:', socket.id);

    //   if (users > 1) {
    //     socket.to(roomID).emit('otherjoin', roomID, socket.id);

    //     console.log('[otherjoin] room:', roomID, 'user_id:', socket.id);
    //   }
    // } else {
    //   socket.leave(roomID);
    //   socket.emit('full', roomID, socket.id);
    //   console.log('[otherjoin] room:', roomID, 'user_id:', socket.id);
    // }
  });

  socket.on('offer', (data) => {

    var myRoom = io.sockets.adapter.rooms[data.socketRoom]
    var info = {
      'data':data,
      'socketRoomMember': myRoom.sockets
    }

    io.to(data.socketRoom).emit('offer', info);

    console.log('[offer] room:', info.data.socketRoom,'offer:' ,info.data.sender,'data:', data);
  });

  socket.on('answer', (data) => {

    var myRoom = io.sockets.adapter.rooms[data.socketRoom]

    var info = {
      'data':data,
      'socketRoomMember': myRoom.sockets
    }

    io.to(data.socketRoom).emit('answer', info);

    console.log('[answer] room:', info.data.socketRoom,'answer:' ,info.data.socketID,'data:', data);
    console.log(io.sockets.adapter.rooms[info.data.socketRoom])
  });

  socket.on('ice_candidates', (candidate) => {
    console.log('ice_candidates')

    var myRoom = io.sockets.adapter.rooms[candidate.socketRoom]

    var info = {
      'data':candidate,
      'socketRoomMember': myRoom.sockets
    }  
    
    io.to(candidate.socketRoom).emit('ice_candidates',info);

  });

  socket.on('leaveRoom', (data) => {
    console.log('leaveRoom')
    if(data.socketRoom === data.socketID){
      io.emit('leaveRoom',data);
    }else{
      io.to(data.socketRoom).emit('leaveRoom',data);
    }
    
    const index = userArr.indexOf(data.socketID);
    if (index > -1) {
      userArr.splice(index, 1);
    } 

    // var room = socket.adapter.rooms[data.socketRoom].sockets;
    socket.leave(data.socketRoom)
    
  });

});

