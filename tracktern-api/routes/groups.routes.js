import express from "express";
import * as groupsController from "../controllers/groups.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/", groupsController.createGroup);
router.post("/join", groupsController.joinGroup);
router.get("/mine", groupsController.getMyGroups);
router.get("/:id/leaderboard", groupsController.getGroupLeaderboard);

export default router;
