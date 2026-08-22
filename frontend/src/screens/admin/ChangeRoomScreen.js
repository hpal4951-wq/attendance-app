import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONT_SIZE, SPACING, RADIUS } from "../../theme";
import { AppHeader, AppButton, AppCard, AppSelect, LoadingScreen, ErrorView } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

export default function ChangeRoomScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { studentId } = route.params || {};

  const { data: student, loading, error, reload } = useFetch(
    () => adminService.getStudentById(studentId),
    [studentId]
  );

  const currentHostel = student?.hostelId?._id || "";
  const currentBlock = student?.blockId?._id || "";
  const currentRoom = student?.roomId?._id || "";

  const [hostelId, setHostelId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentHostel) setHostelId(currentHostel);
  }, [currentHostel]);

  useEffect(() => {
    if (currentBlock && String(currentBlock) !== String(blockId)) setBlockId(currentBlock);
  }, [currentBlock]);

  useEffect(() => {
    if (currentRoom && String(currentRoom) !== String(roomId)) setRoomId(currentRoom);
  }, [currentRoom]);

  const hostelsRes = useFetch(() => adminService.getHostels(), []);
  const blocksRes = useFetch(() => (hostelId ? adminService.getBlocks(hostelId) : Promise.resolve([])), [hostelId]);
  const roomsRes = useFetch(() => (blockId ? adminService.getRooms({ blockId }) : Promise.resolve([])), [blockId]);

  const handleSubmit = async () => {
    if (!hostelId || !blockId || !roomId) {
      Alert.alert("Error", "Please select hostel, block and room.");
      return;
    }
    setSubmitting(true);
    try {
      await adminService.assignStudentRoom(studentId, { hostelId, blockId, roomId });
      Alert.alert("Success", "Room assigned successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Change Room" showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const user = student?.userId || {};
  const hostel = student?.hostelId || {};
  const block = student?.blockId || {};
  const room = student?.roomId || {};

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Change Room" subtitle={`${user.name || "Student"} · ${student?.studentCode || ""}`} showBack onBack={() => navigation.goBack()} style={styles.header} />

      <ScrollView contentContainerStyle={styles.content}>
        <AppCard style={styles.currentCard}>
          <Text style={styles.currentLabel}>Current Assignment</Text>
          <Text style={styles.currentValue}>
            {hostel.name || "—"} · {block.name || "—"} · {room.roomNumber || "—"}
          </Text>
        </AppCard>

        <AppSelect
          label="Hostel"
          placeholder="Select Hostel"
          value={hostelId}
          options={hostelsRes.data?.map((h) => ({ value: h._id, label: h.name })) || []}
          onChange={(v) => { setHostelId(v); setBlockId(""); setRoomId(""); }}
        />
        <AppSelect
          label="Block"
          placeholder={hostelId ? "Select Block" : "Select Hostel first"}
          value={blockId}
          options={blocksRes.data?.map((b) => ({ value: b._id, label: b.name })) || []}
          onChange={(v) => { setBlockId(v); setRoomId(""); }}
          disabled={!hostelId}
        />
        <AppSelect
          label="Room"
          placeholder={blockId ? "Select Room" : "Select Block first"}
          value={roomId}
          options={roomsRes.data?.map((r) => ({ value: r._id, label: r.roomNumber })) || []}
          onChange={setRoomId}
          disabled={!blockId}
        />

        <AppButton title="ASSIGN ROOM" onPress={handleSubmit} loading={submitting} disabled={submitting} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  currentCard: { marginBottom: 16 },
  currentLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 },
  currentValue: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
});