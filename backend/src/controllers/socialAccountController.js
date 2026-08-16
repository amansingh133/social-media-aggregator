import asyncHandler from "../middlewares/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import SocialAccountService from "../services/SocialAccountService.js";

export const createAccount = asyncHandler(async (req, res) => {
  const account = await SocialAccountService.create(req.body);
  new ApiResponse(201, account, "Social account connected").send(res);
});

export const listAccounts = asyncHandler(async (req, res) => {
  const accounts = await SocialAccountService.list();
  new ApiResponse(200, accounts, "Accounts fetched").send(res);
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await SocialAccountService.remove(req.params.id);
  new ApiResponse(200, null, "Account removed").send(res);
});

export const syncAccountInsights = asyncHandler(async (req, res) => {
  const account = await SocialAccountService.syncAccountInsights(req.params.id);
  new ApiResponse(200, account, "Account insights synced").send(res);
});
