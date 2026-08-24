import Suggestion from "../models/suggestion.model.js";
import User from "../models/user.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import { createNotification } from "./notification.controller.js";
import { logAudit } from "../utils/audit.js";

const badRequest = (res, msg) => res.status(400).json({ success: false, message: msg });
const notFound = (res, msg = "Suggestion not found") => res.status(404).json({ success: false, message: msg });
const forbidden = (res, msg = "Forbidden") => res.status(403).json({ success: false, message: msg });
const serverError = (res, error) => {
  console.error("suggestion.controller error:", error);
  return res.status(500).json({ success: false, message: "Server error. Please try again later." });
};

const VALID_TYPES = ["vegetable", "dish", "breakfast", "lunch", "dinner", "snack", "general"];
const VALID_STATUSES = ["pending", "under_review", "approved", "rejected", "implemented"];

const getStudentProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== "student") return null;
  return StudentProfile.findOne({ userId: user._id });
};

const SUGGEST_POPULATE = [
  { path: "studentId", populate: [{ path: "userId", select: "name phone" }, { path: "roomId", select: "roomNumber" }] },
];

// ─── Student ────────────────────────────────────────────────
export const createSuggestion = async (req, res) => {
  try {
    const student = await getStudentProfile(req.user.id);
    if (!student) return badRequest(res, "Only students can submit suggestions");
    const { type, title, description } = req.body;
    if (!title) return badRequest(res, "Food name is required");
    if (!String(title).trim()) return badRequest(res, "Food name is required");
    const cleanType = VALID_TYPES.includes(type) ? type : "general";
    const suggestion = await Suggestion.create({
      studentId: student._id,
      hostelId: student.hostelId || null,
      type: cleanType,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
    });
    return res.status(201).json({ success: true, message: "Suggestion submitted successfully", data: suggestion });
  } catch (e) { return serverError(res, e); }
};

export const getMySuggestions = async (req, res) => {
  try {
    const student = await getStudentProfile(req.user.id);
    if (!student) return badRequest(res, "Student profile not found");
    const suggestions = await Suggestion.find({ studentId: student._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: suggestions.length, data: suggestions });
  } catch (e) { return serverError(res, e); }
};

// ─── Admin ──────────────────────────────────────────────────
export const getAllSuggestions = async (req, res) => {
  try {
    const { status, type, hostelId, from, to } = req.query;
    const query = {};
    if (status && VALID_STATUSES.includes(status)) query.status = status;
    if (type && VALID_TYPES.includes(type)) query.type = type;
    if (hostelId) query.hostelId = hostelId;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    const suggestions = await Suggestion.find(query).populate(SUGGEST_POPULATE).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: suggestions.length, data: suggestions });
  } catch (e) { return serverError(res, e); }
};

export const updateSuggestionStatus = async (req, res) => {
  try {
    const { status, response } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) return badRequest(res, "Invalid status");

    const suggestion = await Suggestion.findById(req.params.id);
    if (!suggestion) return notFound(res);

    // Warden scope enforcement: only suggestions from the warden's hostel.
    if (req.user.role === "warden") {
      const warden = await User.findById(req.user.id).select("hostelId");
      if (!warden?.hostelId) return forbidden(res, "Warden is not assigned to any hostel");
      const student = await StudentProfile.findById(suggestion.studentId).select("hostelId");
      if (!student || !student.hostelId || String(student.hostelId) !== String(warden.hostelId)) {
        return forbidden(res, "Not authorized to update this suggestion");
      }
    }

    const update = { status };
    if (response !== undefined) update.adminResponse = String(response).trim() || null;
    const updated = await Suggestion.findByIdAndUpdate(suggestion._id, update, { new: true });

    // Notify the submitting student about the status change
    try {
      const profile = await StudentProfile.findById(updated.studentId).populate({ path: "userId", select: "_id" });
      if (profile?.userId?._id) {
        await createNotification({
          userId: profile.userId._id,
          title: `Suggestion ${status}`,
          message: `Your suggestion "${updated.title}" is now ${status.replace("_", " ")}.`,
          type: "mess",
          data: { suggestionId: updated._id },
        });
      }
    } catch (e) {
      console.error("suggestion notify error:", e);
    }
    logAudit({ userId: req.user.id, action: "SUGGESTION_STATUS_CHANGED", entity: "Suggestion", entityId: updated._id, metadata: { status, changedByRole: req.user.role }, req });
    return res.status(200).json({ success: true, message: `Suggestion ${status}`, data: updated });
  } catch (e) { return serverError(res, e); }
};

// ─── Warden ─────────────────────────────────────────────────
export const getWardenSuggestions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "warden") return badRequest(res, "Not authorized");
    const query = {};
    if (user.blockId) query.blockId = user.blockId;
    else if (user.hostelId) query.hostelId = user.hostelId;
    const profiles = query.blockId || query.hostelId
      ? await StudentProfile.find(query).select("_id")
      : [];
    const ids = profiles.map((p) => p._id);
    const suggestions = ids.length > 0
      ? await Suggestion.find({ studentId: { $in: ids } }).populate(SUGGEST_POPULATE).sort({ createdAt: -1 })
      : [];
    return res.status(200).json({ success: true, count: suggestions.length, data: suggestions });
  } catch (e) { return serverError(res, e); }
};
