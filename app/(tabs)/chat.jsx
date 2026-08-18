import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Dimensions,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import { COLORS } from "../../constants/colors";
import { supabase } from "../../lib/supabase";
import { getCurrentUser, sendFriendRequest, sendMessage } from "../../lib/api";
import { sanitize } from "../../lib/security";

const { width } = Dimensions.get("window");
const CHAT_TABS = ["Messages", "Friends", "Rooms"];

const MAX_MSG_LENGTH    = 500;
const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 30;
const MSG_RATE_LIMIT_MS = 1000;
const MAX_MSGS_PER_MIN  = 20;
const SEARCH_DEBOUNCE   = 400;

export default function Chat() {
  const insets = useSafeAreaInsets();

  const [user,           setUser]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setTab]            = useState("Messages");
  const [openConvo,      setOpenConvo]      = useState(null);
  const [search,         setSearch]         = useState("");
  const [searching,      setSearching]      = useState(false);
  const [searchResults,  setSearchResults]  = useState([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [friends,        setFriends]        = useState([]);
  const [pendingReceived,setPendingReceived]= useState([]);
  const [pendingSent,    setPendingSent]    = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [conversations,  setConversations]  = useState([]);
  const [convoMessages,  setConvoMessages]  = useState([]);
  const [newMsg,         setNewMsg]         = useState("");
  const [sendingMsg,     setSendingMsg]     = useState(false);
  const [msgsLoading,    setMsgsLoading]    = useState(false);
  const [msgError,       setMsgError]       = useState("");
  const [deletingMsgId,  setDeletingMsgId]  = useState(null);

  const scrollRef        = useRef(null);
  const realtimeRef      = useRef(null);
  const searchTimerRef   = useRef(null);
  const lastMsgTimeRef   = useRef(0);
  const msgCountRef      = useRef(0);
  const msgCountResetRef = useRef(null);
  const userRef          = useRef(null);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    if (now - lastMsgTimeRef.current < MSG_RATE_LIMIT_MS) {
      setMsgError("Please wait before sending another message.");
      return false;
    }
    if (msgCountRef.current >= MAX_MSGS_PER_MIN) {
      setMsgError("Too many messages. Please wait a moment.");
      return false;
    }
    return true;
  }, []);

  const recordMessage = useCallback(() => {
    lastMsgTimeRef.current = Date.now();
    msgCountRef.current += 1;
    clearTimeout(msgCountResetRef.current);
    msgCountResetRef.current = setTimeout(() => {
      msgCountRef.current = 0;
    }, 60000);
  }, []);

  useEffect(() => {
    loadUser();
    return () => {
      clearTimeout(searchTimerRef.current);
      clearTimeout(msgCountResetRef.current);
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, []);

  // ── Load user ──────────────────────────────────────────
  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;
      userRef.current = currentUser;
      setUser(currentUser);

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", currentUser.id)
        .eq("is_banned", false)
        .single();

      if (!prof) return;

      await Promise.all([
        loadFriends(currentUser.id),
        loadConversations(currentUser.id),
      ]);
    } catch (err) {
      console.error("[Chat loadUser]", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Load friends ───────────────────────────────────────
  const loadFriends = async (userId) => {
    setFriendsLoading(true);
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id, status, requester_id, receiver_id,
          requester:requester_id ( id, username, avatar_url, streak ),
          receiver:receiver_id  ( id, username, avatar_url, streak )
        `)
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .limit(100);

      if (error || !data) return;

      const accepted = [], received = [], sent = [];
      data.forEach((f) => {
        const isRequester = f.requester_id === userId;
        const other = isRequester ? f.receiver : f.requester;
        if (!other?.id || typeof other.id !== "string") return;

        const entry = {
          id: f.id, friendId: other.id, friendshipId: f.id,
          username: other.username ?? "Unknown",
          avatar:   other.avatar_url ?? "🎮",
          streak:   Math.max(0, parseInt(other.streak) || 0),
          status:   f.status,
        };

        if (f.status === "accepted") accepted.push(entry);
        else if (f.status === "pending") {
          if (isRequester) sent.push(entry);
          else received.push(entry);
        }
      });

      setFriends(accepted);
      setPendingReceived(received);
      setPendingSent(sent);
    } catch (err) {
      console.error("[loadFriends]", err.message);
    } finally {
      setFriendsLoading(false);
    }
  };

  // ── Load conversations ─────────────────────────────────
  // FIX: Fetch messages first, then fetch partner profiles separately
  // This avoids the join failing silently due to RLS on profiles
  const loadConversations = async (userId) => {
    try {
      // Step 1: Get all messages for this user
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("id, content, created_at, is_read, deleted_at, sender_id, receiver_id")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .is("room_id", null)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("[loadConversations] messages error:", error.message);
        return;
      }
      if (!msgs || msgs.length === 0) return;

      // Step 2: Collect all unique partner IDs
      const partnerIds = new Set();
      msgs.forEach((msg) => {
        if (msg.sender_id !== userId)   partnerIds.add(msg.sender_id);
        if (msg.receiver_id !== userId) partnerIds.add(msg.receiver_id);
      });

      if (partnerIds.size === 0) return;

      // Step 3: Fetch partner profiles separately
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", Array.from(partnerIds))
        .eq("is_banned", false);

      // Build a quick lookup map
      const profileMap = new Map();
      (profiles ?? []).forEach(p => profileMap.set(p.id, p));

      // Step 4: Group messages by conversation partner
      const convoMap = new Map();
      msgs.forEach((msg) => {
        if (msg.sender_id !== userId && msg.receiver_id !== userId) return;

        const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const partner   = profileMap.get(partnerId);

        // Build display content
        const displayContent = msg.deleted_at
          ? "Message deleted"
          : (msg.content ?? "");

        if (!convoMap.has(partnerId)) {
          convoMap.set(partnerId, {
            id:       partnerId,
            username: partner?.username  ?? "Unknown",
            avatar:   partner?.avatar_url ?? "🎮",
            lastMsg:  displayContent,
            time:     formatTime(msg.created_at),
            unread:   (!msg.is_read && msg.receiver_id === userId) ? 1 : 0,
          });
        } else if (!msg.is_read && msg.receiver_id === userId) {
          convoMap.get(partnerId).unread += 1;
        }
      });

      setConversations(Array.from(convoMap.values()));
    } catch (err) {
      console.error("[loadConversations]", err.message);
    }
  };

  // ── Open conversation ──────────────────────────────────
  const openConversation = async (convo) => {
    if (!convo?.id || !/^[0-9a-f-]{36}$/i.test(convo.id)) return;

    setOpenConvo(convo);
    setMsgsLoading(true);
    setConvoMessages([]);
    setMsgError("");

    try {
      // FIX: simple query without joins — avoid RLS join issues
      const { data, error } = await supabase
        .from("messages")
        .select("id, content, is_read, created_at, sender_id, receiver_id, deleted_at")
        .or(
          `and(sender_id.eq.${userRef.current.id},receiver_id.eq.${convo.id}),` +
          `and(sender_id.eq.${convo.id},receiver_id.eq.${userRef.current.id})`
        )
        .is("room_id", null)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("[openConversation] error:", error.message);
        return;
      }

      // SECURITY: client-side filter to be absolutely sure
      const filtered = (data ?? []).filter(m =>
        (m.sender_id === userRef.current.id && m.receiver_id === convo.id) ||
        (m.sender_id === convo.id && m.receiver_id === userRef.current.id)
      );

      setConvoMessages(filtered);

      // Mark as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", userRef.current.id)
        .eq("sender_id", convo.id)
        .is("room_id", null);

      setConversations(prev =>
        prev.map(c => c.id === convo.id ? { ...c, unread: 0 } : c)
      );

      subscribeToMessages(convo.id);
    } catch (err) {
      console.error("[openConversation]", err.message);
    } finally {
      setMsgsLoading(false);
    }
  };

  // ── Realtime subscription ──────────────────────────────
  const subscribeToMessages = (friendId) => {
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);

    const channel = supabase
      .channel(`dm_${userRef.current.id}_${friendId}`)
      .on("postgres_changes", {
        event:  "INSERT",
        schema: "public",
        table:  "messages",
        filter: `receiver_id=eq.${userRef.current.id}`,
      }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id !== friendId)            return;
        if (msg.receiver_id !== userRef.current.id) return;
        if (!msg.content || typeof msg.content !== "string") return;

        setConvoMessages(prev => [...prev, msg]);
        supabase.from("messages")
          .update({ is_read: true })
          .eq("id", msg.id)
          .then(() => {});

        // Update conversation list
        setConversations(prev => {
          const exists = prev.find(c => c.id === friendId);
          if (exists) {
            return [
              { ...exists, lastMsg: msg.content, time: "Just now" },
              ...prev.filter(c => c.id !== friendId),
            ];
          }
          return prev;
        });
      })
      .on("postgres_changes", {
        event:  "UPDATE",
        schema: "public",
        table:  "messages",
        filter: `receiver_id=eq.${userRef.current.id}`,
      }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id !== friendId) return;
        setConvoMessages(prev =>
          prev.map(m => m.id === msg.id ? { ...m, deleted_at: msg.deleted_at } : m)
        );
      })
      .subscribe();

    realtimeRef.current = channel;
  };

  // ── Delete message (soft delete) ──────────────────────
  const handleDeleteMessage = async (msgId) => {
    if (!msgId || msgId.startsWith("temp_")) return;
    if (!/^[0-9a-f-]{36}$/i.test(msgId)) return;

    Alert.alert(
      "Delete Message",
      "Are you sure? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            setDeletingMsgId(msgId);
            try {
              const { error } = await supabase
                .from("messages")
                .update({
                  deleted_at: new Date().toISOString(),
                  deleted_by: userRef.current.id,
                })
                .eq("id", msgId)
                .eq("sender_id", userRef.current.id);

              if (error) { console.error("[deleteMessage]", error.message); return; }

              setConvoMessages(prev =>
                prev.map(m => m.id === msgId
                  ? { ...m, deleted_at: new Date().toISOString() }
                  : m
                )
              );
            } catch (err) {
              console.error("[handleDeleteMessage]", err.message);
            } finally {
              setDeletingMsgId(null);
            }
          },
        },
      ]
    );
  };

  // ── Send message ───────────────────────────────────────
  const handleSend = async () => {
    setMsgError("");
    if (!newMsg.trim() || !openConvo || sendingMsg) return;
    if (!checkRateLimit()) return;

    const content = sanitize(newMsg.trim()).slice(0, MAX_MSG_LENGTH);
    if (!content || !content.trim()) {
      setMsgError("Message contains invalid characters.");
      return;
    }
    if (!/^[0-9a-f-]{36}$/i.test(openConvo.id)) {
      setMsgError("Invalid recipient.");
      return;
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.id !== userRef.current.id) {
      setMsgError("Session expired. Please log in again.");
      return;
    }

    setSendingMsg(true);

    const optimisticMsg = {
      id:          `temp_${Date.now()}`,
      sender_id:   userRef.current.id,
      receiver_id: openConvo.id,
      content,
      created_at:  new Date().toISOString(),
      is_read:     false,
      deleted_at:  null,
      _pending:    true,
    };

    setConvoMessages(prev => [...prev, optimisticMsg]);
    setNewMsg("");
    recordMessage();

    try {
      const saved = await sendMessage({
        senderId:   userRef.current.id,
        receiverId: openConvo.id,
        content,
      });

      if (saved) {
        setConvoMessages(prev =>
          prev.map(m => m.id === optimisticMsg.id
            ? { ...saved, sender_id: userRef.current.id, receiver_id: openConvo.id, deleted_at: null, _pending: false }
            : m
          )
        );
      }

      // Update conversation list
      setConversations(prev => {
        const exists = prev.find(c => c.id === openConvo.id);
        if (exists) {
          return [
            { ...exists, lastMsg: content, time: "Just now" },
            ...prev.filter(c => c.id !== openConvo.id),
          ];
        }
        return [{
          id: openConvo.id, username: openConvo.username,
          avatar: openConvo.avatar, lastMsg: content,
          time: "Just now", unread: 0,
        }, ...prev];
      });

    } catch (err) {
      console.error("[handleSend]", err.message);
      setConvoMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setMsgError("Failed to send message. Please try again.");
    } finally {
      setSendingMsg(false);
    }
  };

  // ── Search ─────────────────────────────────────────────
  const handleSearch = (text) => {
    const limited = text.slice(0, MAX_SEARCH_LENGTH + 10);
    setSearch(limited);
    setSearching(limited.trim().length > 0);
    clearTimeout(searchTimerRef.current);

    if (limited.trim().length < MIN_SEARCH_LENGTH) {
      setSearchResults([]); return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const clean = sanitize(limited.trim()).slice(0, MAX_SEARCH_LENGTH);
        if (clean.length < MIN_SEARCH_LENGTH) { setSearchResults([]); return; }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, streak")
          .ilike("username", `%${clean}%`)
          .neq("id", userRef.current?.id ?? "")
          .eq("is_banned", false)
          .limit(10);

        if (error || !data) { setSearchResults([]); return; }

        const friendIds  = new Set(friends.map(f => f.friendId));
        const pendingIds = new Set([
          ...pendingSent.map(f => f.friendId),
          ...pendingReceived.map(f => f.friendId),
        ]);

        setSearchResults(data.map(u => ({
          id:        u.id,
          username:  u.username ?? "Unknown",
          avatar:    u.avatar_url ?? "🎮",
          streak:    Math.max(0, parseInt(u.streak) || 0),
          isFriend:  friendIds.has(u.id),
          isPending: pendingIds.has(u.id),
        })));
      } catch (err) {
        console.error("[handleSearch]", err.message);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE);
  };

  const handleAccept = async (friendshipId, friendEntry) => {
    if (!friendshipId || !/^[0-9a-f-]{36}$/i.test(friendshipId)) return;
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId)
        .eq("receiver_id", userRef.current.id);
      if (error) return;
      setPendingReceived(prev => prev.filter(f => f.friendshipId !== friendshipId));
      setFriends(prev => [...prev, { ...friendEntry, status: "accepted" }]);
    } catch (err) {
      console.error("[handleAccept]", err.message);
    }
  };

  const handleDecline = async (friendshipId) => {
    if (!friendshipId || !/^[0-9a-f-]{36}$/i.test(friendshipId)) return;
    try {
      await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId)
        .eq("receiver_id", userRef.current.id);
      setPendingReceived(prev => prev.filter(f => f.friendshipId !== friendshipId));
    } catch (err) {
      console.error("[handleDecline]", err.message);
    }
  };

  const handleFollow = async (targetUser, idx) => {
    if (!targetUser?.id || !/^[0-9a-f-]{36}$/i.test(targetUser.id)) return;
    if (targetUser.id === userRef.current.id) return;
    try {
      await sendFriendRequest(userRef.current.id, targetUser.id);
      setSearchResults(prev =>
        prev.map((u, i) => i === idx ? { ...u, isPending: true } : u)
      );
    } catch (err) {
      console.error("[handleFollow]", err.message);
    }
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return "";
    const diff = (Date.now() - new Date(isoStr)) / 1000;
    if (diff < 60)    return "Just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(isoStr).toLocaleDateString();
  };

  const formatMsgTime = (isoStr) => {
    if (!isoStr) return "";
    return new Date(isoStr).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit",
    });
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  // ── Conversation view ──────────────────────────────────
  if (openConvo) {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.convoHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setOpenConvo(null);
              setConvoMessages([]);
              setMsgError("");
              if (realtimeRef.current) {
                supabase.removeChannel(realtimeRef.current);
                realtimeRef.current = null;
              }
              // Reload conversations when going back
              if (userRef.current) loadConversations(userRef.current.id);
            }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.convoHeaderInfo}>
            <Text style={styles.convoAvatar}>{openConvo.avatar}</Text>
            <View>
              <Text style={styles.convoName}>{openConvo.username}</Text>
              <Text style={styles.convoSub}>🔒 Hold message to delete</Text>
            </View>
          </View>
          <View style={styles.encryptBadge}>
            <Text style={styles.encryptText}>🔒 Secure</Text>
          </View>
        </View>

        {msgsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.msgScroll}
            contentContainerStyle={styles.msgContent}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
          >
            {convoMessages.length === 0 && (
              <View style={styles.emptyMsgState}>
                <Text style={styles.emptyMsgIcon}>💬</Text>
                <Text style={styles.emptyMsgText}>
                  Say hello to {openConvo.username}!
                </Text>
              </View>
            )}

            {convoMessages.map((msg) => {
              const isMe       = msg.sender_id === userRef.current?.id;
              const isDeleted  = !!msg.deleted_at;
              const isDeleting = deletingMsgId === msg.id;

              return (
                <TouchableOpacity
                  key={msg.id}
                  style={[styles.msgRow, isMe && styles.msgRowMe]}
                  onLongPress={() => {
                    if (isMe && !isDeleted && !msg._pending) {
                      handleDeleteMessage(msg.id);
                    }
                  }}
                  activeOpacity={0.9}
                  delayLongPress={500}
                >
                  {!isMe && (
                    <Text style={styles.msgAvatar}>{openConvo.avatar}</Text>
                  )}
                  <View style={[
                    styles.msgBubble,
                    isMe         && styles.msgBubbleMe,
                    isDeleted    && styles.msgBubbleDeleted,
                    msg._pending && styles.msgBubblePending,
                  ]}>
                    {isDeleting ? (
                      <ActivityIndicator color={COLORS.textMuted} size="small" />
                    ) : isDeleted ? (
                      <Text style={styles.msgDeletedText}>🗑️ Message deleted</Text>
                    ) : (
                      <Text style={[styles.msgText, isMe && styles.msgTextMe]}>
                        {msg.content}
                      </Text>
                    )}
                    {!isDeleted && (
                      <Text style={styles.msgTime}>
                        {formatMsgTime(msg.created_at)}
                        {msg._pending && " ···"}
                        {isMe && !msg._pending && " ✓"}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {msgError ? (
          <View style={styles.errorBar}>
            <Text style={styles.errorBarText}>⚠️ {msgError}</Text>
          </View>
        ) : null}

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.msgInput}
            placeholder="Type a secure message..."
            placeholderTextColor={COLORS.textMuted}
            value={newMsg}
            onChangeText={(text) => {
              if (text.length <= MAX_MSG_LENGTH) setNewMsg(text);
            }}
            multiline
            maxLength={MAX_MSG_LENGTH}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!newMsg.trim() || sendingMsg) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!newMsg.trim() || sendingMsg}
            activeOpacity={0.8}
          >
            {sendingMsg
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendBtnText}>▶</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Main list view ─────────────────────────────────────
  return (
    <View style={styles.screen}>
      <Navbar />
      <View style={styles.body}>

        <View style={styles.searchWrapper}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search players by username..."
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={MAX_SEARCH_LENGTH + 10}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearch(""); setSearching(false); setSearchResults([]);
              }}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {searching && (
          <View style={styles.searchResults}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            {searchLoading && (
              <ActivityIndicator color={COLORS.primary} style={{ padding: 12 }} />
            )}
            {!searchLoading && search.length >= MIN_SEARCH_LENGTH && searchResults.length === 0 && (
              <Text style={styles.noResults}>No players found</Text>
            )}
            {!searchLoading && searchResults.map((u, i) => (
              <SearchResultRow
                key={u.id}
                user={u}
                onFollow={() => handleFollow(u, i)}
                onMessage={() => {
                  setSearch(""); setSearching(false); setSearchResults([]);
                  openConversation(u);
                }}
              />
            ))}
          </View>
        )}

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
                  <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>
                    {t}
                    {t === "Messages" && totalUnread > 0 && (
                      <Text style={styles.unreadDot}> {totalUnread}</Text>
                    )}
                    {t === "Friends" && pendingReceived.length > 0 && (
                      <Text style={styles.unreadDot}> {pendingReceived.length}</Text>
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
              {activeTab === "Messages" && (
                <View style={styles.section}>
                  {conversations.length === 0 ? (
                    <EmptyState
                      icon="💬"
                      title="No messages yet"
                      sub="Search for a player to start chatting"
                    />
                  ) : conversations.map((convo) => (
                    <TouchableOpacity
                      key={convo.id}
                      style={styles.convoRow}
                      onPress={() => openConversation(convo)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.convoAvatarBox}>
                        <Text style={styles.convoAvatarText}>{convo.avatar}</Text>
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
                  ))}
                </View>
              )}

              {activeTab === "Friends" && (
                <View style={styles.section}>
                  {friendsLoading && (
                    <ActivityIndicator color={COLORS.primary} style={{ padding: 24 }} />
                  )}

                  {pendingReceived.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>
                        📨 Friend Requests ({pendingReceived.length})
                      </Text>
                      {pendingReceived.map((u) => (
                        <View key={u.id} style={styles.friendRow}>
                          <Text style={styles.friendAvatar}>{u.avatar}</Text>
                          <View style={styles.friendInfo}>
                            <Text style={styles.friendName}>{u.username}</Text>
                            <Text style={styles.friendSub}>🔥 {u.streak} day streak</Text>
                          </View>
                          <View style={styles.friendActions}>
                            <TouchableOpacity
                              style={styles.acceptBtn}
                              onPress={() => handleAccept(u.friendshipId, u)}
                            >
                              <Text style={styles.acceptBtnText}>✓ Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.declineBtn}
                              onPress={() => handleDecline(u.friendshipId)}
                            >
                              <Text style={styles.declineBtnText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {pendingSent.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>⏳ Sent Requests</Text>
                      {pendingSent.map((u) => (
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

                  {!friendsLoading && (
                    <>
                      <Text style={styles.sectionLabel}>
                        👥 My Friends ({friends.length})
                      </Text>
                      {friends.length === 0 ? (
                        <EmptyState
                          icon="👥"
                          title="No friends yet"
                          sub="Search for players to add them"
                        />
                      ) : friends.map((f) => (
                        <View key={f.id} style={styles.friendRow}>
                          <Text style={styles.friendAvatar}>{f.avatar}</Text>
                          <View style={styles.friendInfo}>
                            <Text style={styles.friendName}>{f.username}</Text>
                            <Text style={styles.friendSub}>🔥 {f.streak}d streak</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.msgBtn}
                            onPress={() => openConversation({
                              id: f.friendId,
                              username: f.username,
                              avatar: f.avatar,
                            })}
                          >
                            <Text style={styles.msgBtnText}>💬</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}

              {activeTab === "Rooms" && (
                <EmptyState
                  icon="🚪"
                  title="No active rooms"
                  sub="Create a room from the Games page to play with friends"
                />
              )}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

function SearchResultRow({ user, onFollow, onMessage }) {
  return (
    <View style={styles.searchResultRow}>
      <Text style={styles.friendAvatar}>{user.avatar}</Text>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{user.username}</Text>
        <Text style={styles.friendSub}>🔥 {user.streak} day streak</Text>
      </View>
      <View style={styles.friendActions}>
        {user.isFriend ? (
          <>
            <View style={styles.friendTag}>
              <Text style={styles.friendTagText}>✓ Friends</Text>
            </View>
            <TouchableOpacity style={styles.msgBtn} onPress={onMessage}>
              <Text style={styles.msgBtnText}>💬</Text>
            </TouchableOpacity>
          </>
        ) : user.isPending ? (
          <View style={styles.pendingTag}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.followBtn} onPress={onFollow} activeOpacity={0.8}>
            <Text style={styles.followBtnText}>+ Follow</Text>
          </TouchableOpacity>
        )}
      </View>
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

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.bg },
  body:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  center:  { flex: 1, justifyContent: "center", alignItems: "center" },

  searchWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, gap: 10,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  clearBtn:    { color: COLORS.textMuted, fontSize: 16, padding: 2 },

  searchResults: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchResultsTitle: {
    color: COLORS.textSecondary, fontSize: 12,
    fontWeight: "700", marginBottom: 12, letterSpacing: 0.5,
  },
  searchResultRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8,
  },
  noResults: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", padding: 12 },

  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  tabBtn: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12,
    paddingVertical: 10, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabBtnActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabBtnText:       { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  tabBtnTextActive: { color: "#fff" },
  unreadDot:        { color: COLORS.danger, fontWeight: "800" },

  section:      { gap: 10, paddingBottom: 12 },
  sectionLabel: {
    color: COLORS.textSecondary, fontSize: 12, fontWeight: "700",
    letterSpacing: 0.5, marginTop: 8, marginBottom: 4,
  },

  convoRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 14, gap: 12,
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
    backgroundColor: COLORS.primary, borderRadius: 10,
    minWidth: 20, paddingHorizontal: 6, paddingVertical: 2, alignItems: "center",
  },
  unreadCount: { color: "#fff", fontSize: 10, fontWeight: "800" },

  friendRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 12, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  friendAvatar:  { fontSize: 28 },
  friendInfo:    { flex: 1 },
  friendName:    { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
  friendSub:     { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  friendActions: { flexDirection: "row", gap: 8 },

  acceptBtn: {
    backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  acceptBtnText:  { color: COLORS.success, fontSize: 12, fontWeight: "700" },
  declineBtn: {
    backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  declineBtnText: { color: COLORS.danger, fontSize: 12, fontWeight: "700" },
  msgBtn: {
    backgroundColor: COLORS.primaryGlow, borderWidth: 1,
    borderColor: COLORS.borderBlue, borderRadius: 10, padding: 8,
  },
  msgBtnText: { fontSize: 16 },
  pendingTag: {
    backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  pendingText: { color: COLORS.warning, fontSize: 11, fontWeight: "700" },
  followBtn: {
    backgroundColor: COLORS.primaryGlow, borderWidth: 1,
    borderColor: COLORS.borderBlue, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  followBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  friendTag: {
    backgroundColor: "rgba(16,185,129,0.12)", borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  friendTagText: { color: COLORS.success, fontSize: 11, fontWeight: "700" },

  convoHeader: {
    backgroundColor: COLORS.bgCard, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12,
  },
  backBtn:         { padding: 8 },
  backText:        { color: COLORS.primary, fontSize: 22, fontWeight: "700" },
  convoHeaderInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  convoAvatar:     { fontSize: 28 },
  convoName:       { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" },
  convoSub:        { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  encryptBadge: {
    backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  encryptText: { color: COLORS.success, fontSize: 11, fontWeight: "700" },

  msgScroll:     { flex: 1, backgroundColor: COLORS.bg },
  msgContent:    { padding: 16, gap: 10 },
  emptyMsgState: { alignItems: "center", paddingVertical: 40 },
  emptyMsgIcon:  { fontSize: 48, marginBottom: 10 },
  emptyMsgText:  { color: COLORS.textSecondary, fontSize: 14 },

  msgRow:   { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowMe: { flexDirection: "row-reverse" },
  msgAvatar:{ fontSize: 22, marginBottom: 4 },
  msgBubble: {
    maxWidth: width * 0.68, backgroundColor: COLORS.bgCard,
    borderRadius: 18, borderBottomLeftRadius: 4,
    padding: 12, paddingBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  msgBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 4,
    borderColor: COLORS.primary,
  },
  msgBubblePending: { opacity: 0.65 },
  msgBubbleDeleted: {
    backgroundColor: "rgba(100,100,100,0.08)",
    borderColor: COLORS.border,
  },
  msgText:        { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  msgTextMe:      { color: "#fff" },
  msgDeletedText: { color: COLORS.textMuted, fontSize: 13, fontStyle: "italic" },
  msgTime:        { color: COLORS.textMuted, fontSize: 10, marginTop: 4, textAlign: "right" },

  errorBar: {
    backgroundColor: "rgba(239,68,68,0.1)",
    paddingHorizontal: 16, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: "rgba(239,68,68,0.2)",
  },
  errorBarText: { color: COLORS.danger, fontSize: 12, fontWeight: "600", textAlign: "center" },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingHorizontal: 16, paddingTop: 12, gap: 10,
  },
  msgInput: {
    flex: 1, backgroundColor: COLORS.bg,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: COLORS.textPrimary, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: COLORS.bgCardLight },
  sendBtnText:     { color: "#fff", fontSize: 14, fontWeight: "800" },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptyText:  { color: COLORS.textSecondary, fontSize: 13, textAlign: "center" },
});