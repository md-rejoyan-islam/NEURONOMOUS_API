import { Router } from "express";
import { getAllLogs } from "../controllers/logs.controller";

const logRouter = Router();

logRouter.get("/", getAllLogs);

export default logRouter;
