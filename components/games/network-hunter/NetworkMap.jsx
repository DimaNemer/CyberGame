import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../../constants/colors";

const DEVICES = [
  {
    id: "gateway",
    label: "Gateway",
    icon: "🌐",
    position: "top",
  },
  {
    id: "server",
    label: "Server",
    icon: "🖥️",
    position: "left",
  },
  {
    id: "workstation",
    label: "Workstation",
    icon: "💻",
    position: "right",
  },
  {
    id: "database",
    label: "Database",
    icon: "🗄️",
    position: "bottom",
  },
];

export default function NetworkMap({
  investigationNumber,
  suspiciousLevel = 0,
  clueCount = 0,
  totalClues = 5,
}) {
  const dangerLevel =
    suspiciousLevel >= 4
      ? "CRITICAL"
      : suspiciousLevel >= 2
        ? "SUSPICIOUS"
        : "MONITORING";

  const dangerColor =
    suspiciousLevel >= 4
      ? COLORS.danger
      : suspiciousLevel >= 2
        ? COLORS.warning
        : COLORS.success;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>NETWORK MONITOR</Text>
          <Text style={styles.subtitle}>
            Investigation {investigationNumber}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              borderColor: dangerColor,
              backgroundColor: `${dangerColor}18`,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: dangerColor },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              { color: dangerColor },
            ]}
          >
            {dangerLevel}
          </Text>
        </View>
      </View>

      <View style={styles.mapArea}>
        <View style={styles.connectionVertical} />
        <View style={styles.connectionHorizontal} />

        <View style={styles.centerNode}>
          <Text style={styles.centerIcon}>🛡️</Text>
          <Text style={styles.centerLabel}>SOC</Text>
        </View>

        {DEVICES.map((device) => (
          <View
            key={device.id}
            style={[
              styles.device,
              styles[`device_${device.position}`],
            ]}
          >
            <View
              style={[
                styles.deviceCircle,
                clueCount > 0 && styles.deviceActive,
                suspiciousLevel >= 4 && styles.deviceDanger,
              ]}
            >
              <Text style={styles.deviceIcon}>{device.icon}</Text>
            </View>

            <Text style={styles.deviceLabel}>
              {device.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          CLUES FOUND
        </Text>

        <View style={styles.clueDots}>
          {Array.from({ length: totalClues }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.clueDot,
                index < clueCount && styles.clueDotActive,
              ]}
            />
          ))}
        </View>

        <Text style={styles.clueCount}>
          {clueCount}/{totalClues}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "rgba(34,211,238,0.07)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34,211,238,0.18)",
  },
  title: {
    color: "#22d3ee",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  mapArea: {
    height: 240,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  connectionVertical: {
    position: "absolute",
    width: 2,
    height: 150,
    backgroundColor: "rgba(34,211,238,0.18)",
  },
  connectionHorizontal: {
    position: "absolute",
    width: 190,
    height: 2,
    backgroundColor: "rgba(34,211,238,0.18)",
  },
  centerNode: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.13)",
    borderWidth: 2,
    borderColor: "rgba(34,211,238,0.45)",
    zIndex: 3,
  },
  centerIcon: {
    fontSize: 24,
  },
  centerLabel: {
    color: "#22d3ee",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: 0.8,
  },

  device: {
    position: "absolute",
    alignItems: "center",
  },
  device_top: {
    top: 16,
  },
  device_bottom: {
    bottom: 15,
  },
  device_left: {
    left: 25,
  },
  device_right: {
    right: 25,
  },
  deviceCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deviceActive: {
    borderColor: "rgba(245,158,11,0.5)",
    backgroundColor: "rgba(245,158,11,0.1)",
  },
  deviceDanger: {
    borderColor: "rgba(239,68,68,0.55)",
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  deviceIcon: {
    fontSize: 21,
  },
  deviceLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "700",
    marginTop: 4,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  clueDots: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },
  clueDot: {
    flex: 1,
    height: 4,
    borderRadius: 99,
    backgroundColor: COLORS.bgCardLight,
  },
  clueDotActive: {
    backgroundColor: "#22d3ee",
  },
  clueCount: {
    color: "#22d3ee",
    fontSize: 10,
    fontWeight: "800",
  },
});