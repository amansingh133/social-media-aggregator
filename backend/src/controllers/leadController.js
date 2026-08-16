import asyncHandler from '../middlewares/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import LeadService from '../services/LeadService.js';

export const getLeads = asyncHandler(async (req, res) => {
  const { platform, source, status, page, limit } = req.query;
  const result = await LeadService.getLeads({ platform, source, status, page, limit });
  new ApiResponse(200, result, 'Leads fetched successfully').send(res);
});

export const updateLeadStatus = asyncHandler(async (req, res) => {
  const lead = await LeadService.updateLeadStatus(req.params.id, req.body.status);
  new ApiResponse(200, lead, 'Lead status updated').send(res);
});

export const addWatchedHashtag = asyncHandler(async (req, res) => {
  const hashtag = await LeadService.addWatchedHashtag(req.params.accountId, req.body.tag);
  new ApiResponse(201, hashtag, 'Hashtag added to watch list').send(res);
});

export const listWatchedHashtags = asyncHandler(async (req, res) => {
  const hashtags = await LeadService.listWatchedHashtags(req.params.accountId);
  new ApiResponse(200, hashtags, 'Watched hashtags fetched').send(res);
});

export const runHashtagSweep = asyncHandler(async (req, res) => {
  const result = await LeadService.runHashtagSweep(req.params.accountId);
  new ApiResponse(200, result, 'Hashtag sweep complete').send(res);
});
