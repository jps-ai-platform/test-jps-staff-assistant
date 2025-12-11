import {
  BrandVariants,
  createDarkTheme,
  createLightTheme,
  Theme,
} from "@fluentui/react-components";

// Jenks maroon brand ramp
const brandColors: BrandVariants = {
  10:  "#120308",
  20:  "#240712",
  30:  "#350A1B",
  40:  "#470D25",
  50:  "#59102D",
  60:  "#6A1B32", // Primary Jenks maroon
  70:  "#7A2A41",
  80:  "#8A3A50",
  90:  "#9A4A60",
  100: "#AA5A70",
  110: "#BA6B80",
  120: "#CA7C90",
  130: "#DA8DA0",
  140: "#EAAEB9",
  150: "#F2C5CD",
  160: "#FADEE2",
};

// LIGHT THEME: neutral grays with maroon accents
export const lightTheme: Theme = {
  ...createLightTheme(brandColors),

  // Neutral backgrounds
  colorNeutralBackground1: "#F5F5F5", // main app background
  colorNeutralBackground2: "#FFFFFF", // cards / surfaces
  colorNeutralBackground3: "#FFFFFF",

  // Neutral borders & text
  colorNeutralStroke1: "#E0E0E0",
  colorNeutralForeground1: "#202020", // primary text
  colorNeutralForeground2: "#444444",

  // Brand accents (buttons, highlights, etc.)
  colorBrandBackground: brandColors[60],
  colorBrandBackgroundHover: brandColors[70],
  colorBrandBackgroundPressed: brandColors[50],

  colorBrandForeground1: brandColors[80],
  colorBrandForeground2: brandColors[100],
  colorBrandForegroundLink: brandColors[100],
};

// DARK THEME: dark neutrals, same maroon brand
export const darkTheme: Theme = {
  ...createDarkTheme(brandColors),

  colorNeutralBackground1: "#121212",
  colorNeutralBackground2: "#1E1E1E",
  colorNeutralBackground3: "#232323",

  colorNeutralStroke1: "#333333",
  colorNeutralForeground1: "#F5F5F5",
  colorNeutralForeground2: "#CCCCCC",

  colorBrandBackground: brandColors[80],
  colorBrandBackgroundHover: brandColors[90],
  colorBrandBackgroundPressed: brandColors[70],

  colorBrandForeground1: brandColors[140],
  colorBrandForeground2: brandColors[130],
  colorBrandForegroundLink: brandColors[140],
};