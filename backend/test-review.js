import mongoose from "mongoose";
import dotenv from "dotenv";
import Hostel from "./models/hostel.model.js";
import User from "./models/user.model.js";
import StudentProfile from "./models/studentProfile.model.js";
import Attendance from "./models/attendance.model.js";

dotenv.config();

const BASE = "http://localhost:5000/api";

async function login(role) {
  const creds = {
    admin: { phone: "7701966924", password: "Admin@123" },
    warden: { phone: "9999999992", password: "Warden@123" },
  };
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds[role]),
  });
  return (await res.json()).token;
}

async function apiGet(token, ep) {
  const r = await fetch(`${BASE}${ep}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.json();
}

async function apiPatch(token, ep, body) {
  const r = await fetch(`${BASE}${ep}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return r.json();
}

function divider(t) { console.log("──────────────────────────────────────────"); console.log(t); console.log("──────────────────────────────────────────"); }

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const adminToken = await login("admin");
  const wardenToken = await login("warden");
  const student = await User.findOne({ phone: "9999999993" });
  const profile = await StudentProfile.findOne({ userId: student._id });
  const hostel = await Hostel.findOne();
  const today = new Date().toISOString().split("T")[0];

  // Expand windows
  const origWindows = JSON.parse(JSON.stringify(hostel.attendanceWindows));
  await Hostel.findByIdAndUpdate(hostel._id, {
    attendanceWindows: [
      { slot: "morning", startTime: "00:00", endTime: "23:59" },
      { slot: "night", startTime: "00:00", endTime: "23:59" },
    ],
  });

  console.log("========================================");
  console.log("  REVIEW ATTENDANCE TEST SUITE");
  console.log("========================================\n");

  // --- Create 2 PENDING attendance records ---
  console.log("🔧 Creating 2 pending attendance records...\n");

  const rec1 = await Attendance.findOneAndUpdate(
    { studentId: profile._id, date: today, slot: "morning" },
    {
      studentId: profile._id,
      hostelId: hostel._id,
      date: today,
      slot: "morning",
      status: "pending",
      latitude: 28.8390,
      longitude: 78.7735,
      accuracy: 95,
      distanceFromHostel: 45,
      source: "auto_location",
      reason: "Inside radius but accuracy is weak",
    },
    { upsert: true, new: true }
  );

  const rec2 = await Attendance.findOneAndUpdate(
    { studentId: profile._id, date: today, slot: "night" },
    {
      studentId: profile._id,
      hostelId: hostel._id,
      date: today,
      slot: "night",
      status: "pending",
      latitude: 28.8387,
      longitude: 78.7732,
      accuracy: 10,
      distanceFromHostel: 15,
      source: "auto_location",
      reason: "Mock location suspected",
    },
    { upsert: true, new: true }
  );

  console.log(`   Created: ${rec1._id} (morning, pending)`);
  console.log(`   Created: ${rec2._id} (night, pending)\n`);

  // ============================================================
  //  TEST 1: Admin views pending list
  // ============================================================
  divider("TEST 1: Admin views pending attendance");
  const t1 = await apiGet(adminToken, "/attendance/pending");
  console.log(`   Success: ${t1.success}`);
  console.log(`   Pending count: ${t1.count}`);
  t1.data.forEach((r) => {
    console.log(`   → ${r._id} | ${r.studentId?.userId?.name} | ${r.date} ${r.slot} | ${r.reason}`);
  });
  console.log("");

  // ============================================================
  //  TEST 2: Admin reviews record 1 → PRESENT
  // ============================================================
  divider("TEST 2: Admin approves pending → PRESENT");
  const t2 = await apiPatch(adminToken, `/attendance/${rec1._id}/review`, {
    status: "present",
    reason: "Verified via manual GPS check — student is on campus",
  });
  console.log(`   Success:  ${t2.success}`);
  console.log(`   ID:       ${t2.data?._id}`);
  console.log(`   Status:   ${t2.data?.status?.toUpperCase()}`);
  console.log(`   Reason:   ${t2.data?.reason}`);
  console.log(`   Source:   ${t2.data?.source}`);
  console.log("");

  // ============================================================
  //  TEST 3: Warden reviews record 2 → ABSENT
  // ============================================================
  divider("TEST 3: Warden reviews pending → ABSENT");
  const t3 = await apiPatch(wardenToken, `/attendance/${rec2._id}/review`, {
    status: "absent",
    reason: "Mock location detected — student not verified on campus",
  });
  console.log(`   Success:  ${t3.success}`);
  console.log(`   ID:       ${t3.data?._id}`);
  console.log(`   Status:   ${t3.data?.status?.toUpperCase()}`);
  console.log(`   Reason:   ${t3.data?.reason}`);
  console.log(`   Source:   ${t3.data?.source}`);
  console.log("");

  // ============================================================
  //  TEST 4: Verify pending count is now 0
  // ============================================================
  divider("TEST 4: Verify no pending records remain");
  const t4 = await apiGet(adminToken, "/attendance/pending");
  console.log(`   Pending count: ${t4.count} ${t4.count === 0 ? "✅" : "❌"}`);
  console.log("");

  // ============================================================
  //  TEST 5: Verify updated attendance summary
  // ============================================================
  divider("TEST 5: Updated attendance summary");
  const t5 = await apiGet(adminToken, `/attendance/summary?date=${today}`);
  console.log(`   Date: ${t5.date}`);
  t5.data.forEach((s) => {
    console.log(`   → ${s._id.toUpperCase()}: ${s.count} students`);
  });
  console.log("");

  // ============================================================
  //  TEST 6: Student sees updated records
  // ============================================================
  divider("TEST 6: Student views their updated attendance");
  const studentToken = await login("warden"); // re-login as student
  const studentCreds = { phone: "9999999993", password: "Student@123" };
  const sRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentCreds),
  });
  const sToken = (await sRes.json()).token;

  const t6 = await apiGet(sToken, "/attendance/my");
  console.log(`   Count: ${t6.count}`);
  t6.data.forEach((a) => {
    console.log(`   → ${a.date} | ${a.slot.padEnd(7)} | ${a.status.toUpperCase().padEnd(8)} | ${a.reason}`);
  });
  console.log("");

  // ============================================================
  //  TEST 7: Invalid status rejected
  // ============================================================
  divider("TEST 7: Invalid status rejected by review endpoint");
  const t7 = await apiPatch(adminToken, `/attendance/${rec1._id}/review`, {
    status: "maybe",
    reason: "Trying invalid status",
  });
  console.log(`   Success: ${t7.success} ${t7.success ? "❌" : "✅"}`);
  console.log(`   Message: ${t7.message}`);
  console.log("");

  // ============================================================
  //  TEST 8: Invalid attendance ID rejected
  // ============================================================
  divider("TEST 8: Non-existent attendance ID rejected");
  const fakeId = "507f1f77bcf86cd799439011";
  const t8 = await apiPatch(adminToken, `/attendance/${fakeId}/review`, {
    status: "present",
    reason: "Fake ID",
  });
  console.log(`   Success: ${t8.success} ${t8.success ? "❌" : "✅"}`);
  console.log(`   Message: ${t8.message}`);
  console.log("");

  // --- Restore ---
  await Hostel.findByIdAndUpdate(hostel._id, { attendanceWindows: origWindows });
  await mongoose.disconnect();

  console.log("========================================");
  console.log("  ALL REVIEW TESTS COMPLETED");
  console.log("========================================");
}

main().catch((e) => { console.error("Test failed:", e.message); process.exit(1); });
