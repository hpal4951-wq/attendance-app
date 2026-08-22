import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { AppHeader, AppInput, AppButton, AppCard, EmptyState, ErrorView, LoadingScreen, Badge, Fab, AppSelect } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";
import { useFocusReload } from "../../hooks/useFetch";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

export default function StudentManagementScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [hostelId, setHostelId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const pageRef = useRef(1);

  // hostel / block / room options for filters
  const [hostels, setHostels] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => { adminService.getHostels().then(setHostels).catch(() => {}); }, []);

  useEffect(() => {
    if (hostelId) { adminService.getBlocks(hostelId).then(setBlocks).catch(() => setBlocks([])); } else { setBlocks([]); }
  }, [hostelId]);

  useEffect(() => {
    if (blockId) { adminService.getRooms({ blockId }).then(setRooms).catch(() => setRooms([])); } else { setRooms([]); }
  }, [blockId]);

  const buildParams = useCallback((p = 1) => ({
    search: search.trim() || undefined,
    hostelId: hostelId || undefined,
    blockId: blockId || undefined,
    roomId: roomId || undefined,
    status: statusFilter || undefined,
    page: p,
    limit: 20,
  }), [search, hostelId, blockId, roomId, statusFilter]);

  const loadPage = useCallback(async (p, mode = "initial") => {
    if (mode === "initial") setLoading(true);
    else if (mode === "refresh") setRefreshing(true);
    setError(null);
    try {
      const res = await adminService.getStudents(buildParams(p));
      if (p === 1) {
        setStudents(res.students);
      } else {
        setStudents((prev) => [...prev, ...res.students]);
      }
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

  useFocusReload(() => { loadPage(1, "refresh"); });

  const handleSearch = () => {
    setSearch(searchInput);
    // search triggers useEffect via buildParams dependency
  };

  const handleFilterReset = () => {
    setSearchInput("");
    setSearch("");
    setHostelId("");
    setBlockId("");
    setRoomId("");
    setStatusFilter("");
  };

  const handleLoadMore = async () => {
    if (loadingMore || loading || refreshing) return;
    if (pageRef.current >= pagination.pages) return;
    const next = pageRef.current + 1;
    setLoadingMore(true);
    try {
      const res = await adminService.getStudents(buildParams(next));
      setStudents((prev) => [...prev, ...res.students]);
      setPagination(res.pagination);
      pageRef.current = next;
    } catch (e) {
      // silent on load-more failure
    } finally {
      setLoadingMore(false);
    }
  };

  const hostelsOptions = [{ value: "", label: "All Hostels" }, ...hostels.map((h) => ({ value: h._id, label: h.name }))];
  const blocksOptions = [{ value: "", label: "All Blocks" }, ...blocks.map((b) => ({ value: b._id, label: b.name }))];
  const roomsOptions = [{ value: "", label: "All Rooms" }, ...rooms.map((r) => ({ value: r._id, label: r.roomNumber }))];

  const hasActiveFilters = search || hostelId || blockId || roomId || statusFilter;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Students" subtitle="Manage student records" style={styles.header} />

      <View style={styles.searchBar}>
        <AppInput
          placeholder="Search name, ID or phone"
          value={searchInput}
          onChangeText={setSearchInput}
          style={styles.searchInput}
        />
        <Pressable style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
      </View>

      <View style={styles.filtersRow}>
        <Pressable
          style={[styles.filterBadge, hasActiveFilters && styles.filterBadgeActive]}
          onPress={handleFilterReset}
        >
          <Text style={[styles.filterBadgeText, hasActiveFilters && { color: COLORS.primary }]}>
            {hasActiveFilters ? "Clear" : "Filters"}
          </Text>
        </Pressable>
        <AppSelect
          placeholder="Hostel"
          value={hostelId}
          options={hostelsOptions}
          onChange={(v) => { setHostelId(v); setBlockId(""); setRoomId(""); }}
          style={styles.filterSelect}
        />
        <AppSelect
          placeholder="Block"
          value={blockId}
          options={blocksOptions}
          onChange={(v) => { setBlockId(v); setRoomId(""); }}
          style={styles.filterSelect}
          disabled={!hostelId}
        />
        <AppSelect
          placeholder="Room"
          value={roomId}
          options={roomsOptions}
          onChange={setRoomId}
          style={styles.filterSelect}
          disabled={!blockId}
        />
        <AppSelect
          placeholder="Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
          style={styles.filterSelect}
        />
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
            <EmptyState emoji="👨‍🎓" title="No students found" description={hasActiveFilters ? "Try adjusting your filters." : "Tap + Add Student to register a student."} />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.loadingMore} color={COLORS.primary} /> : null
          }
          renderItem={({ item }) => {
            const user = item.userId || {};
            const hostel = item.hostelId || {};
            const block = item.blockId || {};
            const room = item.roomId || {};
            const statusColor = item.status === "active" ? "success" : item.status === "inactive" ? "warning" : "info";
            return (
              <Pressable
                onPress={() => navigation.navigate("StudentDetails", { studentId: item._id })}
              >
                <AppCard style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{user.name || "Unknown"}</Text>
                      <Text style={styles.studentCode}>{item.studentCode}</Text>
                    </View>
                    <Badge label={item.status} type={statusColor} />
                  </View>
                  <Text style={styles.studentPhone}>{user.phone}</Text>
                  <Text style={styles.studentMeta}>
                    {hostel.name || "—"}  ·  {block.name || "—"}  ·  {room.roomNumber || "—"}
                  </Text>
                </AppCard>
              </Pressable>
            );
          }}
        />
      )}

      <Fab label="Add Student" onPress={() => navigation.navigate("AddStudent")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.xs },
  searchInput: { flex: 1, marginBottom: 0 },
  searchBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.md },
  searchBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  filtersRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: 6 },
  filterBadge: { backgroundColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, alignSelf: "flex-start" },
  filterBadgeActive: { backgroundColor: COLORS.primaryLight },
  filterBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  filterSelect: { marginBottom: 0 },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: { marginBottom: SPACING.sm },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 },
  studentName: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.textPrimary },
  studentCode: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 1 },
  studentPhone: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: 2 },
  studentMeta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  loadingMore: { paddingVertical: SPACING.xl },
});