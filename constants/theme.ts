import { THEMES } from "./ThemeColors";

const violetColors = THEMES.violet.colors;

export const COLORS = {
  primary: violetColors.primary,
  secondary: violetColors.card,
  background: violetColors.background,
  text: violetColors.text,
  subText: violetColors.subText,
  error: violetColors.error,
  success: violetColors.success,
  border: violetColors.border,
  card: violetColors.card,
};

export const FONTS = {
  title: "BodoniModa_700Bold",
  body: "Jost_400Regular",
  semibold: "Jost_600SemiBold",
  bold: "Jost_700Bold",
};

export const GRADIENTS = {
  primary: violetColors.gradient,
  success: [violetColors.success, "#166534"],
  error: [violetColors.error, "#991b1b"],
  pinkBlue: [violetColors.accentFrom, violetColors.accentTo],
} as const;
