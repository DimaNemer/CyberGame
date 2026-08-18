

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import { COLORS } from "../../constants/colors";
import { getCurrentUser, getProfile, getStreak } from "../../lib/api";
import { supabase } from "../../lib/supabase";

// ── Static achievements (unlock logic added later) ────────
const ACHIEVEMENTS = [
  { id: "1", title: "First Blood",   desc: "Win your first game",      icon: "🩸", unlocked: false },
  { id: "2", title: "Streak Master", desc: "Reach a 7-day streak",     icon: "🔥", unlocked: false },
  { id: "3", title: "Cyber Pro",     desc: "Win 50 games",             icon: "🏆", unlocked: false },
  { id: "4", title: "Phish Slayer",  desc: "Win 10 Phishing games",    icon: "🎣", unlocked: false },
  { id: "5", title: "Quantum Mind",  desc: "Win 5 Quantum games",      icon: "⚛️", unlocked: false },
  { id: "6", title: "Century Club",  desc: "Play 100 games",           icon: "💯", unlocked: false },
  { id: "7", title: "Unbreakable",   desc: "Reach a 30-day streak",    icon: "🛡️", unlocked: false },
  { id: "8", title: "Elite Hacker",  desc: "Reach rank #1",            icon: "👑", unlocked: false },
];

const PROFILE_TABS = ["Overview", "Games", "Achievements"];

// ── Compute unlocked achievements from real data ──────────
function computeAchievements(profile, streak) {
  return ACHIEVEMENTS.map((a) => {
    let unlocked = false;
    if (a.id === "1") unlocked = (profile?.total_wins ?? 0) >= 1;
    if (a.id === "2") unlocked = (streak?.current_streak ?? 0) >= 7;
    if (a.id === "3") unlocked = (profile?.total_wins ?? 0) >= 50;
    if (a.id === "6") unlocked = (profile?.total_games ?? 0) >= 100;
    if (a.id === "7") unlocked = (streak?.current_streak ?? 0) >= 30;
    return { ...a, unlocked };
  });
}

// ── XP level thresholds ───────────────────────────────────
function getNextLevelXP(level) {
  return level * 500 + 1000;
}
// ─────────────────────────────────────────────────────────

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile,      setProfile]      = useState(null);
  const [streak,       setStreak]       = useState(null);
  const [recentGames,  setRecentGames]  = useState([]);
  const [rank,         setRank]         = useState("—");
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setTab]          = useState("Overview");
  const [user, setUser] = useState(null);

const [editingProfile, setEditingProfile] =
  useState(false);

const [editUsername, setEditUsername] =
  useState("");

const [editBio, setEditBio] =
  useState("");

const [savingProfile, setSavingProfile] =
  useState(false);

const [uploadingAvatar, setUploadingAvatar] =
  useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) { router.replace("/welcome"); return; }
      setUser(user);

      const [prof, str, sessions, leaderboard] = await Promise.all([
        getProfile(user.id),
        getStreak(user.id),
        // Recent game sessions
        supabase
          .from("game_sessions")
          .select("id, score, result, played_at, games:game_id(title, category, icon)")
          .eq("player_id", user.id)
          .order("played_at", { ascending: false })
          .limit(10),
        // Global leaderboard for rank
        supabase
          .from("profiles")
          .select("id")
          .eq("is_banned", false)
          .order("streak", { ascending: false })
          .limit(1000),
      ]);

      if (prof)  setProfile(prof);
      if (str)   setStreak(str);

      if (sessions?.data) {
        setRecentGames(sessions.data);
      }

      if (leaderboard?.data && prof) {
        const idx = leaderboard.data.findIndex(p => p.id === prof.id);
        setRank(idx >= 0 ? `#${idx + 1}` : "—");
      }

    } catch (err) {
      console.error("[Profile]", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Navbar />
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </View>
    );
  }

  const level       = profile?.level ?? 1;
  const xp          = profile?.xp ?? 0;
  const nextLevelXP = getNextLevelXP(level);
  const xpPercent   = Math.min((xp / nextLevelXP) * 100, 100);
  const totalGames  = profile?.total_games ?? 0;
  const totalWins   = profile?.total_wins  ?? 0;
  const winRate     = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const achievements = computeAchievements(profile, streak);

const openProfileEditor = () => {
  setEditUsername(
    profile?.username ?? ""
  );

  setEditBio(
    profile?.bio ?? ""
  );

  setEditingProfile(true);
};


const handleSaveProfile = async () => {
  if (!user?.id || savingProfile) {
    return;
  }

  const username =
    editUsername.trim();

  const bio =
    editBio.trim();

  if (
    username.length < 3 ||
    username.length > 30
  ) {
    Alert.alert(
      "Invalid Username",
      "Username must be between 3 and 30 characters."
    );

    return;
  }

  if (
    !/^[A-Za-z0-9_.-]+$/.test(username)
  ) {
    Alert.alert(
      "Invalid Username",
      "Use only letters, numbers, underscores, dots and hyphens."
    );

    return;
  }

  if (bio.length > 300) {
    Alert.alert(
      "Bio Too Long",
      "Bio must be 300 characters or less."
    );

    return;
  }

  try {
    setSavingProfile(true);

    const { data, error } =
      await supabase.rpc(
        "update_my_profile",
        {
          p_username: username,
          p_bio: bio,
          p_avatar_url: null,
        }
      );

    if (error) {
      if (
        error.message
          ?.toLowerCase()
          .includes("username already taken")
      ) {
        Alert.alert(
          "Username Unavailable",
          "That username is already taken."
        );

        return;
      }

      throw error;
    }

    const updated =
      Array.isArray(data)
        ? data[0]
        : data;

    if (updated) {
      setProfile(updated);
    } else {
      await loadProfile();
    }

    setEditingProfile(false);

    Alert.alert(
      "Saved",
      "Your profile has been updated."
    );
  } catch (error) {
    console.error(
      "[Profile update]",
      error?.message
    );

    Alert.alert(
      "Update Failed",
      "Your profile could not be updated."
    );
  } finally {
    setSavingProfile(false);
  }
};
  
const getAvatarUrl = () => {
  const path = profile?.avatar_url;

  if (
    !path ||
    typeof path !== "string" ||
    !path.includes("/")
  ) {
    return null;
  }

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  return data?.publicUrl ?? null;
};

const avatarUrl = getAvatarUrl();

const handleChangeAvatar = async () => {
  if (!user?.id || uploadingAvatar) {
    return;
  }

  try {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow photo access to choose a profile picture."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0];

    if (!asset?.uri) {
      throw new Error("No image selected");
    }

    // Maximum 5 MB — same as Storage bucket.
    if (
      typeof asset.fileSize === "number" &&
      asset.fileSize > 5 * 1024 * 1024
    ) {
      Alert.alert(
        "Image Too Large",
        "Please choose an image smaller than 5 MB."
      );
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const mimeType =
      asset.mimeType ?? "image/jpeg";

    if (!allowedTypes.includes(mimeType)) {
      Alert.alert(
        "Unsupported Image",
        "Please choose a JPG, PNG or WebP image."
      );
      return;
    }

    setUploadingAvatar(true);

    /*
     * Stable filename.
     * We overwrite the user's own avatar instead of
     * allowing arbitrary object names.
     */
    const extension =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";

    const avatarPath =
      `${user.id}/avatar.${extension}`;

    /*
     * React Native / Expo:
     * convert selected local file to ArrayBuffer before
     * sending to Supabase Storage.
     */
    const response = await fetch(asset.uri);

    if (!response.ok) {
      throw new Error("Could not read selected image");
    }

    const arrayBuffer =
      await response.arrayBuffer();

    if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
      throw new Error("Selected image exceeds 5 MB");
    }

    const { error: uploadError } =
      await supabase.storage
        .from("avatars")
        .upload(
          avatarPath,
          arrayBuffer,
          {
            contentType: mimeType,
            upsert: true,
            cacheControl: "3600",
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    /*
     * Store only the validated Storage path through
     * our protected RPC.
     */
    const { data, error: profileError } =
      await supabase.rpc(
        "update_my_profile",
        {
          p_username: null,
          p_bio: null,
          p_avatar_url: avatarPath,
        }
      );

    if (profileError) {
      throw profileError;
    }

    if (data) {
      setProfile(
        Array.isArray(data)
          ? data[0]
          : data
      );
    } else {
      await loadProfile();
    }

    Alert.alert(
      "Profile Updated",
      "Your profile picture has been changed."
    );
  } catch (error) {
    console.error(
      "[Avatar upload]",
      error?.message
    );

    Alert.alert(
      "Upload Failed",
      "Your profile picture could not be updated."
    );
  } finally {
    setUploadingAvatar(false);
  }
};

  return (
    <View style={styles.screen}>
      <Modal
  visible={editingProfile}
  transparent
  animationType="fade"
  onRequestClose={() =>
    setEditingProfile(false)
  }
>
  <View style={styles.editOverlay}>
    <View style={styles.editCard}>
      <Text style={styles.editTitle}>
        Edit Profile
      </Text>

      <Text style={styles.editLabel}>
        Username
      </Text>

      <TextInput
        style={styles.editInput}
        value={editUsername}
        onChangeText={setEditUsername}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        placeholder="Username"
        placeholderTextColor={
          COLORS.textMuted
        }
      />

      <Text style={styles.editCounter}>
        {editUsername.length}/30
      </Text>

      <Text style={styles.editLabel}>
        Bio
      </Text>

      <TextInput
        style={[
          styles.editInput,
          styles.bioInput,
        ]}
        value={editBio}
        onChangeText={setEditBio}
        multiline
        maxLength={300}
        placeholder="Tell players something about you..."
        placeholderTextColor={
          COLORS.textMuted
        }
      />

      <Text style={styles.editCounter}>
        {editBio.length}/300
      </Text>

      <View style={styles.editActions}>
        <TouchableOpacity
          style={styles.cancelEditButton}
          onPress={() =>
            setEditingProfile(false)
          }
          disabled={savingProfile}
        >
          <Text style={styles.cancelEditText}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveEditButton}
          onPress={handleSaveProfile}
          disabled={savingProfile}
        >
          {savingProfile ? (
            <ActivityIndicator
              color="#fff"
              size="small"
            />
          ) : (
            <Text style={styles.saveEditText}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
      <Navbar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBg} />
          <View style={styles.avatarWrapper}>
        <TouchableOpacity
  style={styles.avatarCircle}
  onPress={handleChangeAvatar}
  disabled={uploadingAvatar}
  activeOpacity={0.85}
  accessibilityRole="button"
  accessibilityLabel="Change profile picture"
>
  {uploadingAvatar ? (
    <ActivityIndicator
      color={COLORS.primary}
    />
  ) : avatarUrl ? (
    <Image
      source={{ uri: avatarUrl }}
      style={styles.avatarImage}
    />
  ) : (
    <Text style={styles.avatarEmoji}>
      {profile?.avatar_url &&
      !profile.avatar_url.includes("/")
        ? profile.avatar_url
        : "🥷"}
    </Text>
  )}

  <View style={styles.avatarEditBadge}>
    <Text style={styles.avatarEditIcon}>
      📷
    </Text>
  </View>
</TouchableOpacity>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{rank}</Text>
            </View>
          </View>

          <TouchableOpacity
  onPress={openProfileEditor}
  activeOpacity={0.8}
>
  <Text style={styles.heroName}>
    {profile?.username ?? "Player"} ✏️
  </Text>
</TouchableOpacity>
          <Text style={styles.heroJoined}>
            🗓️ Joined {new Date(profile?.created_at ?? Date.now())
              .toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </Text>
          {profile?.bio ? (
  <Text style={styles.profileBio}>
    {profile.bio}
  </Text>
) : null}

          <View style={styles.levelRow}>
            <Text style={styles.levelText}>Level {level}</Text>
            <Text style={styles.levelNext}>
              {xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
            </Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
          </View>
          <Text style={styles.xpHint}>
            {(nextLevelXP - xp).toLocaleString()} XP to Level {level + 1}
          </Text>

          <View style={styles.heroStats}>
            {[
              { label: "XP",     value: xp.toLocaleString(),           icon: "⚡", color: COLORS.rank[1] },
              { label: "Streak", value: `${streak?.current_streak ?? 0}d`, icon: "🔥", color: "#f97316"  },
              { label: "Wins",   value: totalWins,                      icon: "✅", color: COLORS.success },
              { label: "Games",  value: totalGames,                     icon: "🎮", color: COLORS.primary },
            ].map((s) => (
              <View key={s.label} style={styles.heroStat}>
                <Text style={styles.heroStatIcon}>{s.icon}</Text>
                <Text style={[styles.heroStatValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Win Rate */}
        <View style={styles.winRateCard}>
          <View style={styles.winRateHeader}>
            <Text style={styles.winRateTitle}>Win Rate</Text>
            <Text style={styles.winRatePercent}>{winRate}%</Text>
          </View>
          <View style={styles.winRateBar}>
            <View style={[styles.winRateFill, { width: `${winRate}%` }]} />
          </View>
          <View style={styles.winRateRow}>
            <Text style={styles.winRateWins}>✅ {totalWins} wins</Text>
            <Text style={styles.winRateLoss}>❌ {totalGames - totalWins} losses</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {PROFILE_TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === "Overview" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏅 Top Achievements</Text>
            <View style={styles.achieveRow}>
              {achievements.filter(a => a.unlocked).slice(0, 4).map((a) => (
                <View key={a.id} style={styles.achieveBadge}>
                  <Text style={styles.achieveIcon}>{a.icon}</Text>
                  <Text style={styles.achieveTitle} numberOfLines={1}>{a.title}</Text>
                </View>
              ))}
              {achievements.filter(a => a.unlocked).length === 0 && (
                <Text style={styles.emptyText}>Play games to unlock achievements! 🎮</Text>
              )}
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🎮 Recent Games</Text>
            {recentGames.slice(0, 3).length === 0
              ? <Text style={styles.emptyText}>No games played yet!</Text>
              : recentGames.slice(0, 3).map((g) => (
                  <RecentGameRow key={g.id} game={g} />
                ))
            }
          </View>
        )}

        {/* Games Tab */}
        {activeTab === "Games" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎮 All Recent Games</Text>
            {recentGames.length === 0
              ? <Text style={styles.emptyText}>No games played yet!</Text>
              : recentGames.map((g) => <RecentGameRow key={g.id} game={g} />)
            }
          </View>
        )}

        {/* Achievements Tab */}
        {activeTab === "Achievements" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🏆 Achievements ({achievements.filter(a => a.unlocked).length}/{achievements.length})
            </Text>
            {achievements.map((a) => (
              <View key={a.id} style={[styles.achieveFullRow, !a.unlocked && styles.achieveFullRowLocked]}>
                <View style={[styles.achieveFullIcon, !a.unlocked && styles.achieveFullIconLocked]}>
                  <Text style={{ fontSize: 22, opacity: a.unlocked ? 1 : 0.3 }}>{a.icon}</Text>
                </View>
                <View style={styles.achieveFullInfo}>
                  <Text style={[styles.achieveFullTitle, !a.unlocked && { color: COLORS.textMuted }]}>
                    {a.title}
                  </Text>
                  <Text style={styles.achieveFullDesc}>{a.desc}</Text>
                </View>
                <Text style={a.unlocked ? styles.unlockedTag : styles.lockedTag}>
                  {a.unlocked ? "✅" : "🔒"}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.settingsBtn}
          activeOpacity={0.8}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.settingsBtnText}>⚙️  Settings</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function RecentGameRow({ game }) {
  const category = game.games?.category ?? "Cybersecurity";
  const cat      = COLORS.category[category] || COLORS.category.Cybersecurity;
  const isWin    = game.result === "win";

  return (
    <View style={styles.gameRow}>
      <View style={[styles.gameRowIcon, { backgroundColor: cat.bg }]}>
        <Text style={{ fontSize: 20 }}>{game.games?.icon ?? "🎮"}</Text>
      </View>
      <View style={styles.gameRowInfo}>
        <Text style={styles.gameRowTitle}>{game.games?.title ?? "Unknown"}</Text>
        <Text style={styles.gameRowTime}>
          {new Date(game.played_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.gameRowRight}>
        <Text style={[styles.gameRowResult, { color: isWin ? COLORS.success : COLORS.danger }]}>
          {isWin ? "WIN" : "LOSS"}
        </Text>
        <Text style={styles.gameRowScore}>{game.score.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: COLORS.bg },
  scroll:        { flex: 1 },
  content:       { padding: 16, paddingTop: 20 },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText:     { color: COLORS.textMuted, fontSize: 13, textAlign: "center", padding: 16 },

  heroCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    alignItems: "center", marginBottom: 16, overflow: "hidden",
  },
  heroBg: {
    position: "absolute", top: -40, left: "25%",
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(59,130,246,0.08)",
  },
  avatarWrapper:  { position: "relative", marginBottom: 12 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 3, borderColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.4,
    shadowRadius: 16, elevation: 8,
  },
  profileBio: {
  color: COLORS.textSecondary,
  fontSize: 13,
  lineHeight: 19,
  textAlign: "center",
  marginBottom: 14,
  paddingHorizontal: 10,
},
  avatarEmoji:    { fontSize: 44 },
  rankBadge: {
    position: "absolute", bottom: -4, right: -4,
    backgroundColor: COLORS.rank[1],
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  rankBadgeText:  { color: "#000", fontSize: 10, fontWeight: "800" },
  heroName:       { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", marginBottom: 4 },
  heroJoined:     { color: COLORS.textSecondary, fontSize: 12, marginBottom: 16 },
  levelRow: {
    flexDirection: "row", justifyContent: "space-between",
    width: "100%", marginBottom: 8,
  },
  editOverlay: {
  flex: 1,

  backgroundColor: "rgba(0,0,0,0.82)",

  justifyContent: "center",
  alignItems: "center",

  padding: 20,
},

editCard: {
  width: "100%",
  maxWidth: 420,

  backgroundColor: COLORS.bgCard,

  borderRadius: 20,
  padding: 20,

  borderWidth: 1,
  borderColor: COLORS.borderBlue,
},

editTitle: {
  color: COLORS.textPrimary,

  fontSize: 19,
  fontWeight: "800",

  marginBottom: 18,
},

editLabel: {
  color: COLORS.textSecondary,

  fontSize: 12,
  fontWeight: "700",

  marginBottom: 6,
},

editInput: {
  backgroundColor: COLORS.bg,

  borderWidth: 1,
  borderColor: COLORS.border,

  borderRadius: 12,

  paddingHorizontal: 12,
  paddingVertical: 11,

  color: COLORS.textPrimary,

  fontSize: 14,
},

bioInput: {
  minHeight: 100,
  textAlignVertical: "top",
},

editCounter: {
  color: COLORS.textMuted,

  textAlign: "right",

  fontSize: 10,

  marginTop: 4,
  marginBottom: 12,
},

editActions: {
  flexDirection: "row",
  gap: 10,

  marginTop: 6,
},

cancelEditButton: {
  flex: 1,

  borderRadius: 12,

  paddingVertical: 12,

  alignItems: "center",

  backgroundColor:
    COLORS.bgCardLight,

  borderWidth: 1,
  borderColor: COLORS.border,
},

cancelEditText: {
  color: COLORS.textSecondary,
  fontWeight: "700",
},

saveEditButton: {
  flex: 1,

  borderRadius: 12,

  paddingVertical: 12,

  alignItems: "center",

  backgroundColor: COLORS.primary,
},

saveEditText: {
  color: "#fff",
  fontWeight: "800",
},
  levelText:      { color: COLORS.textPrimary, fontSize: 13, fontWeight: "700" },
  levelNext:      { color: COLORS.textSecondary, fontSize: 12 },
  xpBarBg: {
    width: "100%", height: 8, backgroundColor: COLORS.bgCardLight,
    borderRadius: 99, overflow: "hidden", marginBottom: 6,
  },
  xpBarFill:      { height: "100%", borderRadius: 99, backgroundColor: COLORS.primary },
  xpHint:         { color: COLORS.textMuted, fontSize: 11, marginBottom: 20 },
  heroStats:      { flexDirection: "row", gap: 8, width: "100%" },
  heroStat: {
    flex: 1, backgroundColor: COLORS.bgCardLight,
    borderRadius: 14, padding: 10, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  heroStatIcon:   { fontSize: 18, marginBottom: 4 },
  heroStatValue:  { fontSize: 14, fontWeight: "800" },
  heroStatLabel:  { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },

  winRateCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  winRateHeader:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  winRateTitle:   { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
  winRatePercent: { color: COLORS.success, fontSize: 14, fontWeight: "800" },
  winRateBar: {
    height: 8, backgroundColor: COLORS.bgCardLight,
    borderRadius: 99, overflow: "hidden", marginBottom: 8,
  },
  winRateFill:    { height: "100%", borderRadius: 99, backgroundColor: COLORS.success },
  winRateRow:     { flexDirection: "row", justifyContent: "space-between" },
  winRateWins:    { color: COLORS.success, fontSize: 12, fontWeight: "600" },
  winRateLoss:    { color: COLORS.danger,  fontSize: 12, fontWeight: "600" },

  tabRow:         { flexDirection: "row", gap: 8, marginBottom: 16 },
  tabBtn: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12,
    paddingVertical: 10, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabBtnActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabBtnText:       { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  tabBtnTextActive: { color: "#fff" },

  section:        { gap: 10 },
  sectionTitle:   { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 4 },

  achieveRow:     { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  achieveBadge: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 12,
    alignItems: "center", borderWidth: 1, borderColor: COLORS.border, minWidth: 70,
  },
  achieveIcon:    { fontSize: 24, marginBottom: 4 },
  achieveTitle:   { color: COLORS.textSecondary, fontSize: 10, fontWeight: "600", textAlign: "center" },

  gameRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bgCard,
    borderRadius: 14, padding: 12, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  gameRowIcon:    { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  gameRowInfo:    { flex: 1 },
  gameRowTitle:   { color: COLORS.textPrimary, fontSize: 14, fontWeight: "600" },
  gameRowTime:    { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  gameRowRight:   { alignItems: "flex-end" },
  gameRowResult:  { fontSize: 11, fontWeight: "800" },
  gameRowScore:   { color: COLORS.textSecondary, fontSize: 13, fontWeight: "700", marginTop: 2 },

  achieveFullRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bgCard,
    borderRadius: 14, padding: 14, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  achieveFullRowLocked:  { opacity: 0.5 },
  achieveFullIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.bgCardLight,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  achieveFullIconLocked: { backgroundColor: COLORS.bg },
  achieveFullInfo:       { flex: 1 },
  achieveFullTitle:      { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
  achieveFullDesc:       { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  unlockedTag:           { color: COLORS.success, fontSize: 18 },
  lockedTag:             { color: COLORS.textMuted, fontSize: 18 },

  settingsBtn: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  settingsBtnText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "600" },

  avatarImage: {
  width: "100%",
  height: "100%",
  borderRadius: 45,
},

avatarEditBadge: {
  position: "absolute",
  right: -3,
  bottom: 2,

  width: 28,
  height: 28,

  borderRadius: 14,

  alignItems: "center",
  justifyContent: "center",

  backgroundColor: COLORS.primary,

  borderWidth: 2,
  borderColor: COLORS.bgCard,
},

avatarEditIcon: {
  fontSize: 12,
},
});