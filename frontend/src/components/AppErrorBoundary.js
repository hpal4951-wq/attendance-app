import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";

export default class AppErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>An unexpected error occurred. Please restart the application.</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
            <Text style={styles.buttonText}>Restart</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center", padding: SPACING.xxxl },
  emoji: { fontSize: 48, marginBottom: SPACING.lg },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: "900", color: COLORS.textPrimary, marginBottom: SPACING.sm },
  message: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: SPACING.xl },
  button: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: RADIUS.md },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: "700" },
});