import { Router } from "express";
import roleAccess from "../middleware/roleMiddleware.js";
import { dashboardSummary } from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/summary", roleAccess('viewer'), dashboardSummary);

export default router