import { Router } from "express";
import systemController from "../controllers/system.controller";

const systemRouter = Router();

// systemRouter.use(isLoggedIn);
// systemRouter.use(authorize(["superadmin"]))

systemRouter.get("/memory", systemController.getMemoryDetails);
systemRouter.get("/cpu", systemController.getCpuDetails);

export default systemRouter;
