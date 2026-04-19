import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
// import { getTodayMenu } from "../services/menuService";
// import { getActivePolls } from "../services/pollService";
import { getMyAttendance } from "../services/attendanceService";

export default function HomeScreen() {
  // const [menu, setMenu] = useState(null);
  // const [polls, setPolls] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // const menuRes = await getTodayMenu();
      // const pollRes = await getActivePolls();
      const attendanceRes = await getMyAttendance();

      // if (menuRes.success) setMenu(menuRes.data);
      // if (pollRes.success) setPolls(pollRes.data || []);
      if (attendanceRes.success) setAttendance(attendanceRes.data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load dashboard");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Student Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today Menu</Text>
        {menu ? (
          <>
            <Text>Breakfast: {menu.breakfast?.join(", ")}</Text>
            <Text>Lunch: {menu.lunch?.join(", ")}</Text>
            <Text>Snacks: {menu.snacks?.join(", ")}</Text>
            <Text>Dinner: {menu.dinner?.join(", ")}</Text>
          </>
        ) : (
          <Text>No menu available</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Polls</Text>
        {polls.length > 0 ? (
          polls.map((poll) => (
            <Text key={poll._id}>{poll.title}</Text>
          ))
        ) : (
          <Text>No active polls</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Attendance</Text>
        {attendance.length > 0 ? (
          attendance.slice(0, 5).map((item) => (
            <Text key={item._id}>
              {item.date} - {item.slot} - {item.status}
            </Text>
          ))
        ) : (
          <Text>No attendance records</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
});