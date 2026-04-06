import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { protectAdmin } from "../middleware/auth.middleware.js";
import {
  punchIn,
  punchOut,
  getTodayStatus,
  getUserSummary,
  getAllUsersData,
} from "../controllers/attendance.controllers.js";

const router = express.Router();

router.post("/punch-in", protectRoute, punchIn);
router.post("/punch-out", protectRoute, punchOut);
router.get("/status", protectRoute, getTodayStatus);
router.get("/summary", protectRoute, getUserSummary);
router.get("/all", protectRoute, protectAdmin, getAllUsersData);

export default router;
