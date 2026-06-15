// import {
//   View, Text, TextInput, Pressable,
//   StyleSheet, ScrollView, ActivityIndicator,
// } from "react-native";
// import { useState } from "react";
// import { router } from "expo-router";
// import { registerUser }       from "../../lib/auth";
// import { sanitize, sanitizeEmail, getPasswordStrength } from "../../lib/security";
// import { COLORS } from "../../constants/colors";

// export default function Register() {
//   const [form, setForm] = useState({
//     username: "", email: "", password: "", confirmPassword: "",
//   });
//   const [error,   setError]   = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showPw,  setShowPw]  = useState(false);
//   const [showCpw, setShowCpw] = useState(false);

//   const strength = getPasswordStrength(form.password);

//   const handleChange = (field, value) => {
//     setError("");
//     if (field === "email") {
//       setForm((p) => ({ ...p, email: sanitizeEmail(value) }));
//     } else if (field === "password" || field === "confirmPassword") {
//       // Never sanitize passwords — user may need special characters
//       setForm((p) => ({ ...p, [field]: value }));
//     } else {
//       setForm((p) => ({ ...p, [field]: sanitize(value) }));
//     }
//   };

//   const handleRegister = async () => {
//     setError("");

//     // Client-side confirm password check
//     if (form.password !== form.confirmPassword) {
//       setError("Passwords do not match.");
//       return;
//     }

//     setLoading(true);
//     try {
//       await registerUser({
//         username: form.username,
//         email:    form.email,
//         password: form.password,
//       });
//       router.replace("/(tabs)/dashboard");
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScrollView
//       style={styles.screen}
//       contentContainerStyle={styles.content}
//       keyboardShouldPersistTaps="handled"
//     >
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.iconBox}>
//           <Text style={styles.iconText}>🔐</Text>
//         </View>
//         <Text style={styles.title}>Create Account</Text>
//         <Text style={styles.subtitle}>Join CyberGame Platform</Text>
//       </View>

//       {/* Card */}
//       <View style={styles.card}>

//         {error ? (
//           <View style={styles.errorBox}>
//             <Text style={styles.errorText}>⚠ {error}</Text>
//           </View>
//         ) : null}

//         {/* Username */}
//         <View style={styles.field}>
//           <Text style={styles.label}>🎮  Username</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="e.g. cyber_hunter"
//             placeholderTextColor={COLORS.textMuted}
//             value={form.username}
//             onChangeText={(v) => handleChange("username", v)}
//             autoCapitalize="none"
//             autoCorrect={false}
//             maxLength={20}
//           />
//         </View>

//         {/* Email */}
//         <View style={styles.field}>
//           <Text style={styles.label}>📧  Email</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="you@example.com"
//             placeholderTextColor={COLORS.textMuted}
//             value={form.email}
//             onChangeText={(v) => handleChange("email", v)}
//             autoCapitalize="none"
//             keyboardType="email-address"
//             autoCorrect={false}
//             maxLength={255}
//           />
//         </View>

//         {/* Password */}
//         <View style={styles.field}>
//           <Text style={styles.label}>🔒  Password</Text>
//           <View style={styles.pwRow}>
//             <TextInput
//               style={[styles.input, { flex: 1 }]}
//               placeholder="Min 8 chars, uppercase + number"
//               placeholderTextColor={COLORS.textMuted}
//               value={form.password}
//               onChangeText={(v) => handleChange("password", v)}
//               secureTextEntry={!showPw}
//               maxLength={128}
//             />
//             <Pressable
//               style={styles.eyeBtn}
//               onPress={() => setShowPw((p) => !p)}
//             >
//               <Text>{showPw ? "🙈" : "👁️"}</Text>
//             </Pressable>
//           </View>
//           {form.password.length > 0 && (
//             <View style={styles.strengthContainer}>
//               <View style={styles.strengthBar}>
//                 <View style={[
//                   styles.strengthFill,
//                   { width: `${strength.percent}%`, backgroundColor: strength.color },
//                 ]} />
//               </View>
//               <Text style={styles.strengthLabel}>
//                 Strength:{" "}
//                 <Text style={{ color: strength.color, fontWeight: "700" }}>
//                   {strength.label}
//                 </Text>
//               </Text>
//             </View>
//           )}
//         </View>

//         {/* Confirm Password */}
//         <View style={styles.field}>
//           <Text style={styles.label}>✅  Confirm Password</Text>
//           <View style={styles.pwRow}>
//             <TextInput
//               style={[styles.input, { flex: 1 }]}
//               placeholder="Repeat your password"
//               placeholderTextColor={COLORS.textMuted}
//               value={form.confirmPassword}
//               onChangeText={(v) => handleChange("confirmPassword", v)}
//               secureTextEntry={!showCpw}
//               maxLength={128}
//             />
//             <Pressable
//               style={styles.eyeBtn}
//               onPress={() => setShowCpw((p) => !p)}
//             >
//               <Text>{showCpw ? "🙈" : "👁️"}</Text>
//             </Pressable>
//           </View>
//         </View>

//         {/* Submit */}
//         <Pressable
//           style={[styles.button, loading && styles.buttonDisabled]}
//           onPress={handleRegister}
//           disabled={loading}
//         >
//           {loading
//             ? <ActivityIndicator color="#fff" />
//             : <Text style={styles.buttonText}>🚀  Create Account</Text>
//           }
//         </Pressable>

//         {/* Login link */}
//         <View style={styles.footer}>
//           <Text style={styles.footerText}>Already have an account? </Text>
//           <Pressable onPress={() => router.push("/(auth)/login")}>
//             <Text style={styles.link}>Log In →</Text>
//           </Pressable>
//         </View>

//       </View>

//       <Text style={styles.secureNote}>🛡️ Secured · Encrypted · Protected</Text>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   screen:  { flex: 1, backgroundColor: COLORS.bg },
//   content: { flexGrow: 1, justifyContent: "center", padding: 24, paddingVertical: 60 },

//   header: { alignItems: "center", marginBottom: 32 },
//   iconBox: {
//     width: 72, height: 72, borderRadius: 20,
//     backgroundColor: COLORS.primaryGlow,
//     borderWidth: 1, borderColor: COLORS.borderBlue,
//     alignItems: "center", justifyContent: "center",
//     marginBottom: 16,
//     shadowColor: COLORS.primary, shadowOpacity: 0.4,
//     shadowRadius: 20, elevation: 10,
//   },
//   iconText: { fontSize: 32 },
//   title:    { color: COLORS.textPrimary, fontSize: 26, fontWeight: "800", marginBottom: 6 },
//   subtitle: { color: COLORS.primary,     fontSize: 13, letterSpacing: 1 },

//   card: {
//     backgroundColor: COLORS.bgCard,
//     borderRadius: 24, padding: 24,
//     borderWidth: 1, borderColor: COLORS.borderBlue,
//   },

//   errorBox: {
//     backgroundColor: "rgba(239,68,68,0.1)",
//     borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
//     borderRadius: 12, padding: 12, marginBottom: 16,
//   },
//   errorText: { color: "#fca5a5", fontSize: 13 },

//   field:  { marginBottom: 18 },
//   label:  { color: COLORS.primary, fontSize: 13, fontWeight: "600", marginBottom: 8 },
//   input: {
//     backgroundColor: "rgba(255,255,255,0.04)",
//     borderWidth: 1, borderColor: COLORS.border,
//     borderRadius: 12, padding: 14,
//     color: COLORS.textPrimary, fontSize: 15,
//   },
//   pwRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
//   eyeBtn: {
//     backgroundColor: "rgba(255,255,255,0.04)",
//     borderWidth: 1, borderColor: COLORS.border,
//     borderRadius: 12, padding: 14,
//   },

//   strengthContainer: { marginTop: 8 },
//   strengthBar: {
//     height: 5, backgroundColor: COLORS.bgCardLight,
//     borderRadius: 99, overflow: "hidden",
//   },
//   strengthFill:  { height: "100%", borderRadius: 99 },
//   strengthLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 5 },

//   button: {
//     backgroundColor: COLORS.primary,
//     borderRadius: 14, padding: 16,
//     alignItems: "center", marginTop: 4,
//     shadowColor: COLORS.primary, shadowOpacity: 0.5,
//     shadowRadius: 15, elevation: 8,
//   },
//   buttonDisabled: { opacity: 0.5 },
//   buttonText:     { color: "#fff", fontWeight: "800", fontSize: 16 },

//   footer:      { flexDirection: "row", justifyContent: "center", marginTop: 20 },
//   footerText:  { color: COLORS.textSecondary, fontSize: 14 },
//   link:        { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
//   secureNote:  { textAlign: "center", color: COLORS.textMuted, fontSize: 12, marginTop: 28 },
// });

import {
  View, Text, TextInput, Pressable,
  StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { registerUser } from "../../lib/auth";
import { getPasswordStrength } from "../../lib/security";
import { COLORS } from "../../constants/colors";

export default function Register() {
  const [form, setForm] = useState({
    username: "", email: "", password: "", confirmPassword: "",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const strength = getPasswordStrength(form.password);

  // Store raw value while typing — sanitize only on submit
  const handleChange = (field, value) => {
    setError("");
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleRegister = async () => {
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        username: form.username,
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      router.replace("/onboarding");
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
          <Text style={styles.iconText}>🔐</Text>
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join CyberGame Platform</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        {/* Username */}
        <View style={styles.field}>
          <Text style={styles.label}>🎮  Username</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. cyber_hunter"
            placeholderTextColor={COLORS.textMuted}
            value={form.username}
            onChangeText={(v) => handleChange("username", v)}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>📧  Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textMuted}
            value={form.email}
            onChangeText={(v) => handleChange("email", v)}
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
              placeholder="Min 8 chars, uppercase + number"
              placeholderTextColor={COLORS.textMuted}
              value={form.password}
              onChangeText={(v) => handleChange("password", v)}
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
          {form.password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View style={[
                  styles.strengthFill,
                  { width: `${strength.percent}%`, backgroundColor: strength.color },
                ]} />
              </View>
              <Text style={styles.strengthLabel}>
                Strength:{" "}
                <Text style={{ color: strength.color, fontWeight: "700" }}>
                  {strength.label}
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.field}>
          <Text style={styles.label}>✅  Confirm Password</Text>
          <View style={styles.pwRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Repeat your password"
              placeholderTextColor={COLORS.textMuted}
              value={form.confirmPassword}
              onChangeText={(v) => handleChange("confirmPassword", v)}
              secureTextEntry={!showCpw}
              maxLength={128}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowCpw((p) => !p)}
            >
              <Text>{showCpw ? "🙈" : "👁️"}</Text>
            </Pressable>
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>🚀  Create Account</Text>
          }
        </Pressable>

        {/* Login link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.link}>Log In →</Text>
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
  header:  { alignItems: "center", marginBottom: 32 },
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
  subtitle: { color: COLORS.primary, fontSize: 13, letterSpacing: 1 },
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
  errorText:  { color: "#fca5a5", fontSize: 13 },
  field:      { marginBottom: 18 },
  label:      { color: COLORS.primary, fontSize: 13, fontWeight: "600", marginBottom: 8 },
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
  strengthContainer: { marginTop: 8 },
  strengthBar: {
    height: 5, backgroundColor: COLORS.bgCardLight,
    borderRadius: 99, overflow: "hidden",
  },
  strengthFill:  { height: "100%", borderRadius: 99 },
  strengthLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 5 },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: 4,
    shadowColor: COLORS.primary, shadowOpacity: 0.5,
    shadowRadius: 15, elevation: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: "#fff", fontWeight: "800", fontSize: 16 },
  footer:      { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText:  { color: COLORS.textSecondary, fontSize: 14 },
  link:        { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
  secureNote:  { textAlign: "center", color: COLORS.textMuted, fontSize: 12, marginTop: 28 },
});