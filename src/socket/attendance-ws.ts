import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";

const initAttendanceWSServer = (server: HttpServer) => {
  const wss = new WebSocketServer({ server, path: "/ws/attendance" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected to Attendance WebSocket");

    ws.on("message", (message: string) => {
      console.log("Received message:", message.toString());
      // Handle incoming messages from clients if needed
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
