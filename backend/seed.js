import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Hostel from "./models/hostel.model.js";
import User from "./models/user.model.js";
import StudentProfile from "./models/studentProfile.model.js";
import Block from "./models/block.model.js";
import Room from "./models/room.model.js";
import Menu from "./models/menu.model.js";
import Poll from "./models/poll.model.js";
import Vote from "./models/vote.model.js";
import Suggestion from "./models/suggestion.model.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seed");

await Promise.all([
      Menu.deleteMany({}),
      Poll.deleteMany({}),
      Vote.deleteMany({}),
      Suggestion.deleteMany({}),
      Hostel.deleteMany({}),
      Block.deleteMany({}),
      Room.deleteMany({}),
      User.deleteMany({ role: { $in: ["admin", "warden", "student"] } }),
      StudentProfile.deleteMany({}),
    ]);

    // Clean up legacy indexes that may conflict with schema changes.
    try { await Menu.collection.dropIndex("date_1_mealType_1"); } catch (_) {}
    try { await Menu.collection.dropIndex("hostelId_1_date_1_mealType_1"); } catch (_) {}

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

    // --- Mess module demo data: menu, polls, suggestions (hostel-scoped) ---
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    await Menu.create([
      { hostelId: hostel._id, date: todayStr, mealType: "breakfast", items: ["Poha", "Milk", "Banana"], status: "published", createdBy: admin._id },
      { hostelId: hostel._id, date: todayStr, mealType: "lunch", items: ["Dal", "Rice", "Roti", "Aloo Gobi"], status: "published", createdBy: admin._id },
      { hostelId: hostel._id, date: todayStr, mealType: "snacks", items: ["Tea", "Samosa"], status: "published", createdBy: admin._id },
      { hostelId: hostel._id, date: todayStr, mealType: "dinner", items: ["Paneer", "Dal", "Rice", "Salad"], status: "published", createdBy: admin._id },
    ]);

    const activePoll = await Poll.create({
      question: "Which vegetable should be added next week?",
      description: "Choose your preferred vegetable for next week's menu.",
      type: "single_choice",
      hostelId: hostel._id,
      isGlobal: false,
      options: ["Aloo Gobi", "Bhindi", "Mix Veg", "Palak Paneer"].map((text) => ({ text, votes: 0 })),
      startAt: new Date(Date.now() - 86400000),
      endAt: new Date(Date.now() + 3 * 86400000),
      closed: false,
      createdBy: admin._id,
    });

    const closedPoll = await Poll.create({
      question: "Which evening snack do you prefer?",
      description: "Choose your favourite evening snack.",
      type: "single_choice",
      hostelId: hostel._id,
      isGlobal: false,
      options: ["Samosa", "Poha", "Sandwich"].map((text) => ({ text, votes: 0 })),
      startAt: new Date(Date.now() - 7 * 86400000),
      endAt: new Date(Date.now() - 1 * 86400000),
      closed: true,
      createdBy: admin._id,
    });

    await Vote.create({
      pollId: closedPoll._id,
      studentId: studentProfile._id,
      optionIds: [closedPoll.options[0]._id],
    });
    await Poll.updateOne(
      { _id: closedPoll._id, "options._id": closedPoll.options[0]._id },
      { $inc: { "options.$.votes": 1 } }
    );

    await Suggestion.create({
      studentId: studentProfile._id,
      hostelId: hostel._id,
      type: "vegetable",
      title: "Bhindi Masala",
      description: "Please include this once next week.",
      status: "under_review",
    });

    console.log("Mess demo data created");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();