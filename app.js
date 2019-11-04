﻿var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var axios = require("axios");

// const names = {};
rooms = {};

//Kinda like the main function

io.on("connection", async function(socket, test) {
  //Stuff to do once the user starts the session (before joining) (initial stuff)
  console.log("connected", socket.id);

  //Stuff to do once the user joins a room

  socket.on("join", async function(data) {
    const tag = await axios.get("https://e5f11881.ngrok.io/tags/");

    socket.join(data.id);
    console.log("someone joined");
    if (!rooms[data.id]) {
      io.to(`${socket.id}`).emit("admin");
      rooms[data.id] = {
        tags: [],
        priority: {},

        participants: [],
        participantsTinder: [],
        budgets: [],
        tinderPrioity: []
      };
    }
    rooms[data.id].participants.push({
      name: data.name,
      finished: false,
      tinderSubmitted: false
    });
    console.log(rooms[data.id].participants);
    //console.log(rooms, "ppl are =>", socket.adapter.rooms[data.id].length);
    console.log(tag.data);
    io.to(`${socket.id}`).emit("quiz", {
      tags: tag.data
    });
    io.to(data.id).emit("participantsChanged", {
      // participants: socket.adapter.rooms[data.id].length
      participants: rooms[data.id].participants
    });
  });

  socket.on("quiz_submit", function(data) {
    //rooms[data.id].budgets.push(data.budgets);

    let user = rooms[data.id].participants.find(
      user => user.name === data.name
    );
    user.finished = true;

    if (data.tags) {
      data.tags.forEach(tag => rooms[data.id].tags.push(tag));
    }

    io.to(data.id).emit("participantsSubmitted", {
      participants: rooms[data.id].participants
    });
    io.to(data.id).emit("participantsChanged", {
      // participants: socket.adapter.rooms[data.id].length
      participants: rooms[data.id].participants
    });
  });
  socket.on("tinder_submit", function(data) {
    rooms[data.id].tinderPrioity.push(...data.liked);

    let user = rooms[data.id].participants.find(
      user => user.name === data.name
    );

    user.tinderSubmitted = true;

    io.to(data.id).emit("participantsSubmitted", {
      participants: rooms[data.id].participants
    });
    io.to(data.id).emit("participantsChanged", {
      participants: rooms[data.id].participants
    });
    console.log(rooms[data.id].participants);
  });

  socket.on("end", async data => {
    const res = await axios.get("https://e5f11881.ngrok.io/restaurants/");
    let filterList = res.data;

    rooms[data.id].tags.forEach(tag => {
      if (rooms[data.id].priority[tag]) {
        rooms[data.id].priority[tag] += 1;
      } else rooms[data.id].priority[tag] = 1;
    });

    while (
      filterList.length > 5 &&
      Object.keys(rooms[data.id].priority).length
    ) {
      let HighestPriority;
      console.log(rooms[data.id].priority);
      if (Object.keys(rooms[data.id].priority).length === 1)
        HighestPriority = Object.keys(rooms[data.id].priority);
      else {
        HighestPriority = Object.keys(rooms[data.id].priority).reduce((a, b) =>
          rooms[data.id].priority[a] > rooms[data.id].priority[b] ? a : b
        );
      }
      // if (Object.keys(rooms[data.id].priority).length == 1)
      const temp = filterList;
      filterList = filterList.filter(res =>
        res.tags.includes(parseInt(HighestPriority))
      );
      if (filterList.length == 0) {
        filterList = temp;
      }

      delete rooms[data.id].priority[HighestPriority];
    }
    if (filterList.length > 0) filterList = filterList.slice(0, 5);

    io.to(data.id).emit("start_swipping");
    io.to(data.id).emit("filtered_rest", {
      filterList
    });
  });

  // socket.on("end", function(data) {
  //   let filterList = res.data;

  //   rooms.roomID.tags.forEach(tag => {
  //     if (rooms.roomID.priority[tag]) {
  //       rooms.roomID.priority[tag] += 1;
  //     } else rooms.roomID.priority[tag] = 1;
  //   });

  //   while (filterList.length > 5 && Object.keys(rooms.roomID.priority).length) {
  //     let HighestPriority;
  //     console.log(rooms.roomID.priority);
  //     if (Object.keys(rooms.roomID.priority).length === 1)
  //       HighestPriority = Object.keys(rooms.roomID.priority);
  //     else {
  //       HighestPriority = Object.keys(rooms.roomID.priority).reduce((a, b) =>
  //         rooms.roomID.priority[a] > rooms.roomID.priority[b] ? a : b
  //       );
  //     }
  //     // if (Object.keys(rooms.roomID.priority).length == 1)
  //     const temp = filterList;
  //     filterList = filterList.filter(res =>
  //       res.tags.includes(parseInt(HighestPriority))
  //     );
  //     if (filterList.length == 0) {
  //       filterList = temp;
  //     }

  //     delete rooms.roomID.priority[HighestPriority];
  //   }
  //   if (filterList.length > 0) filterList = filterList.slice(0, 5);
  //   console.log(filterList);

  //   // io.to("2").emit("filtered_rest", {
  //   //   finalFilteredRestaurants
  //   // });
  // });

  socket.on("disconnect", function() {
    console.log("disconnected");
    console.log(Object.keys(socket.adapter.rooms)[0]);
    // delete names[Object.keys(socket.adapter.rooms)[0]][socket.id];
  });

  socket.on("endTinder", data => {
    io.to(data.id).emit("give_result");
  });

  socket.on("category_select", function(data) {
    axios.post(data);
  });

  socket.on("hi", function(data) {
    io.in("2").emit("hi");
  });
});

http.listen(80, function() {
  console.log("Listening on port 3000");
});

//REFERENCE

/*
    var clients_in_the_room = io.sockets.adapter.rooms["2"];
    for (var clientId in clients_in_the_room) {
      // console.log("client: %s", Object.keys(clients_in_the_room.sockets)); //Seeing is believing
      var client_socket = io.sockets.connected[clientId];
      // console.log(client_socket); //Do whatever you want with this
    }



        // names[data.id] = names[data.id] || {};
    // names[data.id][socket.id] = data.name;
    // console.log("names=>", names);



     rooms.roomID.tags.sort(function(a, b) {
      return b.like - a.like;
    });
{


}
    console.log(rooms.roomID.tags);
    for (let i = 0; i <= 4; i++) {
      if (i >= rooms.roomID.tags.length) {
        break;
      }
      filterList.push(rooms.roomID.tags[i].category);
    }

   

      return [...fil];
    });
*/
