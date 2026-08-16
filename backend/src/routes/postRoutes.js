import { Router } from "express";
import {
  getPosts,
  getPostById,
  syncAccountPosts,
  syncAllPosts,
  getComments,
  syncComments,
  syncInsights,
} from "../controllers/postController.js";

const router = Router();

router.get("/", getPosts);
router.get("/sync", syncAllPosts);
router.get("/:id", getPostById);
router.post("/sync/:accountId", syncAccountPosts);
router.get("/:id/comments", getComments);
router.post("/:id/comments/sync", syncComments);
router.post("/:id/insights/sync", syncInsights);

export default router;
