import {
  View, Text, TextInput, Pressable,
  StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { loginUser }               from "../../lib/auth";
import { sanitizeEmail }           from "../../lib/security";
import { COLORS }                  from "../../constants/colors";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginUser({
        email:    sanitizeEmail(email),
        password,
      });
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>🔑</Text>
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to CyberGame</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>📧  Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={(v) => { setError(""); setEmail(v); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            maxLength={255}
          />
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>🔒  Password</Text>
          <View style={styles.pwRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Your password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={(v) => { setError(""); setPassword(v); }}
              secureTextEntry={!showPw}
              maxLength={128}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowPw((p) => !p)}
            >
              <Text>{showPw ? "🙈" : "👁️"}</Text>
            </Pressable>
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>⚡  Log In</Text>
          }
        </Pressable>

        {/* Register link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>No account? </Text>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.link}>Create one →</Text>
          </Pressable>
        </View>

      </View>

      <Text style={styles.secureNote}>🛡️ Secured · Encrypted · Protected</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.bg },
  content: { flexGrow: 1, justifyContent: "center", padding: 24, paddingVertical: 60 },

  header: { alignItems: "center", marginBottom: 32 },
  iconBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    shadowColor: COLORS.primary, shadowOpacity: 0.4,
    shadowRadius: 20, elevation: 10,
  },
  iconText: { fontSize: 32 },
  title:    { color: COLORS.textPrimary, fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: COLORS.primary,     fontSize: 13, letterSpacing: 1 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: COLORS.borderBlue,
  },

  errorBox: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: "#fca5a5", fontSize: 13 },

  field:  { marginBottom: 18 },
  label:  { color: COLORS.primary, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 14,
    color: COLORS.textPrimary, fontSize: 15,
  },
  pwRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 14,
  },

  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: 4,
    shadowColor: COLORS.primary, shadowOpacity: 0.5,
    shadowRadius: 15, elevation: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: "#fff", fontWeight: "800", fontSize: 16 },

  footer:     { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  link:       { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
  secureNote: { textAlign: "center", color: COLORS.textMuted, fontSize: 12, marginTop: 28 },
});