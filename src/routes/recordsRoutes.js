import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleAccess from "../middleware/roleMiddleware.js";
import { addRecord } from "../controllers/recordsController.js";

const router = Router();

router.use(authMiddleware);

router.post("/", roleAccess('admin'), addRecord);

export default router;