import mongoose from "mongoose";
import dotenv from "dotenv";
import Hostel from "./models/hostel.model.js";
import User from "./models/user.model.js";
import StudentProfile from "./models/studentProfile.model.js";
import Attendance from "./models/attendance.model.js";
import LocationLog from "./models/locationLog.model.js";

dotenv.config();

const BASE = "http://localhost:5000/api";

// --- Helpers ---
async function loginAs(role) {
  const creds = {
    admin: { phone: "7701966924", password: "Admin@123" },
    warden: { phone: "9999999992", password: "Warden@123" },
    student: { phone: "9999999993", password: "Student@123" },
  };
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds[role]),
  });
  const data = await res.json();
  return data.token;
}

async function apiGet(token, endpoint) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function apiPatch(token, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiPost(token, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

function divider(title) {
  console.log("──────────────────────────────────────────");
  console.log(title);
  console.log("──────────────────────────────────────────");
}

async function main() {
  console.log("========================================");
  console.log("  ADMIN / WARDEN ENDPOINT TESTS");
  console.log("========================================\n");

  // --- Expand attendance window for testing ---
  await mongoose.connect(process.env.MONGO_URI);
  const hostel = await Hostel.findOne();
  const originalWindows = JSON.parse(JSON.stringify(hostel.attendanceWindows));
  await Hostel.findByIdAndUpdate(hostel._id, {
    attendanceWindows: [
      { slot: "morning", startTime: "00:00", endTime: "23:59" },
      { slot: "night", startTime: "00:00", endTime: "23:59" },
    ],
  });
  console.log("🔧 Attendance windows expanded for testing\n");

  // --- Login all roles ---
  const adminToken = await loginAs("admin");
  const wardenToken = await loginAs("warden");
  const studentToken = await loginAs("student");
  console.log("✅ Admin login successful");
  console.log("✅ Warden login successful");
  console.log("✅ Student login successful\n");

  // --- Ensure student has an attendance record ---
  const today = new Date().toISOString().split("T")[0];
  const student = await User.findOne({ phone: "9999999993" });
  const profile = await StudentProfile.findOne({ userId: student._id });
  const hostelDoc = await Hostel.findOne();

  // Create morning + night records if they don't exist
  for (const slot of ["morning", "night"]) {
    const existing = await Attendance.findOne({ studentId: profile._id, date: today, slot });
    if (!existing) {
      await Attendance.create({
        studentId: profile._id,
        hostelId: hostelDoc._id,
        date: today,
        slot,
        status: slot === "morning" ? "present" : "pending",
        latitude: 28.8387,
        longitude: 78.7732,
        accuracy: 10,
        distanceFromHostel: 15,
        markedAt: new Date(),
        source: "auto_location",
        reason: slot === "morning" ? "Inside hostel radius with valid accuracy" : "Mock location suspected",
      });
    }
  }
  console.log(`📋 Test attendance records ensured for ${today}\n`);

  // ============================================================
  //  TEST 1: GET /attendance/list (admin only)
  // ============================================================
  divider("TEST 1: GET /attendance/list?date=... (admin)");
  const t1 = await apiGet(adminToken, `/attendance/list?date=${today}`);
  console.log(`   Success: ${t1.success}`);
  console.log(`   Count:   ${t1.count}`);
  if (t1.data && t1.data.length > 0) {
    t1.data.forEach((r) => {
      const name = r.studentId?.userId?.name || "N/A";
      console.log(`   → ${name} | ${r.slot} | ${r.status.toUpperCase()} | ${r.distanceFromHostel}m`);
    });
  }
  console.log("");

  // ============================================================
  //  TEST 2: GET /attendance/list with slot filter
  // ============================================================
  divider("TEST 2: GET /attendance/list?date=...&slot=morning (admin)");
  const t2 = await apiGet(adminToken, `/attendance/list?date=${today}&slot=morning`);
  console.log(`   Success: ${t2.success}`);
  console.log(`   Count:   ${t2.count} (filtered to morning only)`);
  console.log("");

  // ============================================================
  //  TEST 3: GET /attendance/summary
  // ============================================================
  divider("TEST 3: GET /attendance/summary (admin)");
  const t3 = await apiGet(adminToken, `/attendance/summary?date=${today}`);
  console.log(`   Success: ${t3.success}`);
  console.log(`   Date:    ${t3.date}`);
  if (t3.data && t3.data.length > 0) {
    t3.data.forEach((s) => {
      console.log(`   → ${s._id.toUpperCase()}: ${s.count} students`);
    });
  }
  console.log("")

  // ============================================================
  //  TEST 4: GET /attendance/pending
  // ============================================================
  divider("TEST 4: GET /attendance/pending (admin)");
  const t4 = await apiGet(adminToken, "/attendance/pending");
  console.log(`   Success: ${t4.success}`);
  console.log(`   Count:   ${t4.count} pending records`);
  if (t4.data && t4.data.length > 0) {
    t4.data.forEach((r) => {
      const name = r.studentId?.userId?.name || "N/A";
      console.log(`   → ${r._id} | ${name} | ${r.date} ${r.slot} | ${r.reason}`);
    });
  }
  console.log("")

  // ============================================================
  //  TEST 5: PATCH /attendance/:id/review (mark pending → present)
  // ============================================================
  divider("TEST 5: PATCH /attendance/:id/review (admin)");
  const pendingRecord = t4.data && t4.data[0];
  if (pendingRecord) {
    console.log(`   Reviewing: ${pendingRecord._id}`);
    console.log(`   Student:   ${pendingRecord.studentId?.userId?.name}`);
    console.log(`   Date:      ${pendingRecord.date} ${pendingRecord.slot}`);
    console.log(`   Old status: PENDING`);

    const t5 = await apiPatch(adminToken, `/attendance/${pendingRecord._id}/review`, {
      status: "present",
      reason: "Manually approved by admin — GPS data verified",
    });

    console.log(`   Success: ${t5.success}`);
    console.log(`   New status: ${t5.data?.status?.toUpperCase()}`);
    console.log(`   New reason: ${t5.data?.reason}`);
    console.log(`   Source:     ${t5.data?.source}`);
  } else {
    console.log("   ⚠️  No pending records to review");
  }
  console.log("")

  // ============================================================
  //  TEST 6: PATCH review by warden
  // ============================================================
  divider("TEST 6: PATCH /attendance/:id/review (warden)");
  // Re-fetch pending
  const t6pending = await apiGet(wardenToken, "/attendance/pending");
  const wardenTarget = t6pending.data && t6pending.data[0];
  if (wardenTarget) {
    console.log(`   Warden reviewing: ${wardenTarget._id}`);
    const t6 = await apiPatch(wardenToken, `/attendance/${wardenTarget._id}/review`, {
      status: "absent",
      reason: "Student location not verified — marking absent",
    });
    console.log(`   Success: ${t6.success}`);
    console.log(`   New status: ${t6.data?.status?.toUpperCase()}`);
    console.log(`   Reason:     ${t6.data?.reason}`);
    console.log(`   Source:     ${t6.data?.source}`);
  } else {
    console.log("   ℹ️  No pending records left — all reviewed");
  }
  console.log("")

  // ============================================================
  //  TEST 7: Role-based access control — student blocked
  // ============================================================
  divider("TEST 7: Role-based access — student blocked from admin endpoints");
  const endpoints = [
    { method: "GET", path: "/attendance/list?date=" + today },
    { method: "GET", path: "/attendance/summary?date=" + today },
    { method: "GET", path: "/attendance/pending" },
  ];

  let allBlocked = true;
  for (const ep of endpoints) {
    const res = await apiGet(studentToken, ep.path);
    const blocked = res.success === false && (res.message?.includes("Forbidden") || res.message?.includes("insufficient"));
    const icon = blocked ? "✅" : "❌";
    console.log(`   ${icon} ${ep.method} ${ep.path.split("?")[0]} → ${blocked ? "BLOCKED (403)" : "NOT BLOCKED ⚠️"}`);
    if (!blocked) allBlocked = false;
  }
  console.log(`\n   Role enforcement: ${allBlocked ? "✅ All blocked correctly" : "❌ Some endpoints not protected"}\n`);

  // ============================================================
  //  TEST 8: GET /auth/me (profile for each role)
  // ============================================================
  divider("TEST 8: GET /auth/me (profile check)");
  for (const [role, token] of [["admin", adminToken], ["warden", wardenToken], ["student", studentToken]]) {
    const me = await apiGet(token, "/auth/me");
    console.log(`   ${role}: ${me.data?.name} | phone: ${me.data?.phone} | role: ${me.data?.role}`);
  }
  console.log("")

  // ============================================================
  //  TEST 9: Student gets own attendance
  // ============================================================
  divider("TEST 9: GET /attendance/my (student)");
  const t9 = await apiGet(studentToken, "/attendance/my");
  console.log(`   Success: ${t9.success}`);
  console.log(`   Count:   ${t9.count} records`);
  if (t9.data && t9.data.length > 0) {
    t9.data.forEach((a) => {
      console.log(`   → ${a.date} | ${a.slot.padEnd(7)} | ${a.status.toUpperCase().padEnd(8)} | ${a.reason}`);
    });
  }
  console.log("")

  // --- Restore original windows ---
  await Hostel.findByIdAndUpdate(hostel._id, { attendanceWindows: originalWindows });
  console.log("🔧 Original attendance windows restored");

  await mongoose.disconnect();

  console.log("\n========================================");
  console.log("  ALL ADMIN/WARDEN TESTS COMPLETED");
  console.log("========================================");
}

main().catch((e) => {
  console.error("Test failed:", e.message);
  process.exit(1);
});
