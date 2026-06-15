import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Dimensions, FlatList,
} from "react-native";
import { useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import { COLORS } from "../../constants/colors";

const { width, height } = Dimensions.get("window");

// ── Mock data — replace with Supabase later ───────────────
const MY_USERNAME = "cyber_hunter";

const FRIENDS = [
  { id: "1", username: "quantumX",    avatar: "⚛️", online: true,  streak: 18, status: "accepted" },
  { id: "2", username: "n3trunner",   avatar: "🕵️", online: true,  streak: 15, status: "accepted" },
  { id: "3", username: "shadow_hack", avatar: "👾", online: false, streak: 12, status: "accepted" },
  { id: "4", username: "z3r0day",     avatar: "💀", online: true,  streak: 10, status: "accepted" },
  { id: "5", username: "ai_guardian", avatar: "🤖", online: false, streak: 9,  status: "accepted" },
];

const PENDING_RECEIVED = [
  { id: "6", username: "cr3pto_x",  avatar: "🔐", streak: 8, status: "pending" },
];

const PENDING_SENT = [
  { id: "7", username: "net_sniper", avatar: "🎯", streak: 6, status: "pending" },
];

const CONVERSATIONS = [
  {
    id: "1", username: "quantumX", avatar: "⚛️", online: true,
    lastMsg: "Good game! Want a rematch?",
    time: "2m ago", unread: 2,
    messages: [
      { id: "1", from: "quantumX",    text: "Hey! Great game earlier 🔥",        time: "10:30" },
      { id: "2", from: MY_USERNAME,   text: "Thanks! You were tough to beat",    time: "10:31" },
      { id: "3", from: "quantumX",    text: "Want to try Quantum Cipher next?",  time: "10:32" },
      { id: "4", from: MY_USERNAME,   text: "Let's go! Creating a room now",     time: "10:33" },
      { id: "5", from: "quantumX",    text: "Good game! Want a rematch?",        time: "10:45" },
    ],
  },
  {
    id: "2", username: "n3trunner", avatar: "🕵️", online: true,
    lastMsg: "Check out this new game 👀",
    time: "1h ago", unread: 0,
    messages: [
      { id: "1", from: "n3trunner",  text: "Yo have you tried Binary Breach?",  time: "09:10" },
      { id: "2", from: MY_USERNAME,  text: "Not yet, is it hard?",              time: "09:12" },
      { id: "3", from: "n3trunner",  text: "Check out this new game 👀",        time: "09:15" },
    ],
  },
  {
    id: "3", username: "shadow_hack", avatar: "👾", online: false,
    lastMsg: "See you tomorrow!",
    time: "3h ago", unread: 0,
    messages: [
      { id: "1", from: MY_USERNAME,    text: "Good luck on the leaderboard",    time: "07:00" },
      { id: "2", from: "shadow_hack",  text: "Thanks man 💪",                   time: "07:05" },
      { id: "3", from: "shadow_hack",  text: "See you tomorrow!",               time: "07:06" },
    ],
  },
];

const SEARCH_RESULTS = [
  { id: "8",  username: "h4ck3r_pro",  avatar: "💻", streak: 5,  isFriend: false, isPending: false },
  { id: "9",  username: "q_master",    avatar: "🌀", streak: 7,  isFriend: true,  isPending: false },
  { id: "10", username: "net_sniper",  avatar: "🎯", streak: 6,  isFriend: false, isPending: true  },
];
// ─────────────────────────────────────────────────────────

const CHAT_TABS = ["Messages", "Friends", "Rooms"];

export default function Chat() {
  const insets = useSafeAreaInsets();
  const [activeTab,    setTab]       = useState("Messages");
  const [search,       setSearch]    = useState("");
  const [searching,    setSearching] = useState(false);
  const [openConvo,    setOpenConvo] = useState(null);
  const [newMsg,       setNewMsg]    = useState("");
  const [messages,     setMessages]  = useState({});
  const scrollRef = useRef(null);

  // Get messages for open conversation
  const currentMsgs = openConvo
    ? (messages[openConvo.id] || openConvo.messages)
    : [];

  const handleSend = () => {
    if (!newMsg.trim() || !openConvo) return;
    const msg = {
      id:   Date.now().toString(),
      from: MY_USERNAME,
      text: newMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => ({
      ...prev,
      [openConvo.id]: [...(prev[openConvo.id] || openConvo.messages), msg],
    }));
    setNewMsg("");
    // TODO: save to Supabase messages table
  };

  // Open conversation view
  if (openConvo) {
    return (
      <View style={styles.screen}>
        {/* Conversation header */}
        <View style={[styles.convoHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setOpenConvo(null)}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.convoHeaderInfo}>
            <Text style={styles.convoAvatar}>{openConvo.avatar}</Text>
            <View>
              <Text style={styles.convoName}>{openConvo.username}</Text>
              <Text style={[
                styles.convoOnline,
                { color: openConvo.online ? COLORS.success : COLORS.textMuted },
              ]}>
                {openConvo.online ? "🟢 Online" : "⚫ Offline"}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.inviteBtn}>
            <Text style={styles.inviteBtnText}>🎮 Invite</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.msgScroll}
          contentContainerStyle={styles.msgContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
        >
          {currentMsgs.map((msg) => {
            const isMe = msg.from === MY_USERNAME;
            return (
              <View
                key={msg.id}
                style={[styles.msgRow, isMe && styles.msgRowMe]}
              >
                {!isMe && (
                  <Text style={styles.msgAvatar}>{openConvo.avatar}</Text>
                )}
                <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
                  <Text style={[styles.msgText, isMe && styles.msgTextMe]}>
                    {msg.text}
                  </Text>
                  <Text style={styles.msgTime}>{msg.time}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            style={styles.msgInput}
            placeholder="Type a secure message..."
            placeholderTextColor={COLORS.textMuted}
            value={newMsg}
            onChangeText={setNewMsg}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !newMsg.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!newMsg.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Navbar />
      <View style={styles.body}>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search players by username..."
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={(v) => {
                setSearch(v);
                setSearching(v.trim().length > 0);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(""); setSearching(false); }}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search results overlay */}
        {searching && (
          <View style={styles.searchResults}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            {SEARCH_RESULTS.filter((u) =>
              u.username.toLowerCase().includes(search.toLowerCase())
            ).map((user) => (
              <SearchResultRow key={user.id} user={user} />
            ))}
            {SEARCH_RESULTS.filter((u) =>
              u.username.toLowerCase().includes(search.toLowerCase())
            ).length === 0 && (
              <Text style={styles.noResults}>No players found</Text>
            )}
          </View>
        )}

        {/* Tabs */}
        {!searching && (
          <>
            <View style={styles.tabRow}>
              {CHAT_TABS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
                  onPress={() => setTab(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.tabBtnText,
                    activeTab === t && styles.tabBtnTextActive,
                  ]}>
                    {t}
                    {t === "Messages" && CONVERSATIONS.some(c => c.unread > 0) && (
                      <Text style={styles.unreadDot}> •</Text>
                    )}
                    {t === "Friends" && PENDING_RECEIVED.length > 0 && (
                      <Text style={styles.unreadDot}> {PENDING_RECEIVED.length}</Text>
                    )}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.content,
                { paddingBottom: insets.bottom + 24 },
              ]}
              showsVerticalScrollIndicator={false}
            >

              {/* ── Messages Tab ── */}
              {activeTab === "Messages" && (
                <View style={styles.section}>
                  {CONVERSATIONS.length === 0 ? (
                    <EmptyState
                      icon="💬"
                      title="No messages yet"
                      sub="Search for a player to start chatting"
                    />
                  ) : (
                    CONVERSATIONS.map((convo) => (
                      <TouchableOpacity
                        key={convo.id}
                        style={styles.convoRow}
                        onPress={() => setOpenConvo(convo)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.convoAvatarBox}>
                          <Text style={styles.convoAvatarText}>{convo.avatar}</Text>
                          {convo.online && <View style={styles.onlineDot} />}
                        </View>
                        <View style={styles.convoInfo}>
                          <Text style={styles.convoUsername}>{convo.username}</Text>
                          <Text style={styles.convoLastMsg} numberOfLines={1}>
                            {convo.lastMsg}
                          </Text>
                        </View>
                        <View style={styles.convoRight}>
                          <Text style={styles.convoTime}>{convo.time}</Text>
                          {convo.unread > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadCount}>{convo.unread}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* ── Friends Tab ── */}
              {activeTab === "Friends" && (
                <View style={styles.section}>

                  {/* Pending received */}
                  {PENDING_RECEIVED.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>
                        📨 Friend Requests ({PENDING_RECEIVED.length})
                      </Text>
                      {PENDING_RECEIVED.map((u) => (
                        <View key={u.id} style={styles.friendRow}>
                          <Text style={styles.friendAvatar}>{u.avatar}</Text>
                          <View style={styles.friendInfo}>
                            <Text style={styles.friendName}>{u.username}</Text>
                            <Text style={styles.friendSub}>🔥 {u.streak} day streak</Text>
                          </View>
                          <View style={styles.friendActions}>
                            <TouchableOpacity style={styles.acceptBtn}>
                              <Text style={styles.acceptBtnText}>✓ Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.declineBtn}>
                              <Text style={styles.declineBtnText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {/* Pending sent */}
                  {PENDING_SENT.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>⏳ Sent Requests</Text>
                      {PENDING_SENT.map((u) => (
                        <View key={u.id} style={styles.friendRow}>
                          <Text style={styles.friendAvatar}>{u.avatar}</Text>
                          <View style={styles.friendInfo}>
                            <Text style={styles.friendName}>{u.username}</Text>
                            <Text style={styles.friendSub}>🔥 {u.streak} day streak</Text>
                          </View>
                          <View style={styles.pendingTag}>
                            <Text style={styles.pendingText}>Pending</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {/* Friends list */}
                  <Text style={styles.sectionLabel}>
                    👥 My Friends ({FRIENDS.length})
                  </Text>
                  {FRIENDS.length === 0 ? (
                    <EmptyState
                      icon="👥"
                      title="No friends yet"
                      sub="Search for players to add them"
                    />
                  ) : (
                    FRIENDS.map((f) => (
                      <View key={f.id} style={styles.friendRow}>
                        <View style={styles.friendAvatarBox}>
                          <Text style={styles.friendAvatar}>{f.avatar}</Text>
                          {f.online && <View style={styles.onlineDot} />}
                        </View>
                        <View style={styles.friendInfo}>
                          <Text style={styles.friendName}>{f.username}</Text>
                          <Text style={[
                            styles.friendSub,
                            { color: f.online ? COLORS.success : COLORS.textMuted },
                          ]}>
                            {f.online ? "🟢 Online" : "⚫ Offline"} · 🔥 {f.streak}d
                          </Text>
                        </View>
                        <View style={styles.friendActions}>
                          <TouchableOpacity
                            style={styles.msgBtn}
                            onPress={() => {
                              const convo = CONVERSATIONS.find(
                                c => c.username === f.username
                              );
                              if (convo) setOpenConvo(convo);
                            }}
                          >
                            <Text style={styles.msgBtnText}>💬</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.inviteSmBtn}>
                            <Text style={styles.inviteSmBtnText}>🎮</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* ── Rooms Tab ── */}
              {activeTab === "Rooms" && (
                <View style={styles.section}>
                  <EmptyState
                    icon="🚪"
                    title="No active rooms"
                    sub="Create a room from the Games page to play with friends"
                  />
                </View>
              )}

            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

// ── Sub components ────────────────────────────────────────

function SearchResultRow({ user }) {
  const [status, setStatus] = useState(
    user.isFriend ? "friend" : user.isPending ? "pending" : "none"
  );

  return (
    <View style={styles.searchResultRow}>
      <Text style={styles.friendAvatar}>{user.avatar}</Text>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{user.username}</Text>
        <Text style={styles.friendSub}>🔥 {user.streak} day streak</Text>
      </View>
      {status === "none" && (
        <TouchableOpacity
          style={styles.followBtn}
          onPress={() => setStatus("pending")}
          activeOpacity={0.8}
        >
          <Text style={styles.followBtnText}>+ Follow</Text>
        </TouchableOpacity>
      )}
      {status === "pending" && (
        <View style={styles.pendingTag}>
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      )}
      {status === "friend" && (
        <View style={styles.friendTag}>
          <Text style={styles.friendTagText}>✓ Friends</Text>
        </View>
      )}
    </View>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{sub}</Text>
    </View>
  );
}
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  body:   { flex: 1 },
  scroll: { flex: 1 },
  content:{ paddingHorizontal: 16, paddingTop: 8, },

  // Search
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 11, gap: 10,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  clearBtn:    { color: COLORS.textMuted, fontSize: 16, padding: 2 },

  // Search results
  searchResults: {
    marginHorizontal: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 8,
  },
  searchResultsTitle: {
    color: COLORS.textSecondary, fontSize: 12,
    fontWeight: "700", marginBottom: 12,
    letterSpacing: 0.5,
  },
  searchResultRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingVertical: 8,
  },
  noResults: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", padding: 12 },

  // Tabs
  tabRow: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: 16, marginBottom: 8,
  },
  tabBtn: {
    flex: 1, backgroundColor: COLORS.bgCard,
    borderRadius: 12, paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabBtnActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabBtnText:       { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  tabBtnTextActive: { color: "#fff" },
  unreadDot:        { color: COLORS.danger, fontWeight: "800" },

  section: { gap: 10, paddingBottom: 12 },
  sectionLabel: {
    color: COLORS.textSecondary, fontSize: 12,
    fontWeight: "700", letterSpacing: 0.5,
    marginTop: 8, marginBottom: 4,
  },

  // Conversations
  convoRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: 16, padding: 14, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  convoAvatarBox:  { position: "relative" },
  convoAvatarText: { fontSize: 32 },
  convoInfo:       { flex: 1 },
  convoUsername:   { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  convoLastMsg:    { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  convoRight:      { alignItems: "flex-end", gap: 4 },
  convoTime:       { color: COLORS.textMuted, fontSize: 11 },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10, minWidth: 20,
    paddingHorizontal: 6, paddingVertical: 2,
    alignItems: "center",
  },
  unreadCount: { color: "#fff", fontSize: 10, fontWeight: "800" },

  onlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.success,
    borderWidth: 2, borderColor: COLORS.bg,
  },

  // Friends
  friendRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: 14, padding: 12, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  friendAvatarBox: { position: "relative" },
  friendAvatar:    { fontSize: 28 },
  friendInfo:      { flex: 1 },
  friendName:      { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
  friendSub:       { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  friendActions:   { flexDirection: "row", gap: 8 },

  acceptBtn: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1, borderColor: "rgba(16,185,129,0.35)",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  acceptBtnText: { color: COLORS.success, fontSize: 12, fontWeight: "700" },

  declineBtn: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  declineBtnText: { color: COLORS.danger, fontSize: 12, fontWeight: "700" },

  msgBtn: {
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    borderRadius: 10, padding: 8,
  },
  msgBtnText:  { fontSize: 16 },
  inviteSmBtn: {
    backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 1, borderColor: "rgba(16,185,129,0.25)",
    borderRadius: 10, padding: 8,
  },
  inviteSmBtnText: { fontSize: 16 },

  pendingTag: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  pendingText: { color: COLORS.warning, fontSize: 11, fontWeight: "700" },

  followBtn: {
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  followBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },

  friendTag: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1, borderColor: "rgba(16,185,129,0.3)",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  friendTagText: { color: COLORS.success, fontSize: 11, fontWeight: "700" },

  // Conversation view
  convoHeader: {
    backgroundColor: COLORS.bgCard,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn:        { padding: 8 },
  backText:       { color: COLORS.primary, fontSize: 22, fontWeight: "700" },
  convoHeaderInfo:{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  convoAvatar:    { fontSize: 28 },
  convoName:      { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" },
  convoOnline:    { fontSize: 11, marginTop: 1 },
  inviteBtn: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1, borderColor: "rgba(16,185,129,0.3)",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  inviteBtnText: { color: COLORS.success, fontSize: 12, fontWeight: "700" },

  // Messages
  msgScroll:  { flex: 1, backgroundColor: COLORS.bg },
  msgContent: { padding: 16, gap: 10 },
  msgRow: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
  },
  msgRowMe:    { flexDirection: "row-reverse" },
  msgAvatar:   { fontSize: 22, marginBottom: 4 },
  msgBubble: {
    maxWidth: width * 0.68,
    backgroundColor: COLORS.bgCard,
    borderRadius: 18, borderBottomLeftRadius: 4,
    padding: 12, paddingBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  msgBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    borderColor: COLORS.primary,
  },
  msgText:   { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  msgTextMe: { color: "#fff" },
  msgTime:   { color: COLORS.textMuted, fontSize: 10, marginTop: 4, textAlign: "right" },

  // Input bar
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingHorizontal: 16, paddingTop: 12, gap: 10,
  },
  msgInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, color: COLORS.textPrimary,
    fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: COLORS.bgCardLight },
  sendBtnText:     { color: "#fff", fontSize: 14, fontWeight: "800" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptyText:  { color: COLORS.textSecondary, fontSize: 13, textAlign: "center" },
});
