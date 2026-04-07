import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true, // "2026-03-28"
      index: true,
    },
    slot: {
      type: String,
      enum: ["morning", "night"],
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "pending"],
      default: "pending",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    accuracy: {
      type: Number,
      default: null,
    },
    distanceFromHostel: {
      type: Number,
      default: null,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ["auto_location", "manual_review"],
      default: "auto_location",
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// one student, one date, one slot
attendanceSchema.index(
  { studentId: 1, date: 1, slot: 1 },
  { unique: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;