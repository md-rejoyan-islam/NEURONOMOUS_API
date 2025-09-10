import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";

const initAttendanceWSServer = (server: HttpServer) => {
  const wss = new WebSocketServer({
    server,
    path: "/ws/attendance",
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected to Attendance WebSocket");

    ws.on("message", (message: string) => {
      console.log("Received message:", message.toString());
      try {
        const data = JSON.parse(message.toString());

        if (data.action === "record") {
          ws.send(
            JSON.stringify([
              {
                id: 1,
                roll: "123",
                status: "present",
                timestamp: new Date().toISOString(),
              },
              {
                id: 2,
                roll: "124",
                status: "absent",
                timestamp: new Date().toISOString(),
              },
              {
                id: 3,
                roll: "125",
                status: "present",
                timestamp: new Date().toISOString(),
              },
            ])
          );
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected from Attendance WebSocket");
    });

    ws.send(
      JSON.stringify({ message: "Welcome to the Attendance WebSocket server!" })
    );
  });

  wss.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
};

export default initAttendanceWSServer;
