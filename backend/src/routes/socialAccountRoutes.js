import { Router } from "express";
import {
  createAccount,
  listAccounts,
  deleteAccount,
  syncAccountInsights,
} from "../controllers/socialAccountController.js";
import validateRequest from "../middlewares/validateRequest.js";
import { createAccountSchema } from "../validations/socialAccountValidation.js";

const router = Router();

router.get("/", listAccounts);
router.post("/", validateRequest(createAccountSchema), createAccount);
router.delete("/:id", deleteAccount);
router.post("/:id/insights/sync", syncAccountInsights);

export default router;
