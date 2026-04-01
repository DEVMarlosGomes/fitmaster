export const BRAND = {
  name: "Rogerio Costa",
  shortName: "Rogerio",
  role: "Treinador e Nutricionista",
  platformName: "Plataforma Rogerio Costa",
  assistantName: "Assistente Rogerio Costa",
  performanceLabel: "RC Performance",
  studentLabel: "Acompanhamento RC",
  assets: {
    logoLight: "/brand/rogerio-costa-logo-light.png",
    logoDark: "/brand/rogerio-costa-logo-dark.png",
    mark: "/brand/rogerio-costa-mark.png",
  },
};

export const getBrandLogoByTheme = (theme = "dark") =>
  theme === "light" ? BRAND.assets.logoLight : BRAND.assets.logoDark;
