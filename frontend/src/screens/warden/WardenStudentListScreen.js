import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { AppHeader, AppInput, AppCard, AppSelect, EmptyState, ErrorView, LoadingScreen, AttendanceStatus } from "../../components";
import wardenService from "../../services/wardenService";
import { getErrorMessage } from "../../utils/error";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
];

export default function WardenStudentListScreen() {
  const navigation = useNavigation();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roomId, setRoomId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const pageRef = useRef(1);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    wardenService.getWardenRooms().then(setRooms).catch(() => setRooms([]));
  }, []);

  const buildParams = useCallback((p = 1) => ({
    search: search.trim() || undefined,
    roomId: roomId || undefined,
    status: statusFilter || undefined,
    page: p,
    limit: 20,
  }), [search, roomId, statusFilter]);

  const loadPage = useCallback(async (p, mode = "initial") => {
    if (mode === "initial") setLoading(true);
    else if (mode === "refresh") setRefreshing(true);
    setError(null);
    try {
      const res = await wardenService.getWardenStudents(buildParams(p));
      setStudents((prev) => (p === 1 ? res.students : [...prev, ...res.students]));
      setPagination(res.pagination);
      pageRef.current = p;
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildParams]);

  useEffect(() => { loadPage(1, "initial"); }, [loadPage]);

  const handleLoadMore = async () => {
    if (loadingMore || loading || refreshing) return;
    if (pageRef.current >= pagination.pages) return;
    const next = pageRef.current + 1;
    setLoadingMore(true);
    try {
      const res = await wardenService.getWardenStudents(buildParams(next));
      setStudents((prev) => [...prev, ...res.students]);
      setPagination(res.pagination);
      pageRef.current = next;
    } catch (e) {
      // silent on load-more failure
    } finally {
      setLoadingMore(false);
    }
  };

  const roomOptions = [{ value: "", label: "All Rooms" }, ...rooms.map((r) => ({ value: r._id, label: r.roomNumber }))];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Students" subtitle="Students in your block" style={styles.header} />

      <View style={styles.searchRow}>
        <AppInput
          placeholder="Search name, ID or room"
          value={searchInput}
          onChangeText={setSearchInput}
          style={styles.searchInput}
        />
        <Pressable style={styles.searchBtn} onPress={() => setSearch(searchInput)}>
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
      </View>

      <View style={styles.filtersRow}>
        <AppSelect placeholder="Room" value={roomId} options={roomOptions} onChange={setRoomId} style={styles.filterSelect} />
        <AppSelect placeholder="Attendance" value={statusFilter} options={STATUS_FILTERS} onChange={setStatusFilter} style={styles.filterSelect} />
      </View>

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={() => loadPage(1, "initial")} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPage(1, "refresh")} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState emoji="👨‍🎓" title="No students found" description={search || roomId || statusFilter ? "Try adjusting your search or filters." : "No students are assigned to your block yet."} />
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loadingMore} color={COLORS.primary} /> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate("WardenStudentDetails", { studentId: item._id })}>
              <AppCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{item.name || "Unknown"}</Text>
                    <Text style={styles.studentCode}>{item.studentCode}</Text>
                    <Text style={styles.studentRoom}>Room {item.roomNumber || "—"}</Text>
                  </View>
                  <AttendanceStatus status={item.status} lastCheckedAt={item.lastCheckedAt} reason={item.attendanceReason} compact />
                </View>
              </AppCard>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.xs },
  searchInput: { flex: 1, marginBottom: 0 },
  searchBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.md },
  searchBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  filtersRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: 6 },
  filterSelect: { marginBottom: 0 },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: { marginBottom: SPACING.sm },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.md },
  studentName: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.textPrimary },
  studentCode: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 1 },
  studentRoom: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  loadingMore: { paddingVertical: SPACING.xl },
});