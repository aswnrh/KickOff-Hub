import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error("Error occurred handling", req.url, err);
    res.statusCode = 500;
    res.end("internal server error");
  }
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join-league", (leagueId) => {
    socket.join(leagueId);
    console.log(`User ${socket.id} joined league ${leagueId}`);
  });

  socket.on("score-update", (data) => {
    io.to(data.leagueId).emit("score-update", data);
  });

  socket.on("match-status", (data) => {
    io.to(data.leagueId).emit("match-status", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.once("error", (err) => {
  console.error(err);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`> Ready on http://${hostname}:${port}`);
});
