import { Text, PixelRatio } from "react-native";
import { useSettings } from "../../context/SettingsContext";

const USER_TEXT_SCALE = {
  small: 0.9,
  medium: 1,
  large: 1.15,
};

export default function AppText({
  children,
  baseSize = 14,
  style,
  maxFontSizeMultiplier = 1.35,
  ...props
}) {
  const { settings } = useSettings();

  const userScale =
    USER_TEXT_SCALE[settings?.textSize] ?? 1;

  return (
    <Text
      {...props}
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        style,
        {
          fontSize: baseSize * userScale,
        },
      ]}
    >
      {children}
    </Text>
  );
}