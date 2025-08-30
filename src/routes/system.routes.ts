import { Router } from "express";
import {
  getCpuDetails,
  getMemoryDetails,
} from "../controllers/system.controller";

const systemRouter = Router();

// systemRouter.use(isLoggedIn);
// systemRouter.use(authorize(["superadmin"]))

systemRouter.get("/memory", getMemoryDetails);
systemRouter.get("/cpu", getCpuDetails);

export default systemRouter;
