// Tokens de diseño compartidos por toda la app mobile. Misma paleta y misma
// tipografía (Nunito) que el panel web — ver la guía visual aprobada y
// apps/web/src/app/globals.css, que define exactamente los mismos hex acá
// duplicados (React Native no puede importar CSS, así que se repiten a
// mano; si se retoca la paleta, actualizar los dos lugares).

export const colors = {
  brand50: "#F3F7EC",
  brand100: "#E1EBD6",
  brand200: "#C7DBA8",
  brand300: "#89B149",
  brand400: "#6B9438",
  brand500: "#4C6C24",
  brand700: "#2F5233",
  brand800: "#234A2C",
  brand900: "#1B3A22",
  brand950: "#14261A",

  tan100: "#F3E7D3",
  tan500: "#C89857",

  cream: "#FBF9F3",
  white: "#FFFFFF",
  ink: "#22301F",
  inkMuted: "#5B6B54",
  inkFaint: "#8A9A82",
  line: "#E3E1D6",
  sky: "#C7DCE8",

  danger: "#B3432F",
  dangerBg: "#F7E7E2",
  warning: "#C6862B",
  warningBg: "#F7ECD8",
  success: "#4C6C24",
  successBg: "#E8F0DC",
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

// Pesos de Nunito cargados en el _layout raíz (ver src/lib/fonts.ts). Se
// referencian por nombre de familia, no por peso numérico — RN no soporta
// variable fonts vía fontWeight con una sola familia cargada, hay que
// cargar cada corte como su propia familia.
export const fonts = {
  regular: "Nunito_400Regular",
  semiBold: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extraBold: "Nunito_800ExtraBold",
} as const;

export const shadow = {
  shadowColor: "#14261A",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
} as const;
