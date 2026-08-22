import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";

/**
 * Reusable dropdown/select field.
 * Opens a modal sheet listing `options` ({ value, label }).
 */
export default function AppSelect({
  label,
  placeholder = "Select an option",
  value,
  options = [],
  onChange,
  error,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={[styles.field, disabled && styles.disabled, error && styles.fieldError]}
        accessibilityLabel={label}
        accessibilityRole="button"
      >
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label || "Select"}</Text>
            {options.length === 0 ? (
              <Text style={styles.empty}>No options available</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item, index) => `${item.value}-${index}`}
                renderItem={({ item }) => {
                  const isSelected = String(item.value) === String(value);
                  return (
                    <Pressable
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => {
                        onChange(item.value);
                        setVisible(false);
                      }}
                    >
                      <Text
                        style={[styles.optionText, isSelected && styles.optionTextSelected]}
                      >
                        {item.label}
                      </Text>
                      {isSelected ? <Text style={styles.check}>✓</Text> : null}
                    </Pressable>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: "#f8fafc",
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  fieldError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },
  value: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: COLORS.textMuted,
  },
  chevron: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
  error: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    marginTop: SPACING.xs,
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    maxHeight: "70%",
  },
  sheetTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  empty: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: SPACING.xxl,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  check: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: "700",
  },
});
