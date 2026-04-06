import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleAccess from "../middleware/roleMiddleware.js";
import { addRecord, getRecords, updateRecords } from "../controllers/recordsController.js";

const router = Router();

router.use(authMiddleware);

router.post("/", roleAccess('admin'), addRecord);
router.get("/", roleAccess('viewer'), getRecords);
router.patch("/:id", roleAccess('admin'), updateRecords)

export default router;