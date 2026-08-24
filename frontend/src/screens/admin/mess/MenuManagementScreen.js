import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Alert, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../theme";
import { AppHeader, AppCard, AppButton, AppInput, AppSelect, MenuCard, EmptyState, ErrorView, LoadingScreen } from "../../../components";
import { DatePickerModal } from "../../../components";
import menuService from "../../../services/menuService";
import adminService from "../../../services/adminService";
import { useAuth } from "../../../context/AuthContext";
import { getErrorMessage } from "../../../utils/error";
import { useFetch, useFocusReload } from "../../../hooks/useFetch";
import { getTodayDateString, formatDate } from "../../../utils/date";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "snacks", label: "Snacks" },
  { value: "dinner", label: "Dinner" },
];

export default function MenuManagementScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [date, setDate] = useState(getTodayDateString());
  const [pickerVisible, setPickerVisible] = useState(false);
  const [mealType, setMealType] = useState("breakfast");
  const [items, setItems] = useState("");
  const [hostelId, setHostelId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hostelsRes = useFetch(
    () => (isAdmin ? adminService.getHostels() : Promise.resolve({ data: [] })),
    [isAdmin]
  );
  const hostels = hostelsRes.data || [];
  const hostelOptions = hostels.map((h) => ({ value: h._id, label: h.name }));
  // Warden menus are scoped by the backend to the warden's assigned hostel.
  const selectedHostelId = isAdmin ? (hostelId || hostels[0]?._id || "") : "";

  const { data: menuData, loading, error, refresh, refreshing, reload } = useFetch(
    () => menuService.getMenu(date, selectedHostelId),
    [date, selectedHostelId]
  );
  useFocusReload(reload);

  const menu = menuData?.menu || [];

  const handleSave = async () => {
    if (!items.trim()) { Alert.alert("Error", "Enter at least one food item (comma-separated)."); return; }
    setSubmitting(true);
    try {
      const itemList = items.split(",").map((s) => s.trim()).filter(Boolean);
      await menuService.createMenu({
        date,
        mealType,
        items: itemList,
        hostelId: selectedHostelId || undefined,
        status: "published",
      });
      Alert.alert("Success", "Menu saved successfully.");
      reload();
      setItems("");
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete", "Archive or delete this menu entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await menuService.deleteMenu(id); reload(); } catch (e) { Alert.alert("Error", getErrorMessage(e)); } } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Menu Management" subtitle="Add, edit or delete menu items" showBack onBack={() => navigation.goBack()} style={styles.header} />

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <AppSelect label="Hostel" value={selectedHostelId} options={hostelOptions} onChange={setHostelId} />
        {!isAdmin ? <Text style={styles.hostelNote}>Menus are managed for your assigned hostel.</Text> : null}

        <Pressable style={styles.dateBtn} onPress={() => setPickerVisible(true)}>
          <Text style={styles.dateLabel}>Date</Text>
          <Text style={styles.dateValue}>{formatDate(date)}</Text>
        </Pressable>

        {loading ? <LoadingScreen /> : error ? <ErrorView message={getErrorMessage(error)} onRetry={reload} /> : (
          menu.some((m) => m.items.length) ? (
            menu.map((m) => (
              <View key={m.mealType}>
                <MenuCard mealType={m.mealType} items={m.items} />
                {m._id ? <AppButton title="Delete" variant="danger" onPress={() => handleDelete(m._id)} /> : null}
              </View>
            ))
          ) : (
            <EmptyState emoji="🍽️" title="No menu" description="No menu for this date. Add items below." />
          )
        )}

        <Text style={styles.sectionTitle}>Add / Edit Menu</Text>
        <AppSelect label="Meal Type" value={mealType} options={MEAL_TYPES} onChange={setMealType} />
        <AppInput label="Food Items" placeholder="Comma-separated, e.g. Dal, Rice, Roti" value={items} onChangeText={setItems} />
        <AppButton title="SAVE MENU" onPress={handleSave} loading={submitting} disabled={submitting} />
      </ScrollView>

      <DatePickerModal visible={pickerVisible} value={date} onClose={() => setPickerVisible(false)} onSelect={setDate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  dateBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#f8fafc", marginBottom: 8, marginHorizontal: 16 },
  hostelNote: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8, paddingHorizontal: 16 },
  dateLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  dateValue: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginTop: 16, marginBottom: 12 },
});