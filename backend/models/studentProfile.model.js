import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    studentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
      default: null,
    },
    course: {
      type: String,
      trim: true,
      default: null,
    },
    year: {
      type: String,
      trim: true,
      default: null,
    },
    parentName: {
      type: String,
      trim: true,
      default: null,
    },
    parentPhone: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  { timestamps: true }
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
export default StudentProfile;