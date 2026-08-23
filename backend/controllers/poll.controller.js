import Poll from "../models/poll.model.js";
import Vote from "../models/vote.model.js";
import User from "../models/user.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import { logAudit } from "../utils/audit.js";
import { notifyAllStudents } from "../utils/notify.js";

const badRequest = (res, msg) => res.status(400).json({ success: false, message: msg });
const notFound = (res, msg = "Poll not found") => res.status(404).json({ success: false, message: msg });
const conflict = (res, msg) => res.status(409).json({ success: false, message: msg });
const serverError = (res, error) => {
  console.error("poll.controller error:", error);
  return res.status(500).json({ success: false, message: "Server error. Please try again later.", error: error.message });
};

// ─── Helpers ────────────────────────────────────────────────
const getPollStatus = (poll, now = new Date()) => {
  if (poll.closed) return "closed";
  if (poll.endAt && now > new Date(poll.endAt)) return "closed";
  if (poll.startAt && now < new Date(poll.startAt)) return "scheduled";
  return "active";
};

const serializePoll = (poll, opts = {}) => {
  const p = poll.toObject ? poll.toObject() : poll;
  const totalVotes = (p.options || []).reduce((s, o) => s + (o.votes || 0), 0);
  return {
    _id: p._id,
    question: p.question,
    description: p.description,
    type: p.type,
    options: (p.options || []).map((o) => ({ _id: o._id, text: o.text, votes: o.votes })),
    startAt: p.startAt,
    endAt: p.endAt,
    status: getPollStatus(p),
    totalVotes,
    hasVoted: opts.hasVoted || false,
    createdAt: p.createdAt,
  };
};

const getStudentProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== "student") return null;
  return StudentProfile.findOne({ userId: user._id });
};

const hasVoted = async (pollId, studentId) => {
  const vote = await Vote.findOne({ pollId, studentId });
  return !!vote;
};

// ─── Public / shared endpoints ──────────────────────────────
export const getActivePolls = async (req, res) => {
  try {
    const now = new Date();
    const polls = await Poll.find({ closed: { $ne: true }, $or: [{ endAt: { $gte: now } }, { endAt: null }] }).sort({ endAt: 1 });
    const active = polls.filter((p) => getPollStatus(p, now) === "active");
    const student = await getStudentProfile(req.user.id);
    const data = await Promise.all(active.map(async (p) => serializePoll(p, { hasVoted: student ? await hasVoted(p._id, student._id) : false })));
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (e) { return serverError(res, e); }
};

export const getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return notFound(res);
    const student = await getStudentProfile(req.user.id);
    const voted = student ? await hasVoted(poll._id, student._id) : false;
    return res.status(200).json({ success: true, data: serializePoll(poll, { hasVoted: voted }) });
  } catch (e) { return serverError(res, e); }
};

export const getPollResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return notFound(res);
    const p = serializePoll(poll);
    const total = p.totalVotes || 0;
    const options = p.options.map((o) => ({
      _id: o._id,
      text: o.text,
      votes: o.votes,
      percentage: total ? Math.round((o.votes / total) * 100) : 0,
    }));
    return res.status(200).json({ success: true, data: { _id: p._id, question: p.question, type: p.type, status: p.status, totalVotes: total, options } });
  } catch (e) { return serverError(res, e); }
};

export const getPollHistory = async (req, res) => {
  try {
    const polls = await Poll.find({}).sort({ endAt: -1 });
    const now = new Date();
    const history = polls.filter((p) => getPollStatus(p, now) === "closed");
    const student = await getStudentProfile(req.user.id);
    const data = await Promise.all(history.map(async (p) => serializePoll(p, { hasVoted: student ? await hasVoted(p._id, student._id) : false })));
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (e) { return serverError(res, e); }
};

// ─── Student vote ───────────────────────────────────────────
export const submitVote = async (req, res) => {
  try {
    const student = await getStudentProfile(req.user.id);
    if (!student) return badRequest(res, "Only students can vote");

    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return notFound(res, "Poll not found");

    const status = getPollStatus(poll);
    if (status !== "active") return badRequest(res, "Poll is not open for voting");

    const existing = await Vote.findOne({ pollId: poll._id, studentId: student._id });
    if (existing) return conflict(res, "You have already voted in this poll.");

    const { optionIds } = req.body;
    if (!Array.isArray(optionIds) || optionIds.length === 0) return badRequest(res, "optionIds array is required");
    if (poll.type === "single_choice" && optionIds.length !== 1) return badRequest(res, "Select exactly one option");

    const validIds = new Set(poll.options.map((o) => String(o._id)));
    for (const id of optionIds) {
      if (!validIds.has(String(id))) return badRequest(res, "Invalid option selected");
    }

    await Vote.create({ pollId: poll._id, studentId: student._id, optionIds });
    for (const id of optionIds) {
      await Poll.updateOne({ _id: poll._id, "options._id": id }, { $inc: { "options.$.votes": 1 } });
    }

    return res.status(200).json({ success: true, message: "Vote recorded successfully", data: { pollId: poll._id, voted: true } });
  } catch (e) {
    if (e.code === 11000) return conflict(res, "You have already voted in this poll.");
    return serverError(res, e);
  }
};

// ─── Admin endpoints ────────────────────────────────────────
export const listPolls = async (req, res) => {
  try {
    const { status } = req.query;
    const polls = await Poll.find({}).sort({ createdAt: -1 });
    let data = polls.map((p) => serializePoll(p));
    if (status) data = data.filter((p) => p.status === status);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (e) { return serverError(res, e); }
};

export const createPoll = async (req, res) => {
  try {
    const { question, description, type, options, startAt, endAt } = req.body;
    if (!question) return badRequest(res, "Question is required");
    if (!Array.isArray(options) || options.length < 2) return badRequest(res, "At least 2 options are required");
    const clean = options.filter((o) => o && String(o).trim()).map((o) => ({ text: String(o).trim(), votes: 0 }));
    if (clean.length < 2) return badRequest(res, "At least 2 valid options are required");

    const poll = await Poll.create({
      question: String(question).trim(),
      description: description ? String(description).trim() : null,
      type: ["single_choice", "multiple_choice", "rating", "yes_no"].includes(type) ? type : "single_choice",
      options: clean,
      startAt: startAt || new Date(),
      endAt: endAt || null,
      createdBy: req.user.id,
      closed: false,
    });
    logAudit({ userId: req.user.id, action: "POLL_CREATED", entity: "Poll", entityId: poll._id, metadata: { question: poll.question }, req });
    notifyAllStudents({
      title: "New Mess Poll",
      message: poll.question,
      type: "poll",
      data: { pollId: poll._id },
    });
    return res.status(201).json({ success: true, message: "Poll created successfully", data: serializePoll(poll) });
  } catch (e) { return serverError(res, e); }
};

export const updatePoll = async (req, res) => {
  try {
    const { question, description, type, startAt, endAt } = req.body;
    const update = {};
    if (question !== undefined) update.question = String(question).trim();
    if (description !== undefined) update.description = description ? String(description).trim() : null;
    if (type !== undefined) update.type = ["single_choice", "multiple_choice", "rating", "yes_no"].includes(type) ? type : "single_choice";
    if (startAt !== undefined) update.startAt = startAt;
    if (endAt !== undefined) update.endAt = endAt;
    const poll = await Poll.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!poll) return notFound(res);
    return res.status(200).json({ success: true, message: "Poll updated successfully", data: serializePoll(poll) });
  } catch (e) { return serverError(res, e); }
};

export const closePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.id, { closed: true }, { new: true });
    if (!poll) return notFound(res);
    logAudit({ userId: req.user.id, action: "POLL_CLOSED", entity: "Poll", entityId: poll._id, metadata: { question: poll.question }, req });
    return res.status(200).json({ success: true, message: "Poll closed successfully", data: serializePoll(poll) });
  } catch (e) { return serverError(res, e); }
};

export const deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) return notFound(res);
    await Vote.deleteMany({ pollId: poll._id });
    logAudit({ userId: req.user.id, action: "POLL_DELETED", entity: "Poll", entityId: poll._id, metadata: { question: poll.question }, req });
    return res.status(200).json({ success: true, message: "Poll deleted successfully" });
  } catch (e) { return serverError(res, e); }
};