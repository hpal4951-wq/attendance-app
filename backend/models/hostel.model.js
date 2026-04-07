import mongoose from "mongoose";

const attendanceWindowSchema = new mongoose.Schema(
  {
    slot: {
      type: String,
      enum: ["morning", "night"],
      required: true,
    },
    startTime: {
      type: String,
      required: true, // e.g. "06:00"
    },
    endTime: {
      type: String,
      required: true, // e.g. "07:00"
    },
  },
  { _id: false }
);

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    radiusMeters: {
      type: Number,
      required: true,
      default: 120,
    },
    attendanceWindows: {
      type: [attendanceWindowSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Hostel = mongoose.model("Hostel", hostelSchema);
export default Hostel;