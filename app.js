var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var axios = require("axios");

// const names = {};
let rooms = {};
let users = {};
//Kinda like the main function
app.get("/", (req, res) => {
  res.send("yo");
});
io.on("connection", async function(socket, test) {
  // io.set("heartbeat timeout", 2000 / 10);
  //Stuff to do once the user starts the session (before joining) (initial stuff)
  console.log("connected", socket.id);
  let res;
  //Stuff to do once the user joins a room

  socket.on("join", async function(data = {}) {
    const tag = await axios.get("http://104.248.34.189/tags/");

    socket.join(data.id);
    users[socket.id] = { room: data.id, name: data.name };

    if (!rooms[data.id]) {
      io.to(`${socket.id}`).emit("admin");
      rooms[data.id] = {
        tags: [],
        priority: {},

        participants: [],
        budgets: [],
        submittedRestaurants: [],
        FilteredRestaurants: []
      };
    }

    if (!data.IsObserver) {
      if (
        rooms[data.id].participants.length === 1 &&
        rooms[data.id].participants[0].IsObserver
      ) {
        io.to(`${socket.id}`).emit("admin");
      }
      rooms[data.id].participants.push({
        name: data.name,
        finished: false,
        tinderSubmitted: false,
        IsObserver: false
      });
    } else {
      rooms[data.id].participants.push({
        name: data.name,
        finished: true,
        tinderSubmitted: true,
        IsObserver: true
      });
    }

    if (!data.IsObserver) {
      io.to(data.id).emit("participantsSubmitted", {
        participant: data.name,
        type: "join"
      });
    }
    io.to(`${socket.id}`).emit("quiz", {
      tags: tag.data
    });
    io.to(data.id).emit("participantsChanged", {
      participants: rooms[data.id].participants
    });
  });

  socket.on("quiz_submit", function(data) {
    let user = rooms[data.id].participants.find(
      user => user.name === data.name
    );
    user.finished = true;

    if (data.tags) {
      data.tags.forEach(tag => rooms[data.id].tags.push(tag));
    }

    io.to(data.id).emit("participantsSubmitted", {
      participant: data.name,
      type: "quiz"
    });
    io.to(data.id).emit("participantsChanged", {
      participants: rooms[data.id].participants
    });
  });
  socket.on("tinder_submit", function(data) {
    rooms[data.id].submittedRestaurants.push(...data.liked);

    let user = rooms[data.id].participants.find(
      user => user.name === data.name
    );

    user.tinderSubmitted = true;

    io.to(data.id).emit("participantsSubmitted", {
      participant: data.name,
      type: "tinder"
    });
    io.to(data.id).emit("participantsChanged", {
      participants: rooms[data.id].participants
    });
  });

  socket.on("end", async data => {
    res = await axios.get("http://104.248.34.189/restaurants/");
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

      if (Object.keys(rooms[data.id].priority).length === 1)
        HighestPriority = Object.keys(rooms[data.id].priority);
      else {
        HighestPriority = Object.keys(rooms[data.id].priority).reduce((a, b) =>
          rooms[data.id].priority[a] > rooms[data.id].priority[b] ? a : b
        );
      }

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
    if (filterList.length === 1) {
      io.to(data.id).emit("moveToResult");
      io.to(data.id).emit("give_result", filterList[0]);
    } else {
      rooms[data.id].FilteredRestaurants = filterList;
      io.to(data.id).emit("start_swipping");
      io.to(data.id).emit("filtered_rest", {
        filterList
      });
    }
  });

  socket.on("disconnect", function() {
    if (users[socket.id]) {
      let room = users[socket.id].room;
      let name = users[socket.id].name;

      rooms[room].participants = rooms[room].participants.filter(
        user => user.name !== name
      );
      if (!rooms[room].participants.length) {
        delete rooms[room];
      } else {
        io.to(room).emit("participantsChanged", {
          participants: rooms[room].participants
        });
      }
    }
  });

  socket.on("endTinder", data => {
    console.log(rooms[data.id], "Also in the news", data);
    let index;
    let x = rooms[data.id].submittedRestaurants;
    let selectedRestaurant;
    let priorityPerRepetition = {};
    var map = x.reduce(function(prev, cur) {
      prev[cur] = (prev[cur] || 0) + 1;
      return prev;
    }, {});
    console.log("map", map);
    Object.keys(map).forEach(res => {
      if (!priorityPerRepetition[map[res]]) {
        priorityPerRepetition[map[res]] = [];
      }
      priorityPerRepetition[map[res]].push(res);
    });
    const highestKey = Math.max(
      ...Object.keys(priorityPerRepetition).map(key => parseInt(key))
    );

    let listToRandomize = priorityPerRepetition[highestKey];
    console.log("list to random", listToRandomize);
    if (!listToRandomize) {
      listToRandomize = rooms[data.id].FilteredRestaurants;
      index = Math.floor(Math.random() * (listToRandomize.length - 1));
      selectedRestaurant = res.data.find(
        r => r.id == listToRandomize[index].id
      );
    } else if (listToRandomize.length == 1)
      selectedRestaurant = res.data.find(r => r.id == listToRandomize[0]);
    else {
      index = Math.floor(Math.random() * (listToRandomize.length - 1));
      selectedRestaurant = res.data.find(r => r.id == listToRandomize[index]);
    }

    io.to(data.id).emit("moveToResult");
    io.to(data.id).emit("give_result", selectedRestaurant);
  });
});
//delete rooms[data.id];
http.listen(80, function() {
  console.log("Listening on port 3000");
});
