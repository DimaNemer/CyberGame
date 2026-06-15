import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🛡️</Text>
      <Text style={styles.title}>CyberGame</Text>
      <Text style={styles.subtitle}>Challenge · Think · Win</Text>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.push("/(auth)/register")}
      >
        <Text style={styles.primaryText}>🚀 Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.secondaryText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#1c375d",
    justifyContent: "center", alignItems: "center", padding: 32
  },
  logo: { fontSize: 72, marginBottom: 16 },
  title: {
    fontSize: 36, fontWeight: "800",
    color: "#fff", marginBottom: 8
  },
  subtitle: {
    fontSize: 14, color: "#a3c4f8ff",
    letterSpacing: 2, marginBottom: 60
  },
  primaryBtn: {
    backgroundColor: "#2563eb", borderRadius: 14,
    padding: 18, width: "100%", alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2563eb", shadowOpacity: 0.5,
    shadowRadius: 15, elevation: 8,
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1, borderColor: "rgba(59,130,246,0.3)",
    borderRadius: 14, padding: 18,
    width: "100%", alignItems: "center",
  },
  secondaryText: { color: "#60a5fa", fontWeight: "700", fontSize: 16 },
});