import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["vegetable", "dish", "breakfast", "lunch", "dinner", "snack", "general"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "implemented"],
      default: "pending",
    },
    adminResponse: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

const Suggestion = mongoose.model("Suggestion", suggestionSchema);
export default Suggestion;
