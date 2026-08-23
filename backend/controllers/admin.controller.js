import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import Hostel from "../models/hostel.model.js";
import Block from "../models/block.model.js";
import Room from "../models/room.model.js";
import { logAudit } from "../utils/audit.js";

const STUDENT_POPULATE = [
  { path: "userId", select: "name phone email isActive" },
  { path: "hostelId", select: "name address" },
  { path: "blockId", select: "name" },
  { path: "roomId", select: "roomNumber floor capacity status" },
];

const isValidId = (id) => mongoose.isValidObjectId(id);

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });

const notFound = (res, message = "Resource not found") =>
  res.status(404).json({ success: false, message });

const serverError = (res, error) => {
  console.error("admin.controller error:", error);
  return res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
    error: error.message,
  });
};

const syncRoomStatus = async (roomId) => {
  const room = await Room.findById(roomId);
  if (!room) return;
  const isFull = room.occupied >= room.capacity;
  let next = room.status;
  if (room.status !== "maintenance") {
    next = isFull ? "full" : "available";
  }
  if (next !== room.status) {
    await Room.findByIdAndUpdate(roomId, { status: next });
  }
};

// ─── Dashboard ─────────────────────────────────────────────
export const getDashboard = async (req, res) => {
  try {
    const [totalStudents, totalWardens, totalHostels, totalBlocks, totalRooms] =
      await Promise.all([
        StudentProfile.countDocuments({}),
        User.countDocuments({ role: "warden" }),
        Hostel.countDocuments({}),
        Block.countDocuments({}),
        Room.countDocuments({}),
      ]);

    const recent = await StudentProfile.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: "userId", select: "name" });

    const recentActivities = recent.map((s) => ({
      id: String(s._id),
      title: "New student added",
      description: s.userId?.name || s.studentCode,
      time: s.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalWardens,
        totalHostels,
        totalBlocks,
        totalRooms,
        recentActivities,
      },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

// ─── Hostels ───────────────────────────────────────────────
export const getHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find({}).sort({ createdAt: -1 });

    const data = await Promise.all(
      hostels.map(async (h) => {
        const [blocks, rooms] = await Promise.all([
          Block.countDocuments({ hostelId: h._id }),
          Room.countDocuments({ hostelId: h._id }),
        ]);
        return {
          _id: h._id,
          name: h.name,
          address: h.address,
          latitude: h.latitude,
          longitude: h.longitude,
          radiusMeters: h.radiusMeters,
          attendanceWindows: h.attendanceWindows,
          blockCount: blocks,
          roomCount: rooms,
          createdAt: h.createdAt,
        };
      })
    );

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return serverError(res, error);
  }
};

export const createHostel = async (req, res) => {
  try {
    const { name, address, latitude, longitude, attendanceRadius, radiusMeters } =
      req.body;

    if (!name || !String(name).trim()) {
      return badRequest(res, "Hostel name is required");
    }
    if (latitude === undefined || latitude === null || isNaN(Number(latitude))) {
      return badRequest(res, "Valid latitude is required");
    }
    if (
      longitude === undefined ||
      longitude === null ||
      isNaN(Number(longitude))
    ) {
      return badRequest(res, "Valid longitude is required");
    }
    const radius = attendanceRadius ?? radiusMeters ?? 120;
    if (isNaN(Number(radius)) || Number(radius) <= 0) {
      return badRequest(res, "Attendance radius must be a positive number");
    }

    const hostel = await Hostel.create({
      name: String(name).trim(),
      address: address ? String(address).trim() : null,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusMeters: Number(radius),
    });

    logAudit({ userId: req.user.id, action: "HOSTEL_CREATED", entity: "Hostel", entityId: hostel._id, metadata: { name: hostel.name }, req });

    return res.status(201).json({
      success: true,
      message: "Hostel created successfully",
      data: hostel,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

// ─── Blocks ────────────────────────────────────────────────
export const getBlocks = async (req, res) => {
  try {
    const { hostelId } = req.query;
    if (!hostelId) {
      return badRequest(res, "hostelId query is required");
    }
    if (!isValidId(hostelId)) {
      return badRequest(res, "Invalid hostelId");
    }

    const blocks = await Block.find({ hostelId }).sort({ name: 1 });

    const data = await Promise.all(
      blocks.map(async (b) => {
        const rooms = await Room.countDocuments({ blockId: b._id });
        return {
          _id: b._id,
          name: b.name,
          floors: b.floors,
          status: b.status,
          hostelId: b.hostelId,
          roomCount: rooms,
        };
      })
    );

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return serverError(res, error);
  }
};

export const createBlock = async (req, res) => {
  try {
    const { hostelId, name, floors } = req.body;

    if (!hostelId) return badRequest(res, "hostelId is required");
    if (!isValidId(hostelId)) return badRequest(res, "Invalid hostelId");
    if (!name || !String(name).trim()) {
      return badRequest(res, "Block name is required");
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return notFound(res, "Hostel not found");

    const floorCount = Number(floors);
    if (isNaN(floorCount) || floorCount < 1) {
      return badRequest(res, "Floors must be at least 1");
    }

    const block = await Block.create({
      hostelId,
      name: String(name).trim(),
      floors: floorCount,
    });

    logAudit({ userId: req.user.id, action: "BLOCK_CREATED", entity: "Block", entityId: block._id, metadata: { name: block.name, hostelId }, req });
    return res.status(201).json({
      success: true,
      message: "Block created successfully",
      data: block,
    });
  } catch (error) {
    if (error.code === 11000) {
      return badRequest(res, "A block with this name already exists in the hostel");
    }
    return serverError(res, error);
  }
};
export const getRooms = async (req, res) => {
  try {
    const { blockId, hostelId } = req.query;
    if (!blockId && !hostelId) {
      return badRequest(res, "blockId or hostelId query is required");
    }

    const filter = {};
    if (blockId) filter.blockId = blockId;
    if (hostelId) filter.hostelId = hostelId;

    const rooms = await Room.find(filter).sort({ roomNumber: 1 });

    const data = rooms.map((r) => ({
      _id: r._id,
      roomNumber: r.roomNumber,
      floor: r.floor,
      capacity: r.capacity,
      occupied: r.occupied,
      available: Math.max(0, r.capacity - r.occupied),
      status: r.status,
      hostelId: r.hostelId,
      blockId: r.blockId,
    }));

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return serverError(res, error);
  }
};

export const createRoom = async (req, res) => {
  try {
    const { hostelId, blockId, roomNumber, floor, capacity, status } = req.body;

    if (!hostelId) return badRequest(res, "hostelId is required");
    if (!blockId) return badRequest(res, "blockId is required");
    if (!roomNumber || !String(roomNumber).trim()) {
      return badRequest(res, "Room number is required");
    }
    if (capacity === undefined || isNaN(Number(capacity)) || Number(capacity) <= 0) {
      return badRequest(res, "Capacity must be a positive number");
    }

    const block = await Block.findById(blockId);
    if (!block) return notFound(res, "Block not found");
    if (String(block.hostelId) !== String(hostelId)) {
      return badRequest(res, "Block does not belong to the selected hostel");
    }

    const validStatus = ["available", "full", "maintenance"];
    const roomStatus = status && validStatus.includes(status) ? status : "available";

    const room = await Room.create({
      hostelId,
      blockId,
      roomNumber: String(roomNumber).trim(),
      floor: floor === undefined || floor === "" ? 0 : Number(floor),
      capacity: Number(capacity),
      status: roomStatus,
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });
  } catch (error) {
    if (error.code === 11000) {
      return badRequest(res, "A room with this number already exists in the block");
    }
    return serverError(res, error);
  }
};

// ─── Students ──────────────────────────────────────────────
export const getStudents = async (req, res) => {
  try {
    const { search, hostelId, blockId, roomId, status, page = 1, limit = 20 } =
      req.query;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const query = {};
    if (hostelId) query.hostelId = hostelId;
    if (blockId) query.blockId = blockId;
    if (roomId) query.roomId = roomId;
    if (status) query.status = status;

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), "i");
      const users = await User.find({
        $or: [{ name: regex }, { phone: regex }],
      }).select("_id");
      const userIds = users.map((u) => u._id);
      query.$or = [{ studentCode: regex }, { userId: { $in: userIds } }];
    }

    const total = await StudentProfile.countDocuments(query);
    const pages = Math.max(1, Math.ceil(total / l));

    const students = await StudentProfile.find(query)
      .populate(STUDENT_POPULATE)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l);

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
      pagination: { page: p, limit: l, total, pages },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const createStudent = async (req, res) => {
  try {
    const {
      name,
      studentId,
      phone,
      password,
      course,
      year,
      hostelId,
      blockId,
      roomId,
    } = req.body;

    if (!name || !String(name).trim()) return badRequest(res, "Name is required");
    if (!studentId || !String(studentId).trim()) {
      return badRequest(res, "Student ID is required");
    }
    if (!phone || !String(phone).trim()) return badRequest(res, "Phone is required");
    if (!password) return badRequest(res, "Password is required");
    if (!hostelId) return badRequest(res, "Hostel is required");

    const [phoneExists, codeExists] = await Promise.all([
      User.findOne({ phone }),
      StudentProfile.findOne({ studentCode: studentId }),
    ]);
    if (phoneExists) {
      return badRequest(res, "A user with this phone number already exists");
    }
    if (codeExists) {
      return badRequest(res, "A student with this Student ID already exists");
    }

    let room = null;
    if (roomId) {
      room = await Room.findById(roomId);
      if (!room) return notFound(res, "Room not found");
      if (blockId && String(room.blockId) !== String(blockId)) {
        return badRequest(res, "Room does not belong to the selected block");
      }
      if (hostelId && String(room.hostelId) !== String(hostelId)) {
        return badRequest(res, "Room does not belong to the selected hostel");
      }
      if (room.status === "maintenance") {
        return badRequest(res, "Cannot assign a maintenance room");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      password: hashedPassword,
      role: "student",
      hostelId,
      blockId: blockId || null,
    });

    const student = await StudentProfile.create({
      userId: user._id,
      studentCode: String(studentId).trim(),
      roomNumber: room ? room.roomNumber : null,
      course: course ? String(course).trim() : null,
      year: year !== undefined && year !== "" ? String(year) : null,
      hostelId,
      blockId: blockId || null,
      roomId: roomId || null,
      status: "active",
    });

    if (room) {
      await Room.findByIdAndUpdate(room._id, { $inc: { occupied: 1 } });
      await syncRoomStatus(room._id);
    }

    const populated = await StudentProfile.findById(student._id).populate(
      STUDENT_POPULATE
    );

    logAudit({ userId: req.user.id, action: "STUDENT_CREATED", entity: "StudentProfile", entityId: student._id, metadata: { name, studentId }, req });

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return badRequest(res, "Duplicate record — check phone or Student ID");
    }
    return serverError(res, error);
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return notFound(res, "Student not found");

    const student = await StudentProfile.findById(id).populate(STUDENT_POPULATE);
    if (!student) return notFound(res, "Student not found");

    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    return serverError(res, error);
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return notFound(res, "Student not found");

    const student = await StudentProfile.findById(id);
    if (!student) return notFound(res, "Student not found");

    const { name, studentId, phone, course, year, status } = req.body;

    const profileUpdates = {};
    if (studentId !== undefined) {
      profileUpdates.studentCode = String(studentId).trim();
    }
    if (course !== undefined) profileUpdates.course = String(course).trim();
    if (year !== undefined && year !== "") profileUpdates.year = String(year);
    if (status !== undefined) {
      if (!["active", "inactive", "suspended"].includes(status)) {
        return badRequest(res, "Invalid status");
      }
      profileUpdates.status = status;
    }
    Object.assign(student, profileUpdates);
    await student.save();

    if (name !== undefined || phone !== undefined) {
      await User.findByIdAndUpdate(
        student.userId,
        {
          ...(name !== undefined ? { name: String(name).trim() } : {}),
          ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
        },
        { runValidators: true }
      );
    }

    const populated = await StudentProfile.findById(student._id).populate(
      STUDENT_POPULATE
    );

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return badRequest(res, "Duplicate record — check phone or Student ID");
    }
    return serverError(res, error);
  }
};

export const setStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "suspended"].includes(status)) {
      return badRequest(res, "Invalid status");
    }
    if (!isValidId(id)) return notFound(res, "Student not found");

    const student = await StudentProfile.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate(STUDENT_POPULATE);

    if (!student) return notFound(res, "Student not found");

    return res.status(200).json({
      success: true,
      message: `Student marked as ${status}`,
      data: student,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const assignStudentRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { hostelId, blockId, roomId } = req.body;

    if (!isValidId(id)) return notFound(res, "Student not found");
    if (!hostelId || !blockId || !roomId) {
      return badRequest(res, "hostelId, blockId and roomId are required");
    }

    const student = await StudentProfile.findById(id);
    if (!student) return notFound(res, "Student not found");

    const room = await Room.findById(roomId);
    if (!room) return notFound(res, "Room not found");
    if (String(room.blockId) !== String(blockId)) {
      return badRequest(res, "Room does not belong to the selected block");
    }
    if (String(room.hostelId) !== String(hostelId)) {
      return badRequest(res, "Room does not belong to the selected hostel");
    }
    if (room.status === "maintenance") {
      return badRequest(res, "Cannot assign a maintenance room");
    }

    if (student.roomId && String(student.roomId) !== String(roomId)) {
      await Room.findByIdAndUpdate(student.roomId, { $inc: { occupied: -1 } });
      await syncRoomStatus(student.roomId);
    }

    if (!student.roomId || String(student.roomId) !== String(roomId)) {
      await Room.findByIdAndUpdate(roomId, { $inc: { occupied: 1 } });
      await syncRoomStatus(roomId);
    }

    student.hostelId = hostelId;
    student.blockId = blockId;
    student.roomId = roomId;
    student.roomNumber = room.roomNumber;
    await student.save();

    await User.findByIdAndUpdate(student.userId, { hostelId, blockId });

    const populated = await StudentProfile.findById(student._id).populate(
      STUDENT_POPULATE
    );

    return res.status(200).json({
      success: true,
      message: "Room assigned successfully",
      data: populated,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

// ─── Wardens ───────────────────────────────────────────────
export const getWardens = async (req, res) => {
  try {
    const wardens = await User.find({ role: "warden" })
      .populate({ path: "hostelId", select: "name address" })
      .populate({ path: "blockId", select: "name" })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: wardens.length,
      data: wardens,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const createWarden = async (req, res) => {
  try {
    const { name, phone, password, hostelId, blockId } = req.body;

    if (!name || !String(name).trim()) return badRequest(res, "Name is required");
    if (!phone || !String(phone).trim()) return badRequest(res, "Phone is required");
    if (!password) return badRequest(res, "Password is required");

    const existing = await User.findOne({ phone });
    if (existing) {
      return badRequest(res, "A user with this phone number already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const warden = await User.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      password: hashedPassword,
      role: "warden", // role is always warden for this form — never admin
      hostelId: hostelId || null,
      blockId: blockId || null,
    });

    logAudit({ userId: req.user.id, action: "WARDEN_CREATED", entity: "User", entityId: warden._id, metadata: { name, phone }, req });

    return res.status(201).json({
      success: true,
      message: "Warden created successfully",
      data: warden,
    });
  } catch (error) {
    if (error.code === 11000) {
      return badRequest(res, "A user with this phone number already exists");
    }
    return serverError(res, error);
  }
};
