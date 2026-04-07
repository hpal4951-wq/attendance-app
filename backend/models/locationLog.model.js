import mongoose from "mongoose";

const locationLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: null,
    },
    isMocked: {
      type: Boolean,
      default: false,
    },
    capturedAt: {
      type: Date,
      default: Date.now,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      default: "mobile_app",
    },
  },
  { timestamps: true }
);

const LocationLog = mongoose.model("LocationLog", locationLogSchema);
export default LocationLog;