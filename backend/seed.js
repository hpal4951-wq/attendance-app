import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Hostel from "./models/hostel.model.js";
import User from "./models/user.model.js";
import StudentProfile from "./models/studentProfile.model.js";
import Block from "./models/block.model.js";
import Room from "./models/room.model.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seed");

    await Promise.all([
      Hostel.deleteMany({}),
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      Block.deleteMany({}),
      Room.deleteMany({}),
    ]);

    const hostel = await Hostel.create({
      name: "Boys Hostel A",
      address: "Moradabad Campus",
      latitude: 28.8386,
      longitude: 78.7731,
      radiusMeters: 120,
      attendanceWindows: [
        {
          slot: "morning",
          startTime: "06:00",
          endTime: "07:00",
        },
        {
          slot: "night",
          startTime: "20:30",
          endTime: "21:30",
        },
      ],
    });

    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const wardenPassword = await bcrypt.hash("Warden@123", 10);
    const studentPassword = await bcrypt.hash("Student@123", 10);

    const admin = await User.create({
      name: "Main Admin",
      phone: "7701966924",
      email: "admin@test.com",
      password: adminPassword,
      role: "admin",
      hostelId: hostel._id,
      deviceId: "admin-device-001",
    });

    const warden = await User.create({
      name: "Hostel Warden",
      phone: "9999999992",
      email: "warden@test.com",
      password: wardenPassword,
      role: "warden",
      hostelId: hostel._id,
      deviceId: "warden-device-001",
    });

    const studentUser = await User.create({
      name: "Harsh Student",
      phone: "9999999993",
      email: "student@test.com",
      password: studentPassword,
      role: "student",
      hostelId: hostel._id,
      deviceId: "student-device-001",
    });

    const studentProfile = await StudentProfile.create({
      userId: studentUser._id,
      studentCode: "STU001",
      roomNumber: "A-101",
      course: "B.Tech",
      year: "3rd",
      parentName: "Parent Name",
      parentPhone: "8888888888",
      status: "active",
    });

    // --- Admin module demo data: Block A + rooms ---
    const blockA = await Block.create({
      hostelId: hostel._id,
      name: "Block A",
      floors: 4,
      status: "active",
    });

    const roomA101 = await Room.create({
      hostelId: hostel._id,
      blockId: blockA._id,
      roomNumber: "A-101",
      floor: 1,
      capacity: 4,
      occupied: 0,
      status: "available",
    });

    await Room.create([
      { hostelId: hostel._id, blockId: blockA._id, roomNumber: "A-102", floor: 1, capacity: 4 },
      { hostelId: hostel._id, blockId: blockA._id, roomNumber: "A-201", floor: 2, capacity: 4 },
      { hostelId: hostel._id, blockId: blockA._id, roomNumber: "A-202", floor: 2, capacity: 3 },
    ]);

    // Assign seeded student to A-101 and link warden to Block A
    studentProfile.hostelId = hostel._id;
    studentProfile.blockId = blockA._id;
    studentProfile.roomId = roomA101._id;
    studentProfile.roomNumber = roomA101.roomNumber;
    await studentProfile.save();

    await Room.findByIdAndUpdate(roomA101._id, { $inc: { occupied: 1 } });
    await User.findByIdAndUpdate(warden._id, { blockId: blockA._id });

    console.log("Seed completed successfully");
    console.log({
      hostelId: hostel._id,
      adminId: admin._id,
      wardenId: warden._id,
      studentUserId: studentUser._id,
      studentProfileId: studentProfile._id,
    });

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();