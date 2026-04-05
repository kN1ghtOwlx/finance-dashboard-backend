import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleAccess from "../middleware/roleMiddleware.js";
import { getUsers } from "../controllers/userController.js";

const router = Router();

router.use(authMiddleware, roleAccess('admin'));

router.get("/", getUsers);

export default router;

