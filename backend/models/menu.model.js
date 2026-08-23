import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true, // "2026-08-23"
      index: true,
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
  },
  { timestamps: true }
);

menuSchema.index({ date: 1, mealType: 1 }, { unique: true });

const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
