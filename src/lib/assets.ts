// Centraliza rutas/URLs de imágenes usadas en la app
import logoAsset from "@/assets/purollano-logo.png.asset.json";
import logoFile from "@/assets/purollano-logo.png";
import heroAsset from "@/assets/hero-portada.jpg.asset.json";

const resolveUrlFromAsset = (asset: unknown): string | undefined => {
  if (asset && typeof asset === "object" && "url" in asset) {
    return (asset as any).url as string | undefined;
  }
  return undefined;
};

export const LOGO: string = resolveUrlFromAsset(logoAsset) ?? (logoFile as unknown as string) ?? "";
export const HERO: string = resolveUrlFromAsset(heroAsset) ?? "";

export default { LOGO, HERO };
