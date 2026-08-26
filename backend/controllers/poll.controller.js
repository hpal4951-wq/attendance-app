import Poll from "../models/poll.model.js";
import Vote from "../models/vote.model.js";
import User from "../models/user.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import { notifyPollEligible } from "../services/notification.service.js";
import { logAudit } from "../utils/audit.js";

const badRequest = (res, msg) => res.status(400).json({ success: false, message: msg });
const notFound = (res, msg = "Poll not found") => res.status(404).json({ success: false, message: msg });
const conflict = (res, msg) => res.status(409).json({ success: false, message: msg });
const forbidden = (res, msg = "Forbidden") => res.status(403).json({ success: false, message: msg });
const serverError = (res, error) => {
  console.error("poll.controller error:", error);
  return res.status(500).json({ success: false, message: "Server error. Please try again later." });
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
    hostelId: p.hostelId ? String(p.hostelId) : null,
    isGlobal: !!p.isGlobal,
    options: (p.options || []).map((o) => ({ _id: o._id, text: o.text, votes: o.votes })),
    startAt: p.startAt,
    endAt: p.endAt,
    status: getPollStatus(p),
    totalVotes,
    hasVoted: opts.hasVoted || false,
    selectedOptionIds: opts.selectedOptionIds || [],
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

// Option ids the student currently selected for a poll (for re-vote prefill).
const getVoteOptionIds = async (pollId, studentId) => {
  const vote = await Vote.findOne({ pollId, studentId }).select("optionIds");
  return vote ? (vote.optionIds || []).map((id) => String(id)) : [];
};

const getWardenHostel = async (userId) => {
  const user = await User.findById(userId).select("role hostelId blockId");
  if (!user || user.role !== "warden") return null;
  return user;
};

// A poll is visible to a student if it is global OR belongs to their hostel.
const pollVisibleToStudent = (poll, student) => {
  if (poll.isGlobal) return true;
  if (!poll.hostelId) return true; // legacy/unscoped poll — visible to all
  return student.hostelId && String(poll.hostelId) === String(student.hostelId);
};

// ─── Public / shared endpoints ──────────────────────────────
export const getActivePolls = async (req, res) => {
  try {
    const now = new Date();
    const query = { closed: { $ne: true }, $or: [{ endAt: { $gte: now } }, { endAt: null }] };
    const polls = await Poll.find(query).sort({ endAt: 1 });

    const user = await User.findById(req.user.id).select("role");
    let visible = polls.filter((p) => getPollStatus(p, now) === "active");

    if (user?.role === "student") {
      const student = await getStudentProfile(req.user.id);
      visible = visible.filter((p) => pollVisibleToStudent(p, student));
      const data = await Promise.all(visible.map(async (p) => serializePoll(p, { hasVoted: student ? await hasVoted(p._id, student._id) : false, selectedOptionIds: student ? await getVoteOptionIds(p._id, student._id) : [] })));
      return res.status(200).json({ success: true, count: data.length, data });
    }

    if (user?.role === "warden") {
      const warden = await getWardenHostel(req.user.id);
      visible = visible.filter((p) => !p.hostelId || (warden?.hostelId && String(p.hostelId) === String(warden.hostelId)));
    }

    const data = await Promise.all(visible.map(async (p) => serializePoll(p)));
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (e) { return serverError(res, e); }
};

export const getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return notFound(res);
    const student = await getStudentProfile(req.user.id);
    if (student && !pollVisibleToStudent(poll, student)) return forbidden(res, "Poll is not available for your hostel");
    const voted = student ? await hasVoted(poll._id, student._id) : false;
    const selected = student ? await getVoteOptionIds(poll._id, student._id) : [];
    return res.status(200).json({ success: true, data: serializePoll(poll, { hasVoted: voted, selectedOptionIds: selected }) });
  } catch (e) { return serverError(res, e); }
};

export const getPollResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return notFound(res);
    const student = await getStudentProfile(req.user.id);
    if (student && !pollVisibleToStudent(poll, student)) return forbidden(res, "Poll is not available for your hostel");
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
    let history = polls.filter((p) => getPollStatus(p, now) === "closed");

    const user = await User.findById(req.user.id).select("role");
    if (user?.role === "student") {
      const student = await getStudentProfile(req.user.id);
      history = history.filter((p) => pollVisibleToStudent(p, student));
      const data = await Promise.all(history.map(async (p) => serializePoll(p, { hasVoted: student ? await hasVoted(p._id, student._id) : false, selectedOptionIds: student ? await getVoteOptionIds(p._id, student._id) : [] })));
      return res.status(200).json({ success: true, count: data.length, data });
    }
    if (user?.role === "warden") {
      const warden = await getWardenHostel(req.user.id);
      history = history.filter((p) => !p.hostelId || (warden?.hostelId && String(p.hostelId) === String(warden.hostelId)));
    }
    const data = await Promise.all(history.map(async (p) => serializePoll(p)));
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

    // Hostel security: student may only vote in polls for their hostel (or global).
    if (!pollVisibleToStudent(poll, student)) return forbidden(res, "Poll is not available for your hostel");

    const status = getPollStatus(poll);
    if (status !== "active") return badRequest(res, status === "scheduled" ? "Poll has not started yet." : "Poll is closed.");

    const { optionIds } = req.body;
    if (!Array.isArray(optionIds) || optionIds.length === 0) return badRequest(res, "optionIds array is required");
    if (poll.type === "single_choice" && optionIds.length !== 1) return badRequest(res, "Select exactly one option");

    const validIds = new Set(poll.options.map((o) => String(o._id)));
    for (const id of optionIds) {
      if (!validIds.has(String(id))) return badRequest(res, "Invalid option selected");
    }

    const existing = await Vote.findOne({ pollId: poll._id, studentId: student._id });

    if (existing) {
      // Vote change: keep ONE vote record; adjust option counters.
      const oldIds = new Set((existing.optionIds || []).map((id) => String(id)));
      const newIds = new Set(optionIds.map((id) => String(id)));
      for (const id of oldIds) {
        if (!newIds.has(id)) {
          await Poll.updateOne({ _id: poll._id, "options._id": id }, { $inc: { "options.$.votes": -1 } });
        }
      }
      for (const id of newIds) {
        if (!oldIds.has(id)) {
          await Poll.updateOne({ _id: poll._id, "options._id": id }, { $inc: { "options.$.votes": 1 } });
        }
      }
      existing.optionIds = optionIds;
      await existing.save();
      return res.status(200).json({ success: true, message: "Your vote has been updated.", data: { pollId: poll._id, voted: true, changed: true } });
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

// ─── Admin / Warden endpoints ───────────────────────────────
export const listPolls = async (req, res) => {
  try {
    const { status } = req.query;
    const user = await User.findById(req.user.id).select("role hostelId");

    let query = {};
    if (user?.role === "warden" && user.hostelId) {
      query = { $or: [{ hostelId: user.hostelId }, { hostelId: null }] };
    }

    const polls = await Poll.find(query).sort({ createdAt: -1 });
    let data = polls.map((p) => serializePoll(p));
    if (status) data = data.filter((p) => p.status === status);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (e) { return serverError(res, e); }
};

export const createPoll = async (req, res) => {
  try {
    const { question, description, type, options, startAt, endAt, hostelId, isGlobal } = req.body;
    if (!question) return badRequest(res, "Question is required");
    if (String(question).trim().length > 300) return badRequest(res, "Question is too long");
    if (!Array.isArray(options) || options.length < 2) return badRequest(res, "At least 2 options are required");

    // Normalize + reject duplicate options (case/spacing insensitive).
    const seen = new Set();
    const clean = [];
    for (const o of options) {
      const text = o && String(o).trim();
      if (!text) continue;
      const key = text.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(key)) return badRequest(res, "Duplicate options are not allowed");
      seen.add(key);
      clean.push({ text, votes: 0 });
    }
    if (clean.length < 2) return badRequest(res, "At least 2 valid options are required");

    // Warden polls are always scoped to their assigned hostel (from DB).
    let targetHostelId = hostelId || null;
    let global = !!isGlobal;
    if (req.user.role === "warden") {
      const warden = await User.findById(req.user.id).select("hostelId");
      targetHostelId = warden?.hostelId || null;
      global = false;
    }

    const poll = await Poll.create({
      question: String(question).trim(),
      description: description ? String(description).trim() : null,
      hostelId: targetHostelId,
      isGlobal: global,
      type: ["single_choice", "multiple_choice", "rating", "yes_no"].includes(type) ? type : "single_choice",
      options: clean,
      startAt: startAt || new Date(),
      endAt: endAt || null,
      createdBy: req.user.id,
      closed: false,
    });

    logAudit({ userId: req.user.id, action: "POLL_CREATED", entity: "Poll", entityId: poll._id, metadata: { question: poll.question, hostelId: targetHostelId }, req });
    // Notify only eligible students (poll hostel, or all when global).
    await notifyPollEligible({
      poll,
      title: "New Mess Poll",
      message: poll.question,
      dedupKey: `mess_poll:${poll._id}`,
    });
    return res.status(201).json({ success: true, message: "Poll created successfully", data: serializePoll(poll) });
  } catch (e) { return serverError(res, e); }
};

export const updatePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return notFound(res);

    const hasExistingVotes = (await Vote.countDocuments({ pollId: poll._id })) > 0;

    const { question, description, type, startAt, endAt, closed } = req.body;
    const update = {};

    // Lock question/type once voting has begun to preserve result integrity.
    if (hasExistingVotes) {
      if (question !== undefined && String(question).trim() !== poll.question) {
        return badRequest(res, "Question cannot be changed after voting has started");
      }
      if (type !== undefined && type !== poll.type) {
        return badRequest(res, "Poll type cannot be changed after voting has started");
      }
    } else {
      if (question !== undefined) update.question = String(question).trim();
      if (type !== undefined) update.type = ["single_choice", "multiple_choice", "rating", "yes_no"].includes(type) ? type : "single_choice";
    }
    if (description !== undefined) update.description = description ? String(description).trim() : null;
    if (startAt !== undefined) update.startAt = startAt;
    if (endAt !== undefined) update.endAt = endAt;
    if (closed !== undefined) update.closed = !!closed;

    const updated = await Poll.findByIdAndUpdate(poll._id, update, { new: true, runValidators: true });
    if (!updated) return notFound(res);
    return res.status(200).json({ success: true, message: "Poll updated successfully", data: serializePoll(updated) });
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
    const poll = await Poll.findById(req.params.id);
    if (!poll) return notFound(res);
    const voteCount = await Vote.countDocuments({ pollId: poll._id });
    if (voteCount > 0) {
      // Preserve audit/history — archive instead of destructive delete.
      poll.closed = true;
      await poll.save();
      return conflict(res, "Poll has votes and cannot be deleted. It has been closed instead.");
    }
    await Poll.findByIdAndDelete(poll._id);
    logAudit({ userId: req.user.id, action: "POLL_DELETED", entity: "Poll", entityId: poll._id, metadata: { question: poll.question }, req });
    return res.status(200).json({ success: true, message: "Poll deleted successfully" });
  } catch (e) { return serverError(res, e); }
};

// Recomputes option vote counts from the Vote collection (source of truth).
export const recomputePollResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return notFound(res);

    const votes = await Vote.find({ pollId: poll._id });
    const counts = {};
    votes.forEach((v) => {
      (v.optionIds || []).forEach((oid) => {
        const key = String(oid);
        counts[key] = (counts[key] || 0) + 1;
      });
    });

    let changed = false;
    poll.options.forEach((o) => {
      const c = counts[String(o._id)] || 0;
      if (o.votes !== c) { o.votes = c; changed = true; }
    });
    if (changed) await poll.save();

    logAudit({ userId: req.user.id, action: "POLL_RESULTS_RECOMPUTED", entity: "Poll", entityId: poll._id, metadata: { votes: votes.length }, req });
    return res.status(200).json({ success: true, message: "Poll results recomputed", data: serializePoll(poll) });
  } catch (e) { return serverError(res, e); }
};
