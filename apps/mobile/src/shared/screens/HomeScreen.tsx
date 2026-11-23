import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        EpiQuest
      </Text>
      <Text style={styles.body}>
        Table de jeu de rôle virtuelle compatible 5e édition. L'application est en construction.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  body: { fontSize: 16 },
});
