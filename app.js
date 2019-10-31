var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var axios = require("axios");

// const names = {};
rooms = {};

//Kinda like the main function
io.on("connection", async function(socket, test) {
  //Stuff to do once the user starts the session (before joining) (initial stuff)
  console.log("connected", socket.id);
  const tag = await axios.get("http://127.0.0.1:8000/tags/");
  //const flav = await axios.get("http://127.0.0.1:8000/flavours/");
  const res = await axios.get("http://127.0.0.1:8000/restaurants/");

  //Stuff to do once the user joins a room

  socket.on("join", function(data) {
    socket.join(data.id);

    if (!rooms[data.id]) {
      rooms[data.id] = {
        tags: [],
        priority: {},
        peopleAccepted: 0,

        budgets: []
      };
    }
    console.log(rooms, "ppl are =>", socket.adapter.rooms[data.id].length);
    io.to(`${socket.id}`).emit("quiz", {
      tags: tag.data
    });
    io.to(data.id).emit("participantsChanged", {
      participants: socket.adapter.rooms[data.id].length
    });
  });

  socket.on("quiz_submit", function(data) {
    console.log(data);
    rooms[data.id].budgets.push(data.budgets);

    data.tags.forEach(tag => rooms[data.id].tags.push(tag));
    rooms[data.id].peopleAccepted += 1;
    io.to(data.id).emit("participantsSubmitted", {
      participants: rooms[data.id].peopleAccepted
    });
    io.to(data.id).emit("participantsChanged", {
      participants: socket.adapter.rooms[data.id].length
    });
    if (
      rooms[data.id].peopleAccepted === socket.adapter.rooms[data.id].length
    ) {
      finish(data.id);
    }
  });

  function finish(id) {
    let filterList = res.data;

    rooms[id].tags.forEach(tag => {
      if (rooms[id].priority[tag]) {
        rooms[id].priority[tag] += 1;
      } else rooms[id].priority[tag] = 1;
    });

    while (filterList.length > 5 && Object.keys(rooms[id].priority).length) {
      let HighestPriority;
      console.log(rooms[id].priority);
      if (Object.keys(rooms[id].priority).length === 1)
        HighestPriority = Object.keys(rooms[id].priority);
      else {
        HighestPriority = Object.keys(rooms[id].priority).reduce((a, b) =>
          rooms[id].priority[a] > rooms[id].priority[b] ? a : b
        );
      }
      // if (Object.keys(rooms[id].priority).length == 1)
      const temp = filterList;
      filterList = filterList.filter(res =>
        res.tags.includes(parseInt(HighestPriority))
      );
      if (filterList.length == 0) {
        filterList = temp;
      }

      delete rooms[id].priority[HighestPriority];
    }
    if (filterList.length > 0) filterList = filterList.slice(0, 5);
    console.log(filterList);

    // io.to("2").emit("filtered_rest", {
    //   finalFilteredRestaurants
    // });
  }

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

  socket.on("category_select", function(data) {
    axios.post(data);
  });

  socket.on("hi", function(data) {
    io.in("2").emit("hi");
  });
});

http.listen(80, function() {
  console.log("Listening on port 30000");
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
