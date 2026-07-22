import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../../constants/colors";

const STAGES = [
  { id: 1, name: "Gateway", icon: "🔐" },
  { id: 2, name: "Encryption", icon: "🔑" },
  { id: 3, name: "Signature", icon: "✍️" },
  { id: 4, name: "Blockchain", icon: "⛓️" },
  { id: 5, name: "Final Chamber", icon: "🏆" },
];

export default function MazeMap({
  currentStage,
  completedStages,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CRYPTO MAZE</Text>
        <Text style={styles.subtitle}>
          Unlock all five chambers to escape
        </Text>
      </View>

      <View style={styles.path}>
        {STAGES.map((stage, index) => {
          const completed = completedStages.includes(stage.id);
          const active = currentStage === stage.id;
          const locked = stage.id > currentStage && !completed;

          return (
            <View key={stage.id} style={styles.stageWrapper}>
              <View
                style={[
                  styles.stage,
                  completed && styles.stageCompleted,
                  active && styles.stageActive,
                  locked && styles.stageLocked,
                ]}
              >
                <Text style={styles.stageIcon}>
                  {completed ? "✅" : locked ? "🔒" : stage.icon}
                </Text>

                <Text
                  style={[
                    styles.stageNumber,
                    active && styles.stageNumberActive,
                    completed && styles.stageNumberCompleted,
                  ]}
                >
                  STAGE {stage.id}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.stageName,
                    locked && styles.stageNameLocked,
                  ]}
                >
                  {stage.name}
                </Text>
              </View>

              {index < STAGES.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    completed && styles.connectorCompleted,
                  ]}
                >
                  <View
                    style={[
                      styles.connectorDot,
                      completed && styles.connectorDotCompleted,
                    ]}
                  />
                  <View
                    style={[
                      styles.connectorLine,
                      completed && styles.connectorLineCompleted,
                    ]}
                  />
                  <View
                    style={[
                      styles.connectorDot,
                      completed && styles.connectorDotCompleted,
                    ]}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>🟣 Current</Text>
        <Text style={styles.legendText}>✅ Completed</Text>
        <Text style={styles.legendText}>🔒 Locked</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.28)",
    padding: 14,
  },

  header: {
    marginBottom: 16,
  },
  title: {
    color: "#c084fc",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 3,
  },

  path: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stageWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  stage: {
    flex: 1,
    minWidth: 48,
    minHeight: 78,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stageActive: {
    backgroundColor: "rgba(168,85,247,0.16)",
    borderColor: "#a855f7",
    borderWidth: 2,
  },
  stageCompleted: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderColor: "rgba(16,185,129,0.45)",
  },
  stageLocked: {
    opacity: 0.45,
  },

  stageIcon: {
    fontSize: 17,
    marginBottom: 5,
  },
  stageNumber: {
    color: COLORS.textSecondary,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  stageNumberActive: {
    color: "#c084fc",
  },
  stageNumberCompleted: {
    color: COLORS.success,
  },
  stageName: {
    color: COLORS.textPrimary,
    fontSize: 7,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  stageNameLocked: {
    color: COLORS.textMuted,
  },

  connector: {
    width: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  connectorDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  connectorCompleted: {},
  connectorDotCompleted: {
    backgroundColor: COLORS.success,
  },
  connectorLineCompleted: {
    backgroundColor: COLORS.success,
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 14,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
});