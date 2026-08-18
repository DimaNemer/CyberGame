import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from "react-native";
import { useEffect, useRef } from "react";
import { COLORS } from "../../constants/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function TourOverlay({ steps, currentStep, onNext, onSkip }) {
  const step       = steps[currentStep];
  const isLast     = currentStep === steps.length - 1;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const bounceRef  = useRef(null);

  useEffect(() => {
    // Fade + slide in on each step
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();

    // Bounce arrow
    if (bounceRef.current) bounceRef.current.stop();
    bounceRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,   duration: 500, useNativeDriver: true }),
      ])
    );
    bounceRef.current.start();

    return () => { if (bounceRef.current) bounceRef.current.stop(); };
  }, [currentStep]);

  const isCenter = step?.position === "center";
  const isBottom = step?.position === "bottom" && !isCenter;
  const isTop    = step?.position === "top";

  // Highlight box position per target
const getHighlight = () => {
  switch (step?.highlight) {
    // Existing games
    case "timer":
      return { top: 130, height: 52 };

    case "content":
      return { top: 205, height: 210 };

    case "buttons":
      return { bottom: 85, height: 130 };

    case "topbar":
      return { top: 52, height: 80 };

    // Quantum Logic
    case "quantum-state":
      return {
        top: 150,
        height: 58,
      };

    case "quantum-grid":
      return {
        top: 220,
        height: 355,
      };

    case "quantum-tabs":
      return {
        top: 95,
        height: 55,
      };

    case "quantum-powers":
      return {
        bottom: 24,
        height: 78,
      };

    case "quantum-dpad":
      return {
        right: 10,
        bottom: 18,
        width: 138,
        height: 138,
        left: undefined,
      };

    case "quantum-guide":
      return {
        top: 45,
        right: 10,
        width: 118,
        height: 50,
        left: undefined,
      };

    default:
      return null;
  }
};

  // Bouncing arrow position per target
const getArrowPosition = () => {
  switch (step?.highlight) {
    // Existing games
    case "timer":
      return {
        top: 178,
        left: "50%",
        marginLeft: -12,
      };

    case "content":
      return {
        top: 410,
        left: "50%",
        marginLeft: -12,
      };

    case "topbar":
      return {
        top: 128,
        right: 55,
      };

    case "buttons":
      return {
        bottom: 210,
        left: "50%",
        marginLeft: -12,
      };

    // Quantum Logic
    case "quantum-state":
      return {
        top: 205,
        left: "50%",
        marginLeft: -12,
      };

    case "quantum-grid":
      return {
        top: 565,
        left: "50%",
        marginLeft: -12,
      };

    case "quantum-tabs":
      return {
        top: 145,
        left: "50%",
        marginLeft: -12,
      };

    case "quantum-powers":
      return {
        bottom: 105,
        left: 70,
      };

    case "quantum-dpad":
      return {
        right: 62,
        bottom: 150,
      };

    case "quantum-guide":
      return {
        top: 92,
        right: 48,
      };

    default:
      return null;
  }
};

  const highlight  = getHighlight();
  const arrowPos   = getArrowPosition();
 const DOWN_ARROW_TARGETS = [
  "buttons",
  "quantum-powers",
  "quantum-dpad",
];

const arrowChar =
  DOWN_ARROW_TARGETS.includes(step?.highlight)
    ? "↓"
    : "↑";

  return (
    <View style={styles.container}>

      {/* Full dim overlay */}
      <View style={styles.dimFull} />

      {/* Highlighted element border */}
   {highlight && (
  <View
    style={[
      styles.highlight,

      // Default full-width highlight
      highlight.left === undefined &&
      highlight.right === undefined &&
      highlight.width === undefined
        ? {
            left: 12,
            right: 12,
          }
        : null,

      highlight,
    ]}
  />
)}

{highlight && (
  <View
    style={[
      styles.highlight,

      !isCustomWidthTarget && {
        left: 12,
        right: 12,
      },

      highlight,
    ]}
  />
)}

      {/* Bouncing arrow pointer */}
      {arrowPos && (
        <Animated.Text style={[
          styles.arrowPointer,
          arrowPos,
          { transform: [{ translateY: bounceAnim }] },
        ]}>
          {arrowChar}
        </Animated.Text>
      )}

      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
        <Text style={styles.skipText}>Skip Tour</Text>
      </TouchableOpacity>

      {/* Progress dots */}
      <View style={[
        styles.dotsRow,
        isTop && { bottom: undefined, top: 260 },
      ]}>
        {steps.map((_, i) => (
          <View key={i} style={[
            styles.dot,
            i === currentStep && styles.dotActive,
            i < currentStep  && styles.dotDone,
          ]} />
        ))}
      </View>

      {/* Tooltip card */}
      <Animated.View style={[
        styles.tooltip,
        isBottom && styles.tooltipBottom,
        isTop    && styles.tooltipTop,
        isCenter && styles.tooltipCenter,
        {
          opacity:   fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
        {/* Arrow on tooltip card */}
        {isBottom && <View style={styles.tooltipArrowUp} />}
        {isTop    && <View style={styles.tooltipArrowDown} />}

        <Text style={styles.tooltipTitle}>{step?.title}</Text>
        <Text style={styles.tooltipDesc}>{step?.desc}</Text>

        <View style={styles.tooltipFooter}>
          <Text style={styles.stepCount}>
            {currentStep + 1} / {steps.length}
          </Text>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={onNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {isLast ? "🎮  Start Game!" : "Next →"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

    </View>
  );

  const isCustomWidthTarget =
  step?.highlight === "quantum-dpad" ||
  step?.highlight === "quantum-guide";
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },
  dimFull: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.78)",
    zIndex: 1000,
  },
highlight: {
  position: "absolute",

  backgroundColor: "rgba(255,255,255,0.05)",

  borderRadius: 16,
  borderWidth: 2,
  borderColor: "rgba(59,130,246,0.7)",

  zIndex: 1001,
},
  arrowPointer: {
    position: "absolute",
    fontSize: 26, color: "#fff",
    zIndex: 1003,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  skipBtn: {
    position: "absolute",
    top: 56, right: 16, zIndex: 1004,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  skipText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  dotsRow: {
    position: "absolute",
    bottom: 250, left: 0, right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6, zIndex: 1004,
  },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive: { backgroundColor: "#fff", width: 18 },
  dotDone:   { backgroundColor: "rgba(255,255,255,0.6)" },

  tooltip: {
    position: "absolute",
    left: 16, right: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    zIndex: 1004,
    shadowColor: "#000",
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 20,
  },
  tooltipBottom: { bottom: 50 },
  tooltipTop:    { top: 270  },
  tooltipCenter: { top: SCREEN_HEIGHT * 0.28 },

  tooltipArrowUp: {
    position: "absolute", top: -9, left: "50%", marginLeft: -9,
    width: 0, height: 0,
    borderLeftWidth: 9,   borderLeftColor:   "transparent",
    borderRightWidth: 9,  borderRightColor:  "transparent",
    borderBottomWidth: 9, borderBottomColor: COLORS.borderBlue,
  },
  tooltipArrowDown: {
    position: "absolute", bottom: -9, left: "50%", marginLeft: -9,
    width: 0, height: 0,
    borderLeftWidth: 9,  borderLeftColor:  "transparent",
    borderRightWidth: 9, borderRightColor: "transparent",
    borderTopWidth: 9,   borderTopColor:   COLORS.borderBlue,
  },

  tooltipTitle: {
    color: COLORS.textPrimary, fontSize: 17,
    fontWeight: "800", marginBottom: 8,
  },
  tooltipDesc: {
    color: COLORS.textSecondary, fontSize: 14,
    lineHeight: 21, marginBottom: 16,
  },
  tooltipFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepCount: { color: COLORS.textMuted, fontSize: 13 },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
  },
  nextBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});