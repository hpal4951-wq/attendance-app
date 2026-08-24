import Menu from "../models/menu.model.js";
import User from "../models/user.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import { getTodayDateString, shiftDate } from "../utils/date.js";
import { notifyHostelStudents } from "../services/notification.service.js";
import { logAudit } from "../utils/audit.js";

const badRequest = (res, msg) => res.status(400).json({ success: false, message: msg });
const notFound = (res, msg = "Menu not found") => res.status(404).json({ success: false, message: msg });
const serverError = (res, error) => {
  console.error("mess.controller error:", error);
  return res.status(500).json({ success: false, message: "Server error. Please try again later." });
};

const MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"];
const MENU_STATUSES = ["draft", "published", "archived"];

// Determines the hostel scope from the authenticated user's database record.
// Students → their assigned hostel; warden → assigned hostel; admin → ?hostelId query.
const getScopeHostel = async (req) => {
  const user = await User.findById(req.user.id).select("role hostelId");
  if (!user) return null;
  if (user.role === "warden") return user.hostelId ? String(user.hostelId) : null;
  if (user.role === "student") {
    const sp = await StudentProfile.findOne({ userId: user._id }).select("hostelId");
    return sp?.hostelId ? String(sp.hostelId) : null;
  }
  return req.query.hostelId || null;
};

export const getMenu = async (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    const scopeHostel = await getScopeHostel(req);
    const query = { date };
    // Students see their hostel's menus plus any global (hostelId null) menus.
    if (scopeHostel) query.hostelId = { $in: [scopeHostel, null] };
    if (req.user.role === "student") query.status = "published";

    const menus = await Menu.find(query);
    const menu = MEAL_TYPES.map((mealType) => {
      const m = menus.find((x) => x.mealType === mealType);
      return { mealType, items: m ? m.items : [], _id: m ? m._id : null, status: m ? m.status : null };
    });
    return res.status(200).json({ success: true, data: { date, menu } });
  } catch (e) { return serverError(res, e); }
};

// Today's menu for the authenticated student's assigned hostel.
export const getTodayMenu = async (req, res) => {
  req.query.date = getTodayDateString();
  return getMenu(req, res);
};

export const getWeeklyMenu = async (req, res) => {
  try {
    const today = getTodayDateString();
    const days = [];
    for (let i = 0; i < 7; i++) days.push(shiftDate(today, i));
    const scopeHostel = await getScopeHostel(req);
    const query = { date: { $in: days } };
    if (scopeHostel) query.hostelId = { $in: [scopeHostel, null] };
    if (req.user.role === "student") query.status = "published";

    const menus = await Menu.find(query);
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
    const { date, mealType, items, status } = req.body;
    if (!date) return badRequest(res, "Date is required");
    if (!mealType || !MEAL_TYPES.includes(mealType)) return badRequest(res, "Valid mealType is required");
    if (!Array.isArray(items) || items.length === 0) return badRequest(res, "At least one food item is required");

    const clean = items.filter((i) => i && String(i).trim()).map((i) => String(i).trim());
    if (clean.length === 0) return badRequest(res, "At least one food item is required");

    // Hostel is derived for warden (never trusted from client); admin may set it.
    let hostelId = req.body.hostelId || null;
    if (req.user.role === "warden") {
      const warden = await User.findById(req.user.id).select("hostelId");
      hostelId = warden?.hostelId || null;
    }
    const cleanStatus = MENU_STATUSES.includes(status) ? status : "published";

    const menu = await Menu.findOneAndUpdate(
      { hostelId: hostelId || null, date, mealType },
      {
        hostelId: hostelId || null,
        date,
        mealType,
        items: clean,
        status: cleanStatus,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    logAudit({ userId: req.user.id, action: "MENU_UPDATED", entity: "Menu", entityId: menu._id, metadata: { date, mealType, hostelId }, req });
    // Notify only the relevant hostel's students when a menu is published.
    if (cleanStatus === "published") {
      await notifyHostelStudents({
        hostelId: hostelId || null,
        title: "New Mess Menu",
        message: `${date} ${mealType} menu is now available.`,
        type: "mess",
        data: { date, mealType, hostelId: hostelId || null, channelId: "mess" },
        dedupKey: `mess_menu:${hostelId || "global"}:${date}:${mealType}`,
      });
    }
    return res.status(201).json({ success: true, message: "Menu saved successfully", data: menu });
  } catch (e) { return serverError(res, e); }
};

export const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, mealType, items, status } = req.body;
    const update = { updatedBy: req.user.id };
    if (date) update.date = date;
    if (mealType && MEAL_TYPES.includes(mealType)) update.mealType = mealType;
    if (items !== undefined) {
      update.items = items.filter((i) => i && String(i).trim()).map((i) => String(i).trim());
    }
    if (status && MENU_STATUSES.includes(status)) update.status = status;
    const menu = await Menu.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!menu) return notFound(res);
    return res.status(200).json({ success: true, message: "Menu updated successfully", data: menu });
  } catch (e) { return serverError(res, e); }
};

export const deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return notFound(res);
    // Prefer archiving published menus (students may have seen them).
    if (menu.status === "published") {
      menu.status = "archived";
      await menu.save();
      return res.status(200).json({ success: true, message: "Menu archived", data: menu });
    }
    await Menu.findByIdAndDelete(menu._id);
    return res.status(200).json({ success: true, message: "Menu deleted successfully" });
  } catch (e) { return serverError(res, e); }
};
