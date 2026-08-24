import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true, // "2026-08-23" (in APP_TIMEZONE)
      index: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      default: null,
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "snacks", "dinner"],
      required: true,
    },
    items: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// One hostel, one date, one meal type
menuSchema.index({ hostelId: 1, date: 1, mealType: 1 }, { unique: true });

const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
