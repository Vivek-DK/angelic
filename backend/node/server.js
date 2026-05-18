require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
  authLimiter,
  historyLimiter
} = require("./middleware/rateLimiter");

const authRoutes = require("./routes/auth");
const historyRoutes = require("./routes/history");
const uploadRoutes = require("./routes/upload");

const compression =
  require("compression");

const errorHandler = require(
  "./middleware/errorHandler"
);

const connectDB = require("./db");

const app = express();

app.use(cors({

  origin: [
    "http://localhost:5173"
  ],

  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ]
}));

app.use(express.json());
app.use(compression());

connectDB();

app.get("/", (req, res) => {

  res.send(
    "SkinTone Amazon API Server is running."
  );
});

app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

app.use(
  "/api/history",
  historyLimiter,
  historyRoutes
);

app.use(
  "/api/upload",
  uploadRoutes
);

app.use(errorHandler);


const http = require("http");

const { Server } =
  require("socket.io");

const server =
  http.createServer(app);

const io = new Server(server, {

  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

setInterval(() => {

  const randomNotification =

    fashionNotifications[

      Math.floor(

        Math.random() *

        fashionNotifications.length
      )
    ];


  io.emit(

    "system_notification",

    randomNotification
  );

  console.log(

    "Notification sent:",

    randomNotification
  );

}, 300000);

const fashionNotifications = [

  {

    title:
      "Style Tip",

    message:
      "Try face shape analysis for better hairstyle recommendations."
  },

  {

    title:
      "Color Match",

    message:
      "Analyze your skin tone to discover premium outfit palettes."
  },

  {

    title:
      "Fashion AI",

    message:
      "Your wardrobe looks better when colors match your undertone."
  },

  {

    title:
      "New Feature",

    message:
      "AI fashion assistant is now available inside Angelic AI."
  }
];

io.on("connection", (socket) => {

  console.log(
    "User connected:",
    socket.id
  );

  socket.on("disconnect", () => {

    console.log(
      "User disconnected:",
      socket.id
    );
  });
});

const PORT =
  process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );
});