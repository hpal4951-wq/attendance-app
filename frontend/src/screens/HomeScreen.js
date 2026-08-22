import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyAttendance, getAttendanceSummary, getPendingAttendance, getAttendanceByDate } from "../services/attendanceService";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../theme";
import { getTodayDateString } from "../utils/date";
import { Avatar, Badge, StatCard, EmptyState, Header, AppButton, AppCard, Modal } from "../components";

export default function HomeScreen({ onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Student data
  const [attendance, setAttendance] = useState([]);
  const [studentStats, setStudentStats] = useState({ present: 0, absent: 0, pending: 0 });

  // Admin/Warden data
  const [summary, setSummary] = useState(null);
  const [pendingList, setPendingList] = useState([]);
  const [todayList, setTodayList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  const roleLabel = user?.role === "admin" ? "Admin" : user?.role === "warden" ? "Warden" : "Student";
  const isAdmin = user?.role === "admin";
  const isWarden = user?.role === "warden";
  const isStaff = isAdmin || isWarden;

  const loadData = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setUser(parsedUser);

      if (!parsedUser || parsedUser.role === "student") {
        const res = await getMyAttendance();
        if (res.success) {
          const records = res.data || [];
          setAttendance(records);
          setStudentStats({
            present: records.filter((r) => r.status === "present").length,
            absent: records.filter((r) => r.status === "absent").length,
            pending: records.filter((r) => r.status === "pending").length,
          });
        }
      } else {
        // Admin / Warden
        const [sumRes, pendRes, todayRes] = await Promise.allSettled([
          getAttendanceSummary(),
          getPendingAttendance(),
          getAttendanceByDate(getTodayDateString()),
        ]);
        if (sumRes.status === "fulfilled" && sumRes.value.success) setSummary(sumRes.value.data);
        if (pendRes.status === "fulfilled" && pendRes.value.success) setPendingList(pendRes.value.data || []);
        if (todayRes.status === "fulfilled" && todayRes.value.success) setTodayList(todayRes.value.data || []);
      }
    } catch (err) {
      console.warn("loadData error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Summary helpers
  const getCount = (status) => {
    if (!summary) return 0;
    const found = summary.find((s) => s._id === status);
    return found ? found.count : 0;
  };

  const tabs = isStaff
    ? [
        { key: "dashboard", label: "Dashboard", icon: "📊" },
        { key: "pending", label: "Pending", icon: "⏳" },
        { key: "today", label: "Today", icon: "📅" },
        { key: "profile", label: "Profile", icon: "👤" },
      ]
    : [
        { key: "dashboard", label: "Dashboard", icon: "📊" },
        { key: "attendance", label: "History", icon: "📋" },
        { key: "mark", label: "Mark", icon: "📍" },
        { key: "profile", label: "Profile", icon: "👤" },
      ];

  return (
    <SafeAreaView style={styles.flex}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Avatar name={user?.name} size="sm" />
          <View>
            <Text style={styles.topBarName}>{user?.name || "User"}</Text>
            <Badge label={roleLabel} type={user?.role || "student"} />
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          onPress={() => setShowLogoutModal(true)}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [
              styles.tabItem,
              activeTab === tab.key && styles.tabItemActive,
              pressed && { backgroundColor: "#e2e8f0" },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === "dashboard" && isStaff && (
          <AdminDashboard
            summary={summary}
            getCount={getCount}
            todayList={todayList}
            pendingList={pendingList}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === "dashboard" && !isStaff && (
          <StudentDashboard stats={studentStats} attendance={attendance} />
        )}
        {activeTab === "pending" && isStaff && (
          <PendingReviewScreen
            pendingList={pendingList}
            onRefresh={loadData}
          />
        )}
        {activeTab === "today" && isStaff && (
          <TodayAttendanceScreen
            todayList={todayList}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onRefresh={loadData}
          />
        )}
        {activeTab === "attendance" && !isStaff && (
          <AttendanceHistory attendance={attendance} />
        )}
        {activeTab === "mark" && !isStaff && (
          <MarkAttendanceInline onRefresh={loadData} />
        )}
        {activeTab === "profile" && (
          <ProfileScreen user={user} />
        )}
      </ScrollView>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout from your account?"
        confirmText="Logout"
        cancelText="Cancel"
        danger
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
}

/* ─── Student Dashboard ─── */
function StudentDashboard({ stats, attendance }) {
  const total = stats.present + stats.absent + stats.pending;
  const pct = total > 0 ? Math.round((stats.present / total) * 100) : 0;

  return (
    <View>
      {/* Greeting Card */}
      <AppCard style={styles.greetingCard}>
        <Text style={styles.greetingTitle}>Good to see you 👋</Text>
        <Text style={styles.greetingSub}>Here's your attendance overview</Text>
        <View style={styles.attendancePctRow}>
          <View style={styles.pctCircle}>
            <Text style={styles.pctNumber}>{pct}%</Text>
            <Text style={styles.pctLabel}>Present</Text>
          </View>
          <View style={styles.pctDetails}>
            <View style={styles.pctRow}>
              <View style={[styles.pctDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.pctDetailText}>Present: {stats.present}</Text>
            </View>
            <View style={styles.pctRow}>
              <View style={[styles.pctDot, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.pctDetailText}>Absent: {stats.absent}</Text>
            </View>
            <View style={styles.pctRow}>
              <View style={[styles.pctDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.pctDetailText}>Pending: {stats.pending}</Text>
            </View>
          </View>
        </View>
      </AppCard>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard icon="✅" value={stats.present} label="Present" color={COLORS.success} />
        <StatCard icon="❌" value={stats.absent} label="Absent" color={COLORS.danger} />
        <StatCard icon="⏳" value={stats.pending} label="Pending" color={COLORS.warning} />
      </View>

      {/* Recent Records */}
      <Text style={styles.sectionTitle}>Recent Records</Text>
      {attendance.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No records yet"
          description="Attendance is marked automatically when you're inside the hostel during check-in windows."
        />
      ) : (
        attendance.slice(0, 5).map((item) => <AttendanceRecord key={item._id} item={item} />)
      )}
    </View>
  );
}

/* ─── Admin Dashboard ─── */
function AdminDashboard({ summary, getCount, todayList, pendingList, onNavigate }) {
  const total = getCount("present") + getCount("absent") + getCount("pending");

  return (
    <View>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard icon="✅" value={getCount("present")} label="Present" color={COLORS.success} />
        <StatCard icon="❌" value={getCount("absent")} label="Absent" color={COLORS.danger} />
        <StatCard icon="⏳" value={getCount("pending")} label="Pending" color={COLORS.warning} />
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="👥" value={total} label="Total" color={COLORS.primary} />
        <StatCard icon="📋" value={todayList.length} label="Today" color={COLORS.info} />
        <StatCard icon="🔔" value={pendingList.length} label="To Review" color={COLORS.secondary} />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]}
          onPress={() => onNavigate("pending")}
        >
          <Text style={styles.actionIcon}>⏳</Text>
          <Text style={styles.actionTitle}>Review Pending</Text>
          <Text style={styles.actionSub}>{pendingList.length} records</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]}
          onPress={() => onNavigate("today")}
        >
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionTitle}>Today's List</Text>
          <Text style={styles.actionSub}>{todayList.length} records</Text>
        </Pressable>
      </View>

      {/* Pending List Preview */}
      {pendingList.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Pending Reviews</Text>
          {pendingList.slice(0, 3).map((item) => (
            <PendingRecord key={item._id} item={item} compact />
          ))}
          {pendingList.length > 3 && (
            <Pressable onPress={() => onNavigate("pending")}>
              <Text style={styles.viewAllText}>View all {pendingList.length} pending →</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

/* ─── Attendance History (Student) ─── */
function AttendanceHistory({ attendance }) {
  return (
    <View>
      <Header title="Attendance History" subtitle={`${attendance.length} total records`} />
      {attendance.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No attendance records"
          description="Records will appear here once attendance is marked."
        />
      ) : (
        attendance.map((item) => <AttendanceRecord key={item._id} item={item} />)
      )}
    </View>
  );
}

/* ─── Mark Attendance (Student inline) ─── */
function MarkAttendanceInline({ onRefresh }) {
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleMark = async () => {
    setMarking(true);
    setError("");
    setResult(null);

    try {
      // Check if we have geolocation
      if (!navigator.geolocation && !global.navigator?.geolocation) {
        setError("Geolocation not available in this environment. Use a device or emulator.");
        setMarking(false);
        return;
      }

      const geo = navigator.geolocation || global.navigator?.geolocation;
      geo.getCurrentPosition(
        async (position) => {
          try {
            const hour = new Date().getHours();
            const slot = hour < 12 ? "morning" : "night";

            const { autoCheckAttendance } = await import("../services/attendanceService");
            const res = await autoCheckAttendance({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              slot,
              deviceId: "student-device-001",
              isMocked: position.coords.mocked || false,
            });

            setResult(res);
            onRefresh();
          } catch (err) {
            setError(err.message || "Failed to mark attendance");
          } finally {
            setMarking(false);
          }
        },
        (err) => {
          setError("Location access denied. Please enable GPS.");
          setMarking(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      setError(err.message || "Something went wrong");
      setMarking(false);
    }
  };

  const currentHour = new Date().getHours();
  const currentSlot = currentHour < 12 ? "morning" : "night";
  const slotEmoji = currentSlot === "morning" ? "🌅" : "🌙";

  return (
    <View>
      <Header title="Mark Attendance" subtitle="Verify your location" />

      <AppCard>
        <View style={styles.markHeader}>
          <Text style={styles.markSlotEmoji}>{slotEmoji}</Text>
          <View>
            <Text style={styles.markSlotLabel}>
              {currentSlot === "morning" ? "Morning" : "Night"} Window
            </Text>
            <Text style={styles.markSlotTime}>
              {currentSlot === "morning" ? "06:00 – 07:00" : "20:30 – 21:30"}
            </Text>
          </View>
        </View>
      </AppCard>

      {result ? (
        <AppCard style={{ borderColor: result.data?.status === "present" ? COLORS.success : COLORS.warning, borderWidth: 1 }}>
          <View style={styles.resultRow}>
            <Text style={styles.resultEmoji}>
              {result.data?.status === "present" ? "✅" : result.data?.status === "absent" ? "❌" : "⏳"}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>
                {result.data?.status === "present"
                  ? "Present!"
                  : result.data?.status === "absent"
                  ? "Absent"
                  : "Pending Review"}
              </Text>
              <Text style={styles.resultSub}>{result.message}</Text>
              {result.data?.distanceFromHostel != null && (
                <Text style={styles.resultDistance}>
                  Distance: {result.data.distanceFromHostel}m
                </Text>
              )}
            </View>
          </View>
        </AppCard>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      ) : null}

      <AppButton
        title={marking ? "Marking..." : "Mark My Attendance"}
        onPress={handleMark}
        loading={marking}
        disabled={marking}
        icon="📍"
        style={{ marginTop: SPACING.lg }}
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>
          1. Your GPS location is captured{"\n"}
          2. Distance from hostel is calculated{"\n"}
          3. Attendance is marked based on proximity{"\n"}
          4. Mock locations are flagged for review
        </Text>
      </View>
    </View>
  );
}

/* ─── Pending Review (Admin/Warden) ─── */
function PendingReviewScreen({ pendingList, onRefresh }) {
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);

  const handleReview = async (id, status) => {
    setReviewingId(id);
    try {
      const { reviewAttendance } = await import("../services/attendanceService");
      await reviewAttendance(id, { status });
      await onRefresh();
    } catch (err) {
      console.warn("Review error:", err);
    } finally {
      setReviewingId(null);
      setReviewModal(null);
    }
  };

  return (
    <View>
      <Header title="Pending Reviews" subtitle={`${pendingList.length} records need review`} />
      {pendingList.length === 0 ? (
        <EmptyState
          emoji="🎉"
          title="All caught up!"
          description="No pending attendance records to review."
        />
      ) : (
        pendingList.map((item) => (
          <PendingRecord
            key={item._id}
            item={item}
            onApprove={() => setReviewModal({ id: item._id, action: "present" })}
            onReject={() => setReviewModal({ id: item._id, action: "absent" })}
            reviewing={reviewingId === item._id}
          />
        ))
      )}

      <Modal
        visible={!!reviewModal}
        title={reviewModal?.action === "present" ? "Approve?" : "Reject?"}
        message={
          reviewModal?.action === "present"
            ? "Mark this attendance as Present?"
            : "Mark this attendance as Absent?"
        }
        confirmText={reviewModal?.action === "present" ? "Approve" : "Reject"}
        cancelText="Cancel"
        danger={reviewModal?.action === "absent"}
        onConfirm={() => reviewModal && handleReview(reviewModal.id, reviewModal.action)}
        onCancel={() => setReviewModal(null)}
      />
    </View>
  );
}

/* ─── Today's Attendance (Admin/Warden) ─── */
function TodayAttendanceScreen({ todayList, selectedDate, setSelectedDate, onRefresh }) {
  return (
    <View>
      <Header title="Today's Attendance" subtitle={`${todayList.length} records for ${selectedDate}`} />
      {todayList.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No records today"
          description="No attendance has been marked for this date."
        />
      ) : (
        todayList.map((item) => <AttendanceRecord key={item._id} item={item} />)
      )}
    </View>
  );
}

/* ─── Profile ─── */
function ProfileScreen({ user }) {
  return (
    <View>
      <Header title="My Profile" />
      <AppCard>
        <View style={styles.profileSection}>
          <Avatar name={user?.name} size="lg" />
          <Text style={styles.profileName}>{user?.name || "User"}</Text>
          <Badge label={user?.role || "student"} type={user?.role || "student"} />
        </View>
      </AppCard>

      <AppCard>
        <ProfileRow label="Phone" value={user?.phone || "—"} icon="📱" />
        <ProfileRow label="Email" value={user?.email || "—"} icon="📧" />
        <ProfileRow label="Role" value={user?.role || "student"} icon="🛡️" />
        <ProfileRow label="Hostel ID" value={user?.hostelId || "—"} icon="🏫" />
        <ProfileRow label="Device ID" value={user?.deviceId || "—"} icon="📟" />
        <ProfileRow label="Account Status" value={user?.isActive ? "Active" : "Inactive"} icon="✅" last />
      </AppCard>
    </View>
  );
}

/* ─── Shared Components ─── */
function AttendanceRecord({ item }) {
  const statusColors = {
    present: { bg: COLORS.successLight, text: COLORS.success },
    absent: { bg: COLORS.dangerLight, text: COLORS.danger },
    pending: { bg: COLORS.warningLight, text: COLORS.warning },
  };
  const sc = statusColors[item.status] || statusColors.pending;
  const slotEmoji = item.slot === "morning" ? "🌅" : "🌙";

  return (
    <View style={styles.recordCard}>
      <View style={styles.recordLeft}>
        <Text style={styles.recordDate}>{item.date}</Text>
        <Text style={styles.recordSlot}>
          {slotEmoji} {item.slot === "morning" ? "Morning" : "Night"}
          {item.distanceFromHostel != null ? ` · ${item.distanceFromHostel}m` : ""}
        </Text>
        {item.reason ? (
          <Text style={styles.recordReason} numberOfLines={2}>
            💬 {item.reason}
          </Text>
        ) : null}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
        <Text style={[styles.statusText, { color: sc.text }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

function PendingRecord({ item, onApprove, onReject, reviewing, compact }) {
  const studentName = item.studentId?.userId?.name || "Unknown";
  const studentPhone = item.studentId?.userId?.phone || "";
  const slotEmoji = item.slot === "morning" ? "🌅" : "🌙";

  return (
    <AppCard>
      <View style={styles.pendingTop}>
        <Avatar name={studentName} size="sm" />
        <View style={styles.pendingInfo}>
          <Text style={styles.pendingName}>{studentName}</Text>
          <Text style={styles.pendingSub}>
            {slotEmoji} {item.slot} · {item.date}
            {studentPhone ? ` · ${studentPhone}` : ""}
          </Text>
          {item.distanceFromHostel != null && (
            <Text style={styles.pendingDistance}>📍 {item.distanceFromHostel}m away</Text>
          )}
          {item.reason && (
            <Text style={styles.pendingReason}>💬 {item.reason}</Text>
          )}
        </View>
      </View>
      {!compact && onApprove && onReject && (
        <View style={styles.pendingActions}>
          <AppButton
            title="✅ Approve"
            variant="success"
            onPress={onApprove}
            loading={reviewing}
            style={{ flex: 1 }}
          />
          <AppButton
            title="❌ Reject"
            variant="danger"
            onPress={onReject}
            loading={reviewing}
            style={{ flex: 1 }}
          />
        </View>
      )}
    </AppCard>
  );
}

function ProfileRow({ label, value, icon, last = false }) {
  return (
    <View style={[styles.profileRow, !last && styles.profileRowBorder]}>
      <Text style={styles.profileRowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.profileRowLabel}>{label}</Text>
        <Text style={styles.profileRowValue}>{value}</Text>
      </View>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },

  // Top Bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  topBarName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIcon: { fontSize: 18 },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },

  // Content
  content: { flex: 1 },
  contentPadding: { padding: SPACING.lg, paddingBottom: 100 },

  // Greeting
  greetingCard: { marginBottom: SPACING.lg },
  greetingTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  greetingSub: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  attendancePctRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pctCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.xl,
  },
  pctNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.primary,
  },
  pctLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: "600",
  },
  pctDetails: { flex: 1 },
  pctRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  pctDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  pctDetailText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },

  // Section
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },

  // Record Card
  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    elevation: 1,
  },
  recordLeft: { flex: 1, marginRight: SPACING.md },
  recordDate: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  recordSlot: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  recordReason: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Pending
  pendingTop: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  pendingInfo: { flex: 1 },
  pendingName: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  pendingSub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  pendingDistance: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.info,
    marginTop: SPACING.xs,
  },
  pendingReason: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  pendingActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  actionIcon: { fontSize: 28, marginBottom: SPACING.sm },
  actionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  actionSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },

  viewAllText: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
    marginTop: SPACING.md,
  },

  // Mark Attendance
  markHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
  },
  markSlotEmoji: { fontSize: 36 },
  markSlotLabel: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  markSlotTime: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
  },
  resultEmoji: { fontSize: 36 },
  resultTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  resultSub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  resultDistance: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.info,
    marginTop: SPACING.xs,
  },
  errorBanner: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  errorBannerText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.info,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Profile
  profileSection: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  profileName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  profileRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileRowIcon: {
    fontSize: 18,
    marginRight: SPACING.md,
    width: 28,
  },
  profileRowLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  profileRowValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: "600",
    marginTop: 2,
  },
});
