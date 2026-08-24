import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { logAudit } from "../utils/audit.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const login = async (req, res) => {
  try {
    const { phone, password, deviceId } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "phone and password are required",
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      await logAudit({ action: "LOGIN_FAILED", entity: "User", metadata: { phone }, req });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.deviceId && deviceId) {
      user.deviceId = deviceId;
      await user.save();
    }

    await user.populate(["hostelId", "blockId"]);
    const token = generateToken(user);

    logAudit({ userId: user._id, action: "LOGIN_SUCCESS", entity: "User", entityId: user._id, metadata: { role: user.role, phone }, req });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("hostelId")
      .populate("blockId");

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("me error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message,
    });
  }
};

export const saveDevice = async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "deviceId is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { deviceId },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Device saved successfully",
      data: user,
    });
  } catch (error) {
    console.error("saveDevice error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving device",
      error: error.message,
    });
  }
};