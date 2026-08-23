import Menu from "../models/menu.model.js";
import { getTodayDateString, shiftDate } from "../utils/date.js";
import { logAudit } from "../utils/audit.js";
import { notifyAllStudents } from "../utils/notify.js";

const badRequest = (res, msg) => res.status(400).json({ success: false, message: msg });
const notFound = (res, msg = "Menu not found") => res.status(404).json({ success: false, message: msg });
const serverError = (res, error) => {
  console.error("mess.controller error:", error);
  return res.status(500).json({ success: false, message: "Server error. Please try again later.", error: error.message });
};

const MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"];

export const getMenu = async (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    const menus = await Menu.find({ date });
    const menu = MEAL_TYPES.map((mealType) => {
      const m = menus.find((x) => x.mealType === mealType);
      return { mealType, items: m ? m.items : [], _id: m ? m._id : null };
    });
    return res.status(200).json({ success: true, data: { date, menu } });
  } catch (e) { return serverError(res, e); }
};

export const getWeeklyMenu = async (req, res) => {
  try {
    const today = getTodayDateString();
    const days = [];
    for (let i = 0; i < 7; i++) days.push(shiftDate(today, i));
    const menus = await Menu.find({ date: { $in: days } });
    const data = days.map((date) => {
      const meals = {};
      MEAL_TYPES.forEach((mealType) => {
        const m = menus.find((x) => x.date === date && x.mealType === mealType);
        meals[mealType] = m ? m.items : [];
      });
      return { date, meals };
    });
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (e) { return serverError(res, e); }
};

export const createMenu = async (req, res) => {
  try {
    const { date, mealType, items } = req.body;
    if (!date) return badRequest(res, "Date is required");
    if (!mealType || !MEAL_TYPES.includes(mealType)) return badRequest(res, "Valid mealType is required");
    if (!Array.isArray(items) || items.length === 0) return badRequest(res, "At least one food item is required");
    const clean = items.filter((i) => i && String(i).trim()).map((i) => String(i).trim());
    const menu = await Menu.findOneAndUpdate(
      { date, mealType },
      { date, mealType, items: clean },
      { upsert: true, new: true }
    );
    logAudit({ userId: req.user.id, action: "MENU_UPDATED", entity: "Menu", entityId: menu._id, metadata: { date, mealType }, req });
    notifyAllStudents({
      title: "Mess menu updated",
      message: `${date} ${mealType} menu has been updated.`,
      type: "mess",
      data: { date, mealType },
    });
    return res.status(201).json({ success: true, message: "Menu saved successfully", data: menu });
  } catch (e) { return serverError(res, e); }
};

export const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, mealType, items } = req.body;
    const update = {};
    if (date) update.date = date;
    if (mealType) update.mealType = mealType;
    if (items !== undefined) update.items = items.filter((i) => i && String(i).trim()).map((i) => String(i).trim());
    const menu = await Menu.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!menu) return notFound(res);
    return res.status(200).json({ success: true, message: "Menu updated successfully", data: menu });
  } catch (e) { return serverError(res, e); }
};

export const deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) return notFound(res);
    return res.status(200).json({ success: true, message: "Menu deleted successfully" });
  } catch (e) { return serverError(res, e); }
};