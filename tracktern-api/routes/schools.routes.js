import express from "express";
import { listSchools, searchSchools, createSchool, addAlias } from "../controllers/schools.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/", listSchools);
router.get("/search", searchSchools);
router.post("/", createSchool);
router.post("/:id/aliases", addAlias);

export default router;
