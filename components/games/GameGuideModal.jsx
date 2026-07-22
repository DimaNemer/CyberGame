import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

import { COLORS } from "../../constants/colors";

export default function GameGuideModal({
  visible,
  title,
  glossary = [],
  tips = [],
  mode = "glossary",
  onClose,
}) {
  const showingGlossary = mode === "glossary";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtitle}>
                {showingGlossary ? "FIELD GUIDE" : "QUICK HELP"}
              </Text>

              <Text style={styles.title}>
                {showingGlossary ? "📖" : "💡"} {title}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {showingGlossary ? (
              glossary.map((item, index) => (
                <View
                  key={`${item.term}-${index}`}
                  style={styles.glossaryCard}
                >
                  <View style={styles.termRow}>
                    <Text style={styles.icon}>
                      {item.icon || "📘"}
                    </Text>

                    <Text style={styles.term}>
                      {item.term}
                    </Text>
                  </View>

                  <Text style={styles.definition}>
                    {item.simple}
                  </Text>

                  {!!item.example && (
                    <View style={styles.exampleBox}>
                      <Text style={styles.exampleTitle}>
                        Example
                      </Text>

                      <Text style={styles.example}>
                        {item.example}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              tips.map((tip, index) => (
                <View
                  key={`${index}-${tip}`}
                  style={styles.tipCard}
                >
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.tipText}>
                    {tip}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onClose}
            activeOpacity={0.9}
          >
            <Text style={styles.actionBtnText}>
              {showingGlossary
                ? "🎮 I'm Ready — Start Game!"
                : "✅ Close & Resume"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },

  card: {
    width: "100%",
    maxWidth: 430,
    maxHeight: "85%",
    backgroundColor: COLORS.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  subtitle: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    color: COLORS.textSecondary,
    fontWeight: "700",
    fontSize: 16,
  },

  content: {
    padding: 16,
    gap: 14,
  },

  glossaryCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  termRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  icon: {
    fontSize: 20,
    marginRight: 10,
  },

  term: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },

  definition: {
    color: COLORS.textSecondary,
    lineHeight: 21,
    fontSize: 13,
  },

  exampleBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.08)",
  },

  exampleTitle: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 11,
    marginBottom: 4,
  },

  example: {
    color: COLORS.textMuted,
    lineHeight: 19,
    fontSize: 12,
  },

  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  tipNumberText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 12,
  },

  tipText: {
    flex: 1,
    color: COLORS.textSecondary,
    lineHeight: 21,
    fontSize: 13,
  },

  actionBtn: {
    margin: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  actionBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});