import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleAccess from "../middleware/roleMiddleware.js";
import { getUsers, addUsers } from "../controllers/userController.js";

const router = Router();

router.use(authMiddleware, roleAccess('admin'));

router.get("/", getUsers);
router.post("/", addUsers);

export default router;

