import mongoose from "mongoose";
import dotenv from "dotenv";
import Hostel from "./models/hostel.model.js";

dotenv.config();

const BASE = "http://localhost:5000/api";

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "9999999993", password: "Student@123" }),
  });
  const data = await res.json();
  return data.token;
}

async function autoCheck(token, payload) {
  const res = await fetch(`${BASE}/attendance/auto-check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${payload._token || token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function getMyAttendance(token) {
  const res = await fetch(`${BASE}/attendance/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function main() {
  console.log("========================================");
  console.log("  FULL ATTENDANCE API TEST SUITE");
  console.log("========================================\n");

  // --- Connect to MongoDB to temporarily expand the attendance window ---
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  const hostel = await Hostel.findOne();
  const originalWindows = JSON.parse(JSON.stringify(hostel.attendanceWindows));

  // Expand "night" window to cover now: 00:00 - 23:59
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;

  console.log(`⏰ Current time: ${currentTime}`);
  console.log(`🔧 Temporarily expanding night window to 00:00–23:59 for testing\n`);

  await Hostel.findByIdAndUpdate(hostel._id, {
    attendanceWindows: [
      { slot: "morning", startTime: "06:00", endTime: "07:00" },
      { slot: "night", startTime: "00:00", endTime: "23:59" },
    ],
  });

  // --- Login ---
  const token = await login();
  console.log("✅ Student login successful\n");

  // --- TEST 1: Inside radius, good accuracy → PRESENT ---
  console.log("──────────────────────────────────────────");
  console.log("TEST 1: Inside radius + good accuracy + no mock");
  console.log("Expected: ✅ PRESENT");
  console.log("──────────────────────────────────────────");
  const t1 = await autoCheck(token, {
    latitude: 28.8387,
    longitude: 78.7732,
    accuracy: 10,
    slot: "night",
    deviceId: "student-device-001",
    isMocked: false,
  });
  if (t1.data) {
    console.log(`   Status:   ${t1.data.status.toUpperCase()}`);
    console.log(`   Distance: ${t1.data.distanceFromHostel}m`);
    console.log(`   Reason:   ${t1.data.reason}`);
  } else {
    console.log(`   Message:  ${t1.message}`);
  }
  console.log("");

  // --- TEST 2: Duplicate mark → Already marked ---
  console.log("──────────────────────────────────────────");
  console.log("TEST 2: Duplicate mark (same date + slot)");
  console.log("Expected: ℹ️  Already marked");
  console.log("──────────────────────────────────────────");
  const t2 = await autoCheck(token, {
    latitude: 28.8387,
    longitude: 78.7732,
    accuracy: 10,
    slot: "night",
    deviceId: "student-device-001",
    isMocked: false,
  });
  console.log(`   Message:  ${t2.message}`);
  console.log("");

  // --- TEST 3: Mocked location → PENDING ---
  console.log("──────────────────────────────────────────");
  console.log("TEST 3: Mocked location detected");
  console.log("Expected: ⏳ PENDING (mock location suspected)");
  console.log("──────────────────────────────────────────");
  // Need a different date for a new record. We can't easily change dates,
  // but the duplicate check already covers this path.
  // Instead, note the logic: mock=true → pending regardless of distance.
  console.log("   ℹ️  Skipped (same date+slot already marked)");
  console.log("   Logic: isMocked=true → status=PENDING, reason='Mock location suspected'");
  console.log("");

  // --- TEST 4: Outside radius → ABSENT ---
  console.log("──────────────────────────────────────────");
  console.log("TEST 4: Outside hostel radius (~3km away)");
  console.log("Expected: ❌ ABSENT");
  console.log("──────────────────────────────────────────");
  console.log("   ℹ️  Skipped (same date+slot already marked)");
  console.log("   Logic: haversine distance > 120m radius → status=ABSENT");
  console.log("");

  // --- TEST 5: Weak accuracy → PENDING ---
  console.log("──────────────────────────────────────────");
  console.log("TEST 5: Inside radius but weak accuracy (>80m)");
  console.log("Expected: ⏳ PENDING (accuracy is weak)");
  console.log("──────────────────────────────────────────");
  console.log("   ℹ️  Skipped (same date+slot already marked)");
  console.log("   Logic: distance <= radius + accuracy > 80m → status=PENDING");
  console.log("");

  // --- Verify decision logic directly ---
  console.log("──────────────────────────────────────────");
  console.log("TEST 6: Unit test — verify decision logic directly");
  console.log("──────────────────────────────────────────");
  const { decideAttendance } = await import("./utils/attendanceDecision.js");

  const cases = [
    { distance: 11, radiusMeters: 120, accuracy: 10, isMocked: false, expected: "present", label: "Inside + good accuracy" },
    { distance: 50, radiusMeters: 120, accuracy: 100, isMocked: false, expected: "pending", label: "Inside + weak accuracy (100m)" },
    { distance: 200, radiusMeters: 120, accuracy: 10, isMocked: false, expected: "absent", label: "Outside radius (200m > 120m)" },
    { distance: 11, radiusMeters: 120, accuracy: 10, isMocked: true, expected: "pending", label: "Mocked location" },
    { distance: 11, radiusMeters: 120, accuracy: 200, isMocked: false, expected: "pending", label: "Inside + very low accuracy (200m)" },
  ];

  let passed = 0;
  let failed = 0;

  for (const c of cases) {
    const result = decideAttendance(c);
    const ok = result.status === c.expected;
    const icon = ok ? "✅" : "❌";
    console.log(`   ${icon} ${c.label}`);
    console.log(`      Got: ${result.status} | Expected: ${c.expected} | Reason: ${result.reason}`);
    if (ok) passed++; else failed++;
  }
  console.log(`\n   Results: ${passed} passed, ${failed} failed out of ${cases.length}\n`);

  // --- Fetch attendance records ---
  console.log("──────────────────────────────────────────");
  console.log("📋 STUDENT ATTENDANCE RECORDS (today)");
  console.log("──────────────────────────────────────────");
  const attRes = await getMyAttendance(token);
  if (attRes.success && attRes.data.length > 0) {
    attRes.data.forEach((a) => {
      console.log(`   ${a.date} | ${a.slot.padEnd(7)} | ${a.status.toUpperCase().padEnd(8)} | ${a.distanceFromHostel}m | ${a.reason}`);
    });
  } else {
    console.log("   No records found");
  }

  // --- Restore original windows ---
  console.log("\n🔧 Restoring original attendance windows...");
  await Hostel.findByIdAndUpdate(hostel._id, {
    attendanceWindows: originalWindows,
  });
  console.log("✅ Restored");

  await mongoose.disconnect();
  console.log("\n========================================");
  console.log("  ALL TESTS COMPLETED");
  console.log("========================================");
}

main().catch((e) => {
  console.error("Test failed:", e.message);
  process.exit(1);
});
