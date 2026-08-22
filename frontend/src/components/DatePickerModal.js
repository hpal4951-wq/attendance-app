import React, { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function DatePickerModal({ visible, onClose, onSelect, value }) {
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [viewDate, setViewDate] = useState(initial);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedStr = value;
  const todayStr = toDateStr(new Date());

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const changeMonth = (delta) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const handleSelect = (day) => {
    onSelect(toDateStr(new Date(year, month, day)));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Select Date</Text>

          <View style={styles.header}>
            <Pressable style={styles.navBtn} onPress={() => changeMonth(-1)}>
              <Text style={styles.navText}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
            <Pressable style={styles.navBtn} onPress={() => changeMonth(1)}>
              <Text style={styles.navText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={`${w}-${i}`} style={styles.weekday}>{w}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              const dateStr = toDateStr(new Date(year, month, day));
              const isSelected = dateStr === selectedStr;
              const isToday = dateStr === todayStr;
              return (
                <Pressable
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && styles.daySelected,
                    isToday && !isSelected && styles.dayToday,
                  ]}
                  onPress={() => handleSelect(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  monthLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: SPACING.xs,
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1.3,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  dayText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: "700",
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  cancelBtn: {
    marginTop: SPACING.lg,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg,
    alignItems: "center",
  },
  cancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
});
