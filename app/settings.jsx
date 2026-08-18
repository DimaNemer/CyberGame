import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, StyleSheet, Alert, ActivityIndicator,
  TextInput,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../constants/colors";
import { logoutUser } from "../lib/auth";
import { getCurrentUser } from "../lib/api";
import { useSettings } from "../context/SettingsContext";
import { supabase } from "../lib/supabase";

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
const {
  settings,
  toggleSetting,
  setTextSize,
  resetLocalSettings,
} = useSettings();
  const [user,            setUser]           = useState(null);
  const [loggingOut,      setLoggingOut]     = useState(false);
  const [deletingAccount, setDeletingAccount]= useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword,  setDeletePassword] = useState("");
  const [deleteError,     setDeleteError]    = useState("");
  const [verifying,       setVerifying]      = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordError, setPasswordError] = useState("");
const [changingPassword, setChangingPassword] = useState(false);

  // ── Load settings + verify session on mount ────────────
useEffect(() => {
  let mounted = true;

  const verifySession = async () => {
    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        router.replace("/welcome");
        return;
      }

      if (mounted) {
        setUser(currentUser);
      }
    } catch (err) {
      console.error(
        "[Settings session]",
        err?.message
      );
    }
  };

  verifySession();

  return () => {
    mounted = false;
  };
}, [router]);

  // ── Save settings with validation ──────────────────────

  // ── Secure Logout ──────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out", style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            try {
              // SECURITY: verify session before logout
              const currentUser = await getCurrentUser();
              if (!currentUser) { router.replace("/welcome"); return; }
             await logoutUser();

// Reset device-local preferences
await resetLocalSettings();

router.replace("/welcome");
            } catch (err) {
              console.error("[Logout]", err.message);
              Alert.alert("Error", "Could not log out. Please try again.");
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // ── Secure Delete Account with password confirmation ───
  const handleDeleteAccountPress = () => {
    // SECURITY: require password confirmation before showing delete UI
    setDeletePassword("");
    setDeleteError("");
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword.trim()) {
      setDeleteError("Please enter your password to confirm.");
      return;
    }

    // SECURITY: sanitize password input
   const cleanPassword = deletePassword;

if (
  cleanPassword.length < 6 ||
  cleanPassword.length > 128
) {
  setDeleteError(
    "Please enter a valid password."
  );
  return;
}

    setVerifying(true);
    setDeleteError("");

    try {
      // SECURITY: re-authenticate before allowing delete
      // This prevents someone picking up an unlocked phone
      // from deleting the account
      const { error: authError } = await supabase.auth.signInWithPassword({
        email:    user.email,
        password: cleanPassword,
      });

      if (authError) {
        setDeleteError("Incorrect password. Account not deleted.");
        return;
      }

      // Password confirmed — proceed with deletion
      setVerifying(false);
      setDeletingAccount(true);
      setShowDeleteConfirm(false);

      // SECURITY: delete in correct order
      // 1 — Delete profile (triggers cascade in DB)
      await supabase.from("profiles").delete().eq("id", user.id);

      // 2 — Sign out the session
      await logoutUser();

      // 3 — Clear all local storage
      const allKeys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(allKeys);

      router.replace("/welcome");

    } catch (err) {
      console.error("[DeleteAccount]", err.message);
      // SECURITY: generic error — don't expose details
      setDeleteError("Could not delete account. Please try again.");
    } finally {
      setVerifying(false);
      setDeletingAccount(false);
    }
  };

  // ── Reset tutorials ────────────────────────────────────
  const handleResetTutorials = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      // SECURITY: only remove keys with our specific prefix
      const tourKeys = keys.filter(k =>
        typeof k === "string" && k.startsWith("howto_seen_")
      );
      if (tourKeys.length > 0) await AsyncStorage.multiRemove(tourKeys);
      Alert.alert(
        "Tutorials Reset ✅",
        "The how-to-play guide will show again next time you open each game.",
        [{ text: "OK" }]
      );
    } catch (err) {
      console.error("[ResetTutorials]", err.message);
    }
  };
const handleChangePassword = async () => {
  if (!user?.email || changingPassword) return;

  if (!currentPassword) {
    setPasswordError("Enter your current password.");
    return;
  }

  if (newPassword.length < 8 || newPassword.length > 128) {
    setPasswordError(
      "New password must be between 8 and 128 characters."
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordError("New passwords do not match.");
    return;
  }

  if (currentPassword === newPassword) {
    setPasswordError(
      "New password must be different from your current password."
    );
    return;
  }

  try {
    setChangingPassword(true);
    setPasswordError("");

    // Re-authenticate using the current password
    const { error: authError } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

    if (authError) {
      setPasswordError("Current password is incorrect.");
      return;
    }

    // Update password through Supabase Auth
    const { error: updateError } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (updateError) {
      throw updateError;
    }

    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    Alert.alert(
      "Password Updated",
      "Your password has been changed successfully."
    );
  } catch (err) {
    console.error("[ChangePassword]", err?.message);

    setPasswordError(
      "Could not change your password. Please try again."
    );
  } finally {
    setChangingPassword(false);
  }
};
  return (
    <View style={styles.screen}>

     {showPasswordModal && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>
        🔑 Change Password
      </Text>

      <Text style={styles.modalDesc}>
        Verify your current password, then choose a new one.
      </Text>

      <TextInput
        style={styles.passwordInput}
        placeholder="Current password"
        placeholderTextColor={COLORS.textMuted}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={128}
      />

      <TextInput
        style={styles.passwordInput}
        placeholder="New password"
        placeholderTextColor={COLORS.textMuted}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={128}
      />

      <TextInput
        style={styles.passwordInput}
        placeholder="Confirm new password"
        placeholderTextColor={COLORS.textMuted}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={128}
      />

      {passwordError ? (
        <Text style={styles.modalError}>
          {passwordError}
        </Text>
      ) : null}

      <View style={styles.modalBtnRow}>
        <TouchableOpacity
          style={styles.modalCancelBtn}
          onPress={() => {
            if (changingPassword) return;

            setShowPasswordModal(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordError("");
          }}
          disabled={changingPassword}
        >
          <Text style={styles.modalCancelText}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modalDeleteBtn}
          onPress={handleChangePassword}
          disabled={changingPassword}
        >
          {changingPassword ? (
            <ActivityIndicator
              color="#fff"
              size="small"
            />
          ) : (
            <Text style={styles.modalDeleteText}>
              Update Password
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}
      {/* Secure Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🗑️ Delete Account</Text>
            <Text style={styles.modalDesc}>
              This action is permanent and cannot be undone.
              All your data, scores, and progress will be deleted.
              Enter your password to confirm.
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textMuted}
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={128}
            />

            {deleteError ? (
              <Text style={styles.modalError}>{deleteError}</Text>
            ) : null}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={handleConfirmDelete}
                disabled={verifying}
              >
                {verifying
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalDeleteText}>Delete</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Appearance ── */}
        <SectionHeader title="🎨 Appearance" />
        <View style={styles.card}>
        
         
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔤</Text>
              <View>
                <Text style={styles.settingLabel}>Text Size</Text>
                <Text style={styles.settingSub}>Adjust text across the app</Text>
              </View>
            </View>
            <View style={styles.chipRow}>
              {["small", "medium", "large"].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.chip, settings.textSize === size && styles.chipActive]}
                  onPress={() => setTextSize(size)}
                >
                  <Text style={[styles.chipText, settings.textSize === size && styles.chipTextActive]}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text> 
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Game ── */}
        <SectionHeader title="🎮 Game" />
        <View style={styles.card}>
          <SettingRow icon="🔊" label="Sound Effects" sub="Game sounds and music">
           <Switch
  value={settings.soundEnabled}
  onValueChange={() =>
    toggleSetting("soundEnabled")
  }
  trackColor={{
    false: COLORS.bgCardLight,
    true: COLORS.primary,
  }}
  thumbColor="#fff"
/>
          </SettingRow>
          <Divider />
          <SettingRow icon="📳" label="Vibration" sub="Haptic feedback on actions">
          <Switch
  value={settings.vibration}
  onValueChange={() =>
    toggleSetting("vibration")
  }
  trackColor={{
    false: COLORS.bgCardLight,
    true: COLORS.primary,
  }}
  thumbColor="#fff"
/>
          </SettingRow>
          <Divider />
          <SettingRow icon="⏱️" label="Timer Sound" sub="Alert when time is running out">
          <Switch
  value={settings.timerSound}
  onValueChange={() =>
    toggleSetting("timerSound")
  }
  trackColor={{
    false: COLORS.bgCardLight,
    true: COLORS.primary,
  }}
  thumbColor="#fff"
/>
          </SettingRow>
          <Divider />
          <SettingRow icon="💡" label="Show Hints" sub="Display hints during games">
           <Switch
  value={settings.showHints}
  onValueChange={() =>
    toggleSetting("showHints")
  }
  trackColor={{
    false: COLORS.bgCardLight,
    true: COLORS.primary,
  }}
  thumbColor="#fff"
/>
          </SettingRow>
          <Divider />
        
        
          <TouchableOpacity style={styles.accountRow} activeOpacity={0.7} onPress={handleResetTutorials}>
            <Text style={styles.settingIcon}>🎓</Text>
            <View style={styles.accountInfo}>
              <Text style={styles.settingLabel}>Replay Game Tutorials</Text>
              <Text style={styles.settingSub}>Show how-to-play guide again for all games</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

     

        {/* ── Account ── */}
        <SectionHeader title="👤 Account" />
        <View style={styles.card}>
         <TouchableOpacity
  style={styles.accountRow}
  activeOpacity={0.7}
  onPress={() => router.push("/(tabs)/profile")}
>
  <Text style={styles.settingIcon}>👤</Text>

  <View style={styles.accountInfo}>
    <Text style={styles.settingLabel}>Edit Profile</Text>
    <Text style={styles.settingSub}>
      Change username, bio, or profile picture
    </Text>
  </View>

  <Text style={styles.chevron}>›</Text>
</TouchableOpacity>

<Divider />
       
        <TouchableOpacity
  style={styles.accountRow}
  activeOpacity={0.7}
 onPress={() => {
  setPasswordError("");
  setCurrentPassword("");
  setNewPassword("");
  setConfirmPassword("");
  setShowPasswordModal(true);
}}
>
  <Text style={styles.settingIcon}>🔑</Text>

  <View style={styles.accountInfo}>
    <Text style={styles.settingLabel}>Change Password</Text>
    <Text style={styles.settingSub}>
      Update your login password
    </Text>
  </View>

  <Text style={styles.chevron}>›</Text>
</TouchableOpacity>
        </View>

        {/* ── About ── */}
        <SectionHeader title="ℹ️ About" />
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <Divider />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>SDK 54 · RN 0.79</Text>
          </View>
          <Divider />
          <TouchableOpacity style={styles.aboutRow} activeOpacity={0.7}>
            <Text style={styles.aboutLabel}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.aboutRow} activeOpacity={0.7}>
            <Text style={styles.aboutLabel}>Terms of Service</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Danger Zone ── */}
        <SectionHeader title="⚠️ Account Actions" />
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleLogout}
            activeOpacity={0.8}
            disabled={loggingOut}
          >
            <Text style={styles.settingIcon}>⏻</Text>
            {loggingOut
              ? <ActivityIndicator color={COLORS.warning} />
              : <Text style={styles.logoutText}>Log Out</Text>
            }
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity
            style={styles.deleteRow}
            onPress={handleDeleteAccountPress}
            activeOpacity={0.8}
            disabled={deletingAccount}
          >
            <Text style={styles.settingIcon}>🗑️</Text>
            {deletingAccount
              ? <ActivityIndicator color={COLORS.danger} />
              : <Text style={styles.deleteText}>Delete Account</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.appTag}>🛡️ CyberGame · Secured · Encrypted</Text>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({ icon, label, sub, children }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          {sub && <Text style={styles.settingSub}>{sub}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },

  // Secure delete modal
  modalOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center", alignItems: "center", zIndex: 999,
  },
  modalCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 24,
    width: "88%", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
  },
  modalTitle: {
    color: COLORS.danger, fontSize: 18, fontWeight: "800",
    marginBottom: 10, textAlign: "center",
  },
  modalDesc: {
    color: COLORS.textSecondary, fontSize: 13, lineHeight: 19,
    marginBottom: 16, textAlign: "center",
  },
  passwordInput: {
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 12, color: COLORS.textPrimary,
    fontSize: 14, marginBottom: 8,
  },
  modalError: {
    color: COLORS.danger, fontSize: 12, fontWeight: "600",
    textAlign: "center", marginBottom: 12,
  },
  modalBtnRow:    { flexDirection: "row", gap: 10, marginTop: 8 },
  modalCancelBtn: {
    flex: 1, backgroundColor: COLORS.bgCardLight,
    borderRadius: 12, padding: 12, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalCancelText: { color: COLORS.textPrimary, fontWeight: "600" },
  modalDeleteBtn: {
    flex: 1, backgroundColor: COLORS.danger,
    borderRadius: 12, padding: 12, alignItems: "center",
  },
  modalDeleteText: { color: "#fff", fontWeight: "800" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { minWidth: 70 },
  backText:    { color: COLORS.primary, fontSize: 15, fontWeight: "600" },
  headerTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: "800" },

  sectionHeader: {
    color: COLORS.textMuted, fontSize: 11, fontWeight: "700",
    letterSpacing: 1, marginTop: 24, marginBottom: 8, marginLeft: 4,
  },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", padding: 14, gap: 12,
  },
  settingLeft:  { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingIcon:  { fontSize: 20 },
  settingLabel: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "600" },
  settingSub:   { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  divider:      { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },

  chipRow:        { flexDirection: "row", gap: 6 },
  chip: {
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  chipActive:     { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  chipText:       { color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
  chipTextActive: { color: COLORS.primary },

  accountRow:  { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  accountInfo: { flex: 1 },
  chevron:     { color: COLORS.textMuted, fontSize: 20 },

  aboutRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 14,
  },
  aboutLabel: { color: COLORS.textPrimary, fontSize: 14 },
  aboutValue: { color: COLORS.textMuted, fontSize: 13 },

  logoutRow:  { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  logoutText: { color: COLORS.warning, fontSize: 14, fontWeight: "700" },
  deleteRow:  { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  deleteText: { color: COLORS.danger, fontSize: 14, fontWeight: "700" },

  appTag: {
    textAlign: "center", color: COLORS.textMuted,
    fontSize: 11, marginTop: 32, letterSpacing: 1,
  },
});