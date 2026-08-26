const BASE = "http://localhost:5000/api";

async function j(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  return { status: res.status, data };
}

async function login(phone, password) {
  const r = await j("POST", "/auth/login", null, { phone, password });
  return r.data.token;
}

const student = await login("9999999993", "Student@123");
const warden = await login("9999999992", "Warden@123");

const TEST_TOKEN = "ExponentPushToken[attendance-test-token-0001]";

console.log("=== 1. register device token (Expo token) ===");
console.log(JSON.stringify(await j("POST", "/notifications/device-token", student, { token: TEST_TOKEN, platform: "android" })));

console.log("=== 2. warden creates poll (triggers notifyPollEligible) ===");
const poll = await j("POST", "/polls", warden, {
  question: "Notification test: choose dessert",
  options: ["Gulab Jamun", "Ice Cream", "Fruit Salad"],
  endAt: "2026-08-27T10:00:00Z",
});
console.log(poll.status, poll.data?.message);

console.log("=== 3. student notifications list ===");
const notifs = await j("GET", "/notifications", student);
console.log(notifs.status, "count:", notifs.data?.count);
(notifs.data?.data || []).slice(0, 3).forEach((n) => console.log("  -", n.title, "|", n.type, "| read:", n.read));

console.log("=== 4. unread count ===");
console.log(JSON.stringify(await j("GET", "/notifications/unread-count", student)));

console.log("=== 5. mark first notification read ===");
const first = notifs.data?.data?.[0];
if (first) {
  console.log(JSON.stringify(await j("PATCH", `/notifications/${first._id}/read`, student)));
}

console.log("=== 6. mark all read ===");
console.log(JSON.stringify(await j("PATCH", "/notifications/read-all", student)));

console.log("=== 7. duplicate: same poll vote/notification not re-created ===");
const notifs2 = await j("GET", "/notifications?read=false", student);
console.log("unread after mark-all-read:", notifs2.data?.count);

console.log("=== 8. logout token deactivation ===");
console.log(JSON.stringify(await j("DELETE", "/notifications/device-token", student, { token: TEST_TOKEN })));

console.log("=== 9. token stored in DB check ===");
const db = (await import("mongoose")).default;
await db.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/attendance_app");
const dt = await db.connection.db.collection("devicetokens").findOne({ token: TEST_TOKEN });
console.log("device token doc:", dt ? { user: String(dt.user), isActive: dt.isActive } : "not found");
await db.disconnect();
