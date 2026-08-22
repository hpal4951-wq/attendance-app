import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS } from "../../theme";
import { AppHeader, AppInput, AppButton, AppSelect } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

export default function AddStudentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const student = route.params?.student || null;
  const isEdit = !!student;

  const userId = student?.userId?._id || student?.userId;
  const initialRoom = student?.roomId?._id || student?.roomId;

  const [name, setName] = useState(student?.userId?.name || "");
  const [studentId, setStudentId] = useState(student?.studentCode || "");
  const [phone, setPhone] = useState(student?.userId?.phone || "");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState(student?.course || "");
  const [year, setYear] = useState(student?.year || "");
  const [hostelId, setHostelId] = useState(student?.hostelId?._id || student?.hostelId || "");
  const [blockId, setBlockId] = useState(student?.blockId?._id || student?.blockId || "");
  const [roomId, setRoomId] = useState(initialRoom || "");
  const [status, setStatus] = useState(student?.status || "active");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const hostelsRes = useFetch(() => adminService.getHostels(), []);
  const blocksRes = useFetch(() => (hostelId ? adminService.getBlocks(hostelId) : Promise.resolve([])), [hostelId]);
  const roomsRes = useFetch(() => (blockId ? adminService.getRooms({ blockId }) : Promise.resolve([])), [blockId]);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!studentId.trim()) e.studentId = "Student ID is required";
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.replace(/\s|-/g, ""))) e.phone = "Enter a valid 10-digit phone number";
    if (!isEdit && !password) e.password = "Password is required";
    if (!isEdit && password && password.length < 6) e.password = "Password must be at least 6 characters";
    if (!hostelId) e.hostelId = "Hostel is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), studentId: studentId.trim(), phone: phone.trim(), course: course.trim() || undefined, year: year.trim() || undefined };

      if (isEdit) {
        await adminService.updateStudent(student._id, { ...payload, status });
        const roomChanged = roomId && String(roomId) !== String(initialRoom);
        if (roomChanged && hostelId && blockId && roomId) {
          await adminService.assignStudentRoom(student._id, { hostelId, blockId, roomId });
        }
        Alert.alert("Success", "Student updated successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else {
        await adminService.createStudent({
          ...payload,
          password,
          hostelId,
          blockId: blockId || undefined,
          roomId: roomId || undefined,
        });
        Alert.alert("Success", "Student created successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const hostelsOptions = hostelsRes.data || [];
  const blocksOptions = blocksRes.data || [];
  const roomsOptions = roomsRes.data || [];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.flex}>
        <AppHeader
          title={isEdit ? "Edit Student" : "Add Student"}
          subtitle={isEdit ? `Update ${name || "student"} details` : "Register a new student"}
          showBack
          onBack={() => navigation.goBack()}
          style={styles.header}
        />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <AppInput label="Full Name" placeholder="e.g. Rahul Kumar" value={name} onChangeText={setName} error={errors.name} />
          <AppInput label="Student ID" placeholder="e.g. STU001" value={studentId} onChangeText={setStudentId} error={errors.studentId} />
          <AppInput label="Phone" placeholder="e.g. 9876543210" keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} error={errors.phone} />
          {!isEdit ? (
            <AppInput label="Password" placeholder="Create a password" secureTextEntry value={password} onChangeText={setPassword} error={errors.password} />
          ) : null}
          <AppInput label="Course" placeholder="e.g. B.Tech CSE" value={course} onChangeText={setCourse} />
          <AppInput label="Year" placeholder="e.g. 4" keyboardType="number-pad" value={year} onChangeText={setYear} />

          <AppSelect
            label="Hostel"
            placeholder="Select Hostel"
            value={hostelId}
            options={hostelsOptions.map((h) => ({ value: h._id, label: h.name }))}
            onChange={(v) => { setHostelId(v); setBlockId(""); setRoomId(""); }}
            error={errors.hostelId}
          />
          <AppSelect
            label="Block"
            placeholder={hostelId ? "Select Block" : "Select Hostel first"}
            value={blockId}
            options={blocksOptions.map((b) => ({ value: b._id, label: b.name }))}
            onChange={(v) => { setBlockId(v); setRoomId(""); }}
            disabled={!hostelId}
          />
          <AppSelect
            label="Room"
            placeholder={blockId ? "Select Room" : "Select Block first"}
            value={roomId}
            options={roomsOptions.map((r) => ({ value: r._id, label: r.roomNumber }))}
            onChange={setRoomId}
            disabled={!blockId}
          />

          {isEdit ? (
            <AppSelect label="Status" placeholder="Select status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          ) : null}

          <AppButton title={isEdit ? "UPDATE STUDENT" : "CREATE STUDENT"} onPress={handleSubmit} loading={submitting} disabled={submitting} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
});