import {
    View, Text, ScrollView, TouchableOpacity,
    Switch, StyleSheet, Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

// ── Default settings — save to AsyncStorage later ─────────
const DEFAULT_SETTINGS = {
    // Appearance
    darkMode: true,
    textSize: "medium",  // small / medium / large

    // Game
    soundEnabled: true,
    vibration: true,
    timerSound: true,
    showHints: true,
    defaultDiff: "MEDIUM",  // EASY / MEDIUM / HARD / EXPERT

    // Notifications
    streakReminder: true,
    friendAlerts: true,
    roomInvites: true,
    leaderUpdates: false,

    // Privacy
    showOnline: true,
    allowFriends: true,
    publicProfile: true,
};
// ─────────────────────────────────────────────────────────

const TEXT_SIZES = ["small", "medium", "large"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "EXPERT"];

const DIFF_COLORS = {
    EASY: COLORS.success,
    MEDIUM: COLORS.warning,
    HARD: "#f97316",
    EXPERT: "#c084fc",
};

export default function Settings() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [s, setS] = useState(DEFAULT_SETTINGS);

    const toggle = (key) => {
        setS((p) => ({ ...p, [key]: !p[key] }));
        // TODO: save to AsyncStorage
        // await AsyncStorage.setItem('settings', JSON.stringify({...s, [key]: !s[key]}));
    };

    const set = (key, value) => {
        setS((p) => ({ ...p, [key]: value }));
        // TODO: save to AsyncStorage
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure? This action cannot be undone. All your data, scores and progress will be permanently deleted.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        // TODO: delete from Supabase
                        // await supabase.auth.admin.deleteUser(userId)
                        router.replace("/welcome");
                    },
                },
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: () => {
                        // TODO: await logoutUser()
                        router.replace("/welcome");
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.screen}>

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>⚙️ Settings</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: insets.bottom + 32 },
                ]}
                showsVerticalScrollIndicator={false}
            >

                {/* ── Appearance ── */}
                <SectionHeader title="🎨 Appearance" />
                <View style={styles.card}>

                    <SettingRow
                        icon="🌙"
                        label="Dark Mode"
                        sub="Dark background for all screens"
                    >
                        <Switch
                            value={s.darkMode}
                            onValueChange={() => toggle("darkMode")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                    <Divider />

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}>🔤</Text>
                            <View>
                                <Text style={styles.settingLabel}>Text Size</Text>
                                <Text style={styles.settingSub}>Adjust text across the app</Text>
                            </View>
                        </View>
                        <View style={styles.chipRow}>
                            {TEXT_SIZES.map((size) => (
                                <TouchableOpacity
                                    key={size}
                                    style={[
                                        styles.chip,
                                        s.textSize === size && styles.chipActive,
                                    ]}
                                    onPress={() => set("textSize", size)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        s.textSize === size && styles.chipTextActive,
                                    ]}>
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
                            value={s.soundEnabled}
                            onValueChange={() => toggle("soundEnabled")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                    <Divider />

                    <SettingRow icon="📳" label="Vibration" sub="Haptic feedback on actions">
                        <Switch
                            value={s.vibration}
                            onValueChange={() => toggle("vibration")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                    <Divider />

                    <SettingRow icon="⏱️" label="Timer Sound" sub="Alert when time is running out">
                        <Switch
                            value={s.timerSound}
                            onValueChange={() => toggle("timerSound")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                    <Divider />

                    <SettingRow icon="💡" label="Show Hints" sub="Display hints during games">
                        <Switch
                            value={s.showHints}
                            onValueChange={() => toggle("showHints")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                    <Divider />

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}>🎯</Text>
                            <View>
                                <Text style={styles.settingLabel}>Default Difficulty</Text>
                                <Text style={styles.settingSub}>Starting level for new games</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.diffRow}>
                        {DIFFICULTIES.map((d) => (
                            <TouchableOpacity
                                key={d}
                                style={[
                                    styles.diffChip,
                                    s.defaultDiff === d && {
                                        backgroundColor: DIFF_COLORS[d] + "20",
                                        borderColor: DIFF_COLORS[d],
                                    },
                                ]}
                                onPress={() => set("defaultDiff", d)}
                            >
                                <Text style={[
                                    styles.diffChipText,
                                    s.defaultDiff === d && { color: DIFF_COLORS[d] },
                                ]}>
                                    {d}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                </View>

                {/* ── Notifications ── */}
                <SectionHeader title="🔔 Notifications" />
                <View style={styles.card}>

                    <SettingRow icon="🔥" label="Streak Reminder" sub="Daily reminder to keep your streak">
                        <Switch
                            value={s.streakReminder}
                            onValueChange={() => toggle("streakReminder")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                    <Divider />

                    <SettingRow icon="👥" label="Friend Requests" sub="When someone sends you a request">
                        <Switch
                            value={s.friendAlerts}
                            onValueChange={() => toggle("friendAlerts")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                    <Divider />

                    <SettingRow icon="🚪" label="Room Invites" sub="When a friend invites you to a game">
                        <Switch
                            value={s.roomInvites}
                            onValueChange={() => toggle("roomInvites")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                    <Divider />

                    <SettingRow icon="🏆" label="Leaderboard Updates" sub="When your rank changes">
                        <Switch
                            value={s.leaderUpdates}
                            onValueChange={() => toggle("leaderUpdates")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                </View>

                {/* ── Privacy ── */}
                <SectionHeader title="🔒 Privacy" />
                <View style={styles.card}>

                    <SettingRow icon="🟢" label="Show Online Status" sub="Friends can see when you're online">
                        <Switch
                            value={s.showOnline}
                            onValueChange={() => toggle("showOnline")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                    <Divider />

                    <SettingRow icon="👋" label="Allow Friend Requests" sub="Let other players follow you">
                        <Switch
                            value={s.allowFriends}
                            onValueChange={() => toggle("allowFriends")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                    <Divider />

                    <SettingRow icon="👁️" label="Public Profile" sub="Anyone can view your profile">
                        <Switch
                            value={s.publicProfile}
                            onValueChange={() => toggle("publicProfile")}
                            trackColor={{ false: COLORS.bgCardLight, true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </SettingRow>

                </View>

                {/* ── Account ── */}
                <SectionHeader title="👤 Account" />
                <View style={styles.card}>

                    <TouchableOpacity
                        style={styles.accountRow}
                        activeOpacity={0.7}
                        onPress={() => { }}
                    >
                        <Text style={styles.settingIcon}>✏️</Text>
                        <View style={styles.accountInfo}>
                            <Text style={styles.settingLabel}>Change Username</Text>
                            <Text style={styles.settingSub}>Update your display name</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <Divider />

                    <TouchableOpacity
                        style={styles.accountRow}
                        activeOpacity={0.7}
                        onPress={() => { }}
                    >
                        <Text style={styles.settingIcon}>😀</Text>
                        <View style={styles.accountInfo}>
                            <Text style={styles.settingLabel}>Change Avatar</Text>
                            <Text style={styles.settingSub}>Pick a new emoji avatar</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <Divider />

                    <TouchableOpacity
                        style={styles.accountRow}
                        activeOpacity={0.7}
                        onPress={() => { }}
                    >
                        <Text style={styles.settingIcon}>🔑</Text>
                        <View style={styles.accountInfo}>
                            <Text style={styles.settingLabel}>Change Password</Text>
                            <Text style={styles.settingSub}>Update your login password</Text>
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
                    >
                        <Text style={styles.settingIcon}>⏻</Text>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                    <Divider />

                    <TouchableOpacity
                        style={styles.deleteRow}
                        onPress={handleDeleteAccount}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.settingIcon}>🗑️</Text>
                        <Text style={styles.deleteText}>Delete Account</Text>
                    </TouchableOpacity>

                </View>

                {/* App tag */}
                <Text style={styles.appTag}>
                    🛡️ CyberGame · Secured · Encrypted
                </Text>

            </ScrollView>
        </View>
    );
}

// ── Reusable components ───────────────────────────────────

function SectionHeader({ title }) {
    return (
        <Text style={styles.sectionHeader}>{title}</Text>
    );
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
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 8 },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: { minWidth: 70 },
    backText: { color: COLORS.primary, fontSize: 15, fontWeight: "600" },
    headerTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: "800" },

    // Section header
    sectionHeader: {
        color: COLORS.textMuted,
        fontSize: 11, fontWeight: "700",
        letterSpacing: 1,
        marginTop: 24, marginBottom: 8,
        marginLeft: 4,
    },

    // Card
    card: {
        backgroundColor: COLORS.bgCard,
        borderRadius: 16,
        borderWidth: 1, borderColor: COLORS.border,
        overflow: "hidden",
    },

    // Setting row
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14, gap: 12,
    },
    settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    settingIcon: { fontSize: 20 },
    settingLabel: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "600" },
    settingSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },

    divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },

    // Chips
    chipRow: { flexDirection: "row", gap: 6 },
    chip: {
        backgroundColor: COLORS.bgCardLight,
        borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    },
    chipActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
    chipText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
    chipTextActive: { color: COLORS.primary },

    // Difficulty chips
    diffRow: {
        flexDirection: "row", gap: 8,
        paddingHorizontal: 14, paddingBottom: 14,
    },
    diffChip: {
        flex: 1,
        backgroundColor: COLORS.bgCardLight,
        borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 10, paddingVertical: 8,
        alignItems: "center",
    },
    diffChipText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },

    // Account rows
    accountRow: {
        flexDirection: "row", alignItems: "center",
        padding: 14, gap: 12,
    },
    accountInfo: { flex: 1 },
    chevron: { color: COLORS.textMuted, fontSize: 20 },

    // About
    aboutRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
    },
    aboutLabel: { color: COLORS.textPrimary, fontSize: 14 },
    aboutValue: { color: COLORS.textMuted, fontSize: 13 },

    // Logout / Delete
    logoutRow: {
        flexDirection: "row", alignItems: "center",
        padding: 14, gap: 12,
    },
    logoutText: { color: COLORS.warning, fontSize: 14, fontWeight: "700" },

    deleteRow: {
        flexDirection: "row", alignItems: "center",
        padding: 14, gap: 12,
    },
    deleteText: { color: COLORS.danger, fontSize: 14, fontWeight: "700" },

    // App tag
    appTag: {
        textAlign: "center",
        color: COLORS.textMuted,
        fontSize: 11, marginTop: 32,
        letterSpacing: 1,
    },
});