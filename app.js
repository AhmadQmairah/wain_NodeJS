var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var axios = require("axios");

// const names = {};
rooms = {
  roomID: {
    categories: { categories: [], likes: [] },
    flavours: [],
    budgets: []
  }
};
//Kinda like the main function
io.on("connection", async function(socket, test) {
  //Stuff to do once the user starts the session (before joining) (initial stuff)
  console.log("connected", socket.id);
  const cat = await axios.get("http://127.0.0.1:8000/categories/");
  const flav = await axios.get("http://127.0.0.1:8000/flavours/");
  const res = await axios.get("http://127.0.0.1:8000/restaurants/");

  //Stuff to do once the user joins a room
  socket.on("join", function(data) {
    socket.join(data.id);

    io.to(`${socket.id}`).emit("quiz", {
      categories: cat.data,
      flavours: flav.data
    });
  });
  socket.on("quiz_submit", function(data) {
    const answer = data;
    // let category = rooms.roomID.categories.find(
    //   category => category.category == data.category
    // );
    data.categories.forEach((cat, inx) => {
      let category = rooms.roomID.categories.categories.find(ct => {
        console.log("test", ct, cat);
        return ct === cat.category;
      });
    });
    // rooms.roomID.categories.categories.push(data);

    // const filteredRestaurants = res.data.filter(rest => {
    //   return (
    //     rest.categories.includes(answer.category) &&
    //     rest.flavours.includes(answer.flavour) &&
    //     rest.budget.length <= data.budget
    //   );
    // });

    // io.to("2").emit("filtered_rest", {
    //   filteredRestaurants
    // });
  });

  socket.on("disconnect", function() {
    // console.log("disconnected", socket);
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


*/
