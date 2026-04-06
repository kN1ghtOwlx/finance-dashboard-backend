import { Router } from "express";
import roleAccess from "../middleware/roleMiddleware.js";
import { dashboardSummary, dashboardTrend } from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/summary", roleAccess('viewer'), dashboardSummary);
router.get("/trend", roleAccess('analyst'), dashboardTrend);

export default router