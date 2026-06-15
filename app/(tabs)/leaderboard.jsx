// import {
//   View, Text, ScrollView,
//   TouchableOpacity, StyleSheet, Dimensions,
// } from "react-native";
// import { useState } from "react";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import Navbar from "../../components/Navbar";
// import { COLORS } from "../../constants/colors";

// const { width } = Dimensions.get("window");

// // ── Mock data — replace with Supabase later ───────────────
// const GLOBAL_LEADERS = [
//   { id: "1",  username: "cyber_hunter", xp: 12400, streak: 21, wins: 89, avatar: "🥷" },
//   { id: "2",  username: "quantumX",     xp: 11200, streak: 18, wins: 74, avatar: "⚛️" },
//   { id: "3",  username: "n3trunner",    xp: 9800,  streak: 15, wins: 61, avatar: "🕵️" },
//   { id: "4",  username: "shadow_hack",  xp: 8750,  streak: 12, wins: 55, avatar: "👾" },
//   { id: "5",  username: "z3r0day",      xp: 7900,  streak: 10, wins: 48, avatar: "💀" },
//   { id: "6",  username: "ai_guardian",  xp: 7200,  streak: 9,  wins: 42, avatar: "🤖" },
//   { id: "7",  username: "cr3pto_x",     xp: 6800,  streak: 8,  wins: 38, avatar: "🔐" },
//   { id: "8",  username: "q_master",     xp: 6100,  streak: 7,  wins: 34, avatar: "🌀" },
//   { id: "9",  username: "net_sniper",   xp: 5500,  streak: 6,  wins: 29, avatar: "🎯" },
//   { id: "10", username: "h4ck3r_pro",   xp: 4900,  streak: 5,  wins: 24, avatar: "💻" },
// ];

// const GAME_LEADERS = {
//   "Phishing Trap": [
//     { id: "1", username: "cyber_hunter", score: 9850, plays: 34, avatar: "🥷" },
//     { id: "2", username: "shadow_hack",  score: 8920, plays: 28, avatar: "👾" },
//     { id: "3", username: "z3r0day",      score: 7760, plays: 19, avatar: "💀" },
//     { id: "4", username: "n3trunner",    score: 6540, plays: 15, avatar: "🕵️" },
//     { id: "5", username: "ai_guardian",  score: 5900, plays: 12, avatar: "🤖" },
//   ],
//   "Quantum Cipher": [
//     { id: "1", username: "quantumX",    score: 9200, plays: 41, avatar: "⚛️" },
//     { id: "2", username: "q_master",    score: 8100, plays: 33, avatar: "🌀" },
//     { id: "3", username: "cyber_hunter",score: 7400, plays: 22, avatar: "🥷" },
//     { id: "4", username: "cr3pto_x",    score: 6300, plays: 17, avatar: "🔐" },
//     { id: "5", username: "h4ck3r_pro",  score: 5100, plays: 11, avatar: "💻" },
//   ],
//   "Binary Breach": [
//     { id: "1", username: "h4ck3r_pro",  score: 9600, plays: 38, avatar: "💻" },
//     { id: "2", username: "net_sniper",  score: 8800, plays: 30, avatar: "🎯" },
//     { id: "3", username: "n3trunner",   score: 7200, plays: 24, avatar: "🕵️" },
//     { id: "4", username: "quantumX",    score: 6100, plays: 16, avatar: "⚛️" },
//     { id: "5", username: "z3r0day",     score: 5400, plays: 10, avatar: "💀" },
//   ],
// };

// const TABS     = ["Global", "Phishing Trap", "Quantum Cipher", "Binary Breach"];
// const SORT_BY  = ["Streak", "XP", "Wins"];
// // ─────────────────────────────────────────────────────────

// function TopThreeCard({ player, rank }) {
//   const rankColor = COLORS.rank[rank] || COLORS.textMuted;
//   const size      = rank === 1 ? 72 : 56;
//   const medals    = { 1: "🥇", 2: "🥈", 3: "🥉" };

//   return (
//     <View style={[
//       styles.topCard,
//       rank === 1 && styles.topCardFirst,
//       { borderColor: rankColor + "40" },
//     ]}>
//       <Text style={styles.medal}>{medals[rank]}</Text>
//       <View style={[styles.avatarCircle, {
//         width: size, height: size, borderRadius: size / 2,
//         borderColor: rankColor,
//       }]}>
//         <Text style={{ fontSize: rank === 1 ? 30 : 22 }}>{player.avatar}</Text>
//       </View>
//       <Text style={[styles.topRank, { color: rankColor }]}>#{rank}</Text>
//       <Text style={styles.topUsername} numberOfLines={1}>
//         {player.username}
//       </Text>
//       <View style={styles.topStats}>
//         <Text style={[styles.topXP, { color: rankColor }]}>
//           ⚡ {player.xp?.toLocaleString() ?? player.score?.toLocaleString()}
//         </Text>
//         <Text style={styles.topStreak}>
//           🔥 {player.streak ?? player.plays}
//         </Text>
//       </View>
//     </View>
//   );
// }

// function LeaderRow({ player, rank, isGlobal, isMe = false }) {
//   const rankColor = COLORS.rank[rank] || COLORS.textMuted;

//   return (
//     <View style={[styles.leaderRow, isMe && styles.leaderRowMe]}>
//       {/* Rank */}
//       <Text style={[
//         styles.rowRank,
//         { color: rank <= 3 ? rankColor : COLORS.textMuted },
//       ]}>
//         {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : `#${rank}`}
//       </Text>

//       {/* Avatar */}
//       <View style={[styles.rowAvatar, isMe && { borderColor: COLORS.primary }]}>
//         <Text style={styles.rowAvatarText}>{player.avatar}</Text>
//       </View>

//       {/* Name + subtitle */}
//       <View style={styles.rowInfo}>
//         <Text style={styles.rowUsername}>
//           {player.username}
//           {isMe && <Text style={styles.youTag}> (You)</Text>}
//         </Text>
//         <Text style={styles.rowSub}>
//           {isGlobal
//             ? `${player.wins} wins`
//             : `${player.plays} plays`}
//         </Text>
//       </View>

//       {/* Score */}
//       <View style={styles.rowRight}>
//         <Text style={[styles.rowScore, { color: rank <= 3 ? rankColor : COLORS.primary }]}>
//           {isGlobal
//             ? `⚡ ${player.xp.toLocaleString()}`
//             : player.score.toLocaleString()}
//         </Text>
//         {isGlobal && (
//           <Text style={styles.rowStreak}>🔥 {player.streak} day streak</Text>
//         )}
//       </View>
//     </View>
//   );
// }

// export default function Leaderboard() {
//   const insets      = useSafeAreaInsets();
//   const [activeTab,  setTab]    = useState("Global");
//   const [sortBy,     setSortBy] = useState("Streak");

//   const isGlobal = activeTab === "Global";

//   const rawData = isGlobal
//     ? [...GLOBAL_LEADERS].sort((a, b) => {
//         if (sortBy === "Streak") return b.streak - a.streak;
//         if (sortBy === "XP")     return b.xp - a.xp;
//         return b.wins - a.wins;
//       })
//     : GAME_LEADERS[activeTab] || [];

//   const top3 = rawData.slice(0, 3);
//   const rest = rawData.slice(3);

//   return (
//     <View style={styles.screen}>
//       <Navbar />
//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={[
//           styles.content,
//           { paddingBottom: insets.bottom + 24 },
//         ]}
//         showsVerticalScrollIndicator={false}
//       >

//         {/* Header */}
//         <View style={styles.header}>
//           <View>
//             <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
//             <Text style={styles.headerSub}>
//               {isGlobal ? "Global rankings by streak" : `Top players — ${activeTab}`}
//             </Text>
//           </View>
//           <View style={styles.liveBadge}>
//             <View style={styles.liveDot} />
//             <Text style={styles.liveText}>LIVE</Text>
//           </View>
//         </View>

//         {/* Tab selector */}
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.tabsRow}
//         >
//           {TABS.map((t) => (
//             <TouchableOpacity
//               key={t}
//               style={[styles.tabChip, activeTab === t && styles.tabChipActive]}
//               onPress={() => setTab(t)}
//               activeOpacity={0.8}
//             >
//               <Text style={[
//                 styles.tabText,
//                 activeTab === t && styles.tabTextActive,
//               ]}>
//                 {t}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* Sort (global only) */}
//         {isGlobal && (
//           <View style={styles.sortRow}>
//             <Text style={styles.sortLabel}>Sort by:</Text>
//             {SORT_BY.map((s) => (
//               <TouchableOpacity
//                 key={s}
//                 style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
//                 onPress={() => setSortBy(s)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={[
//                   styles.sortText,
//                   sortBy === s && styles.sortTextActive,
//                 ]}>
//                   {s}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}

//         {/* Top 3 podium */}
//         {top3.length === 3 && (
//           <View style={styles.podium}>
//             <TopThreeCard player={top3[1]} rank={2} />
//             <TopThreeCard player={top3[0]} rank={1} />
//             <TopThreeCard player={top3[2]} rank={3} />
//           </View>
//         )}

//         {/* Rest of list */}
//         {rest.length > 0 && (
//           <View style={styles.listCard}>
//             {rest.map((player, index) => (
//               <View key={player.id}>
//                 <LeaderRow
//                   player={player}
//                   rank={index + 4}
//                   isGlobal={isGlobal}
//                   isMe={player.username === "cyber_hunter"}
//                 />
//                 {index < rest.length - 1 && (
//                   <View style={styles.divider} />
//                 )}
//               </View>
//             ))}
//           </View>
//         )}

//         {/* My rank card */}
//         {isGlobal && (
//           <View style={styles.myRankCard}>
//             <Text style={styles.myRankTitle}>📍 Your Rank</Text>
//             <View style={styles.myRankRow}>
//               <Text style={styles.myRankNum}>#1</Text>
//               <View style={styles.myRankInfo}>
//                 <Text style={styles.myRankName}>cyber_hunter</Text>
//                 <Text style={styles.myRankSub}>Top 1% of all players</Text>
//               </View>
//               <View style={styles.myRankStats}>
//                 <Text style={styles.myRankXP}>⚡ 12,400</Text>
//                 <Text style={styles.myRankStreak}>🔥 21 days</Text>
//               </View>
//             </View>
//           </View>
//         )}

//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   screen:  { flex: 1, backgroundColor: COLORS.bg },
//   scroll:  { flex: 1 },
//   content: { padding: 16, paddingTop: 20 },

//   // Header
//   header: {
//     flexDirection: "row", justifyContent: "space-between",
//     alignItems: "flex-start", marginBottom: 20,
//   },
//   headerTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: "800" },
//   headerSub:   { color: COLORS.textSecondary, fontSize: 13, marginTop: 3 },
//   liveBadge: {
//     flexDirection: "row", alignItems: "center", gap: 5,
//     backgroundColor: "rgba(239,68,68,0.15)",
//     borderWidth: 1, borderColor: "rgba(239,68,68,0.35)",
//     borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
//   },
//   liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.live },
//   liveText: { color: "#fca5a5", fontSize: 11, fontWeight: "800" },

//   // Tabs
//   tabsRow: { gap: 8, paddingRight: 16, marginBottom: 16 },
//   tabChip: {
//     backgroundColor: COLORS.bgCard,
//     borderWidth: 1, borderColor: COLORS.border,
//     borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
//   },
//   tabChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
//   tabText:       { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
//   tabTextActive: { color: "#fff" },

//   // Sort
//   sortRow: {
//     flexDirection: "row", alignItems: "center",
//     gap: 8, marginBottom: 20,
//   },
//   sortLabel: { color: COLORS.textSecondary, fontSize: 13 },
//   sortChip: {
//     backgroundColor: COLORS.bgCard,
//     borderWidth: 1, borderColor: COLORS.border,
//     borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
//   },
//   sortChipActive: {
//     backgroundColor: COLORS.primaryGlow,
//     borderColor: COLORS.borderBlue,
//   },
//   sortText:       { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
//   sortTextActive: { color: COLORS.primary },

//   // Podium
//   podium: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "flex-end",
//     gap: 10,
//     marginBottom: 24,
//     paddingHorizontal: 8,
//   },
//   topCard: {
//     flex: 1, alignItems: "center",
//     backgroundColor: COLORS.bgCard,
//     borderRadius: 18, padding: 12,
//     borderWidth: 1,
//   },
//   topCardFirst: {
//     backgroundColor: COLORS.bgCardLight,
//     paddingVertical: 18,
//     shadowColor: COLORS.rank[1],
//     shadowOpacity: 0.3,
//     shadowRadius: 16,
//     elevation: 8,
//   },
//   medal:       { fontSize: 20, marginBottom: 6 },
//   avatarCircle:{
//     backgroundColor: COLORS.bg,
//     borderWidth: 2, alignItems: "center",
//     justifyContent: "center", marginBottom: 8,
//   },
//   topRank:     { fontSize: 13, fontWeight: "800", marginBottom: 2 },
//   topUsername: {
//     color: COLORS.textPrimary, fontSize: 11,
//     fontWeight: "700", marginBottom: 6,
//     textAlign: "center",
//   },
//   topStats:    { alignItems: "center", gap: 2 },
//   topXP:       { fontSize: 12, fontWeight: "800" },
//   topStreak:   { color: COLORS.textSecondary, fontSize: 11 },

//   // List
//   listCard: {
//     backgroundColor: COLORS.bgCard,
//     borderRadius: 16, borderWidth: 1,
//     borderColor: COLORS.border,
//     overflow: "hidden", marginBottom: 20,
//   },
//   leaderRow: {
//     flexDirection: "row", alignItems: "center",
//     padding: 14, gap: 12,
//   },
//   leaderRowMe: {
//     backgroundColor: COLORS.primaryGlow,
//   },
//   rowRank:      { width: 30, fontSize: 13, fontWeight: "800", textAlign: "center" },
//   rowAvatar: {
//     width: 38, height: 38, borderRadius: 19,
//     backgroundColor: COLORS.bg,
//     borderWidth: 1, borderColor: COLORS.border,
//     alignItems: "center", justifyContent: "center",
//   },
//   rowAvatarText: { fontSize: 18 },
//   rowInfo:       { flex: 1 },
//   rowUsername:   { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
//   youTag:        { color: COLORS.primary, fontSize: 12 },
//   rowSub:        { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
//   rowRight:      { alignItems: "flex-end" },
//   rowScore:      { fontSize: 14, fontWeight: "800" },
//   rowStreak:     { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
//   divider: {
//     height: 1, backgroundColor: COLORS.border,
//     marginHorizontal: 14,
//   },

//   // My rank card
//   myRankCard: {
//     backgroundColor: COLORS.bgCard,
//     borderRadius: 16, padding: 16,
//     borderWidth: 1, borderColor: COLORS.borderBlue,
//     marginBottom: 8,
//   },
//   myRankTitle: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 12 },
//   myRankRow:   { flexDirection: "row", alignItems: "center", gap: 12 },
//   myRankNum:   { color: COLORS.rank[1], fontSize: 22, fontWeight: "800", width: 36 },
//   myRankInfo:  { flex: 1 },
//   myRankName:  { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
//   myRankSub:   { color: COLORS.success, fontSize: 11, marginTop: 2 },
//   myRankStats: { alignItems: "flex-end" },
//   myRankXP:    { color: COLORS.rank[1], fontSize: 14, fontWeight: "800" },
//   myRankStreak:{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
// });

import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import { COLORS } from "../../constants/colors";
import { getCurrentUser, getGlobalLeaderboard } from "../../lib/api";
import { supabase } from "../../lib/supabase";

const SORT_BY = ["Streak", "XP", "Wins"];

function TopThreeCard({ player, rank }) {
  const rankColor = COLORS.rank[rank] || COLORS.textMuted;
  const size      = rank === 1 ? 72 : 56;
  const medals    = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <View style={[styles.topCard, rank === 1 && styles.topCardFirst, { borderColor: rankColor + "40" }]}>
      <Text style={styles.medal}>{medals[rank]}</Text>
      <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2, borderColor: rankColor }]}>
        <Text style={{ fontSize: rank === 1 ? 30 : 22 }}>{player.avatar_url ?? "🥷"}</Text>
      </View>
      <Text style={[styles.topRank, { color: rankColor }]}>#{rank}</Text>
      <Text style={styles.topUsername} numberOfLines={1}>{player.username}</Text>
      <View style={styles.topStats}>
        <Text style={[styles.topXP, { color: rankColor }]}>⚡ {(player.xp ?? 0).toLocaleString()}</Text>
        <Text style={styles.topStreak}>🔥 {player.streak ?? 0}</Text>
      </View>
    </View>
  );
}

function LeaderRow({ player, rank, isMe }) {
  const rankColor = COLORS.rank[rank] || COLORS.textMuted;
  return (
    <View style={[styles.leaderRow, isMe && styles.leaderRowMe]}>
      <Text style={[styles.rowRank, { color: rank <= 3 ? rankColor : COLORS.textMuted }]}>
        {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : `#${rank}`}
      </Text>
      <View style={[styles.rowAvatar, isMe && { borderColor: COLORS.primary }]}>
        <Text style={styles.rowAvatarText}>{player.avatar_url ?? "🥷"}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowUsername}>
          {player.username}
          {isMe && <Text style={styles.youTag}> (You)</Text>}
        </Text>
        <Text style={styles.rowSub}>{player.total_wins ?? 0} wins</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowScore, { color: rank <= 3 ? rankColor : COLORS.primary }]}>
          ⚡ {(player.xp ?? 0).toLocaleString()}
        </Text>
        <Text style={styles.rowStreak}>🔥 {player.streak ?? 0} day streak</Text>
      </View>
    </View>
  );
}

export default function Leaderboard() {
  const insets = useSafeAreaInsets();

  const [leaders,   setLeaders]  = useState([]);
  const [myUser,    setMyUser]   = useState(null);
  const [sortBy,    setSortBy]   = useState("Streak");
  const [loading,   setLoading]  = useState(true);
  const [games,     setGames]    = useState([]);
  const [activeTab, setTab]      = useState("Global");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const [user, board, gamesList] = await Promise.all([
        getCurrentUser(),
        getGlobalLeaderboard(100),
        supabase
          .from("games")
          .select("id, title")
          .eq("is_published", true)
          .eq("status", "approved")
          .limit(5),
      ]);

      setMyUser(user);
      setLeaders(board ?? []);
      if (gamesList?.data) setGames(gamesList.data);

    } catch (err) {
      console.error("[Leaderboard]", err.message);
    } finally {
      setLoading(false);
    }
  };

  const TABS = ["Global", ...games.map(g => g.title)];

  const sorted = [...leaders].sort((a, b) => {
    if (sortBy === "Streak") return (b.streak ?? 0) - (a.streak ?? 0);
    if (sortBy === "XP")     return (b.xp ?? 0)     - (a.xp ?? 0);
    return (b.total_wins ?? 0) - (a.total_wins ?? 0);
  });

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const myRank = sorted.findIndex(p => p.id === myUser?.id);
  const myProfile = myRank >= 0 ? sorted[myRank] : null;

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

  return (
    <View style={styles.screen}>
      <Navbar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
            <Text style={styles.headerSub}>Global rankings by streak</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabChip, activeTab === t && styles.tabChipActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          {SORT_BY.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
              onPress={() => setSortBy(s)}
            >
              <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty state */}
        {sorted.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptyText}>Be the first to play and claim #1!</Text>
          </View>
        )}

        {/* Top 3 Podium */}
        {top3.length === 3 && (
          <View style={styles.podium}>
            <TopThreeCard player={top3[1]} rank={2} />
            <TopThreeCard player={top3[0]} rank={1} />
            <TopThreeCard player={top3[2]} rank={3} />
          </View>
        )}

        {/* Rest of list */}
        {rest.length > 0 && (
          <View style={styles.listCard}>
            {rest.map((player, index) => (
              <View key={player.id}>
                <LeaderRow
                  player={player}
                  rank={index + 4}
                  isMe={player.id === myUser?.id}
                />
                {index < rest.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        {/* My rank card */}
        {myProfile && (
          <View style={styles.myRankCard}>
            <Text style={styles.myRankTitle}>📍 Your Rank</Text>
            <View style={styles.myRankRow}>
              <Text style={styles.myRankNum}>#{myRank + 1}</Text>
              <View style={styles.myRankInfo}>
                <Text style={styles.myRankName}>{myProfile.username}</Text>
                <Text style={styles.myRankSub}>
                  Top {Math.round(((myRank + 1) / sorted.length) * 100)}% of all players
                </Text>
              </View>
              <View style={styles.myRankStats}>
                <Text style={styles.myRankXP}>⚡ {(myProfile.xp ?? 0).toLocaleString()}</Text>
                <Text style={styles.myRankStreak}>🔥 {myProfile.streak ?? 0} days</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: COLORS.bg },
  scroll:        { flex: 1 },
  content:       { padding: 16, paddingTop: 20 },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  headerTitle:   { color: COLORS.textPrimary, fontSize: 24, fontWeight: "800" },
  headerSub:     { color: COLORS.textSecondary, fontSize: 13, marginTop: 3 },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.35)",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.live },
  liveText: { color: "#fca5a5", fontSize: 11, fontWeight: "800" },

  tabsRow:       { gap: 8, paddingRight: 16, marginBottom: 16 },
  tabChip: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  tabChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText:       { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  sortRow:       { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  sortLabel:     { color: COLORS.textSecondary, fontSize: 13 },
  sortChip: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  sortChipActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.borderBlue },
  sortText:       { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
  sortTextActive: { color: COLORS.primary },

  emptyState:    { alignItems: "center", paddingVertical: 60 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { color: COLORS.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyText:     { color: COLORS.textSecondary, fontSize: 14 },

  podium: {
    flexDirection: "row", justifyContent: "center",
    alignItems: "flex-end", gap: 10,
    marginBottom: 24, paddingHorizontal: 8,
  },
  topCard: {
    flex: 1, alignItems: "center", backgroundColor: COLORS.bgCard,
    borderRadius: 18, padding: 12, borderWidth: 1,
  },
  topCardFirst: {
    backgroundColor: COLORS.bgCardLight, paddingVertical: 18,
    shadowColor: COLORS.rank[1], shadowOpacity: 0.3,
    shadowRadius: 16, elevation: 8,
  },
  medal:         { fontSize: 20, marginBottom: 6 },
  avatarCircle: {
    backgroundColor: COLORS.bg, borderWidth: 2,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  topRank:       { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  topUsername:   { color: COLORS.textPrimary, fontSize: 11, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  topStats:      { alignItems: "center", gap: 2 },
  topXP:         { fontSize: 12, fontWeight: "800" },
  topStreak:     { color: COLORS.textSecondary, fontSize: 11 },

  listCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: "hidden", marginBottom: 20,
  },
  leaderRow:     { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  leaderRowMe:   { backgroundColor: COLORS.primaryGlow },
  rowRank:       { width: 30, fontSize: 13, fontWeight: "800", textAlign: "center" },
  rowAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  rowAvatarText: { fontSize: 18 },
  rowInfo:       { flex: 1 },
  rowUsername:   { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
  youTag:        { color: COLORS.primary, fontSize: 12 },
  rowSub:        { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  rowRight:      { alignItems: "flex-end" },
  rowScore:      { fontSize: 14, fontWeight: "800" },
  rowStreak:     { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  divider:       { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },

  myRankCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.borderBlue, marginBottom: 8,
  },
  myRankTitle:   { color: COLORS.textSecondary, fontSize: 13, marginBottom: 12 },
  myRankRow:     { flexDirection: "row", alignItems: "center", gap: 12 },
  myRankNum:     { color: COLORS.rank[1], fontSize: 22, fontWeight: "800", width: 36 },
  myRankInfo:    { flex: 1 },
  myRankName:    { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  myRankSub:     { color: COLORS.success, fontSize: 11, marginTop: 2 },
  myRankStats:   { alignItems: "flex-end" },
  myRankXP:      { color: COLORS.rank[1], fontSize: 14, fontWeight: "800" },
  myRankStreak:  { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});