import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";

const initAttendanceWSServer = (server: HttpServer) => {
  const wss = new WebSocketServer({
    server,
    path: "/ws/attendance",
    noServer: false,
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected to Attendance WebSocket");

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        const courses = [
          { id: 1, name: "Mathematics", course_code: "MATH101" },
          { id: 2, name: "Physics", course_code: "PHY101" },
          { id: 3, name: "Chemistry", course_code: "CHEM101" },
        ];

        switch (data.command) {
          case "get_courses":
            ws.send(
              JSON.stringify({
                status: "ok",
                command: "get_courses",
                courses,
              })
            );
            break;
          case "send_attendance":
            console.log(
              `Attendance received from ${data.device_id}:`,
              data.attendance
            );
            ws.send(
              JSON.stringify({
                status: "ok",
                command: "send_attendance",
                message: "Attendance received",
              })
            );
            break;
          case "status":
            console.log(`Device ${data.device_id} is now ${data.status}`);
            ws.send(
              JSON.stringify({
                status: "ok",
                command: "status",
                message: `Status ${data.status} received`,
              })
            );
            break;
          default:
            ws.send(
              JSON.stringify({ status: "error", message: "Unknown command" })
            );
        }

        // if (data.command === "get_courses" && data.device_id === "device123") {
        //   ws.send(
        //     JSON.stringify({
        //       commmand: "courses_list",
        //       device_id: "device123",
        //       courses: [
        //         { id: 1, name: "Mathematics", course_code: "MATH101" },
        //         { id: 2, name: "Physics", course_code: "PHY101" },
        //         { id: 3, name: "Chemistry", course_code: "CHEM101" },
        //       ],
        //     })
        //   );
        // } else if (
        //   data.command === "send_attendance" &&
        //   data.device_id === "device123"
        // ) {
        //   console.log("Attendance data received:", data.attendance);
        //   ws.send(
        //     JSON.stringify({
        //       command: "attendance_acknowledged",
        //       device_id: "device123",
        //       status: "success",
        //     })
        //   );
        // }
      } catch (error) {
        console.error("Error parsing message:", error);
        ws.send(JSON.stringify({ status: "error", message: "Invalid JSON" }));
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected from Attendance WebSocket");
    });
  });

  wss.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
};

export default initAttendanceWSServer;
