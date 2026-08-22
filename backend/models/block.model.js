import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    floors: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

blockSchema.index({ hostelId: 1, name: 1 }, { unique: true });

const Block = mongoose.model("Block", blockSchema);
export default Block;
