export type ArtworkType = "pintura" | "ceramica";

export interface Artwork {
  id: string;
  type: ArtworkType;
  collection?: string;
  title: string;
  year: number | null;
  medium: string;
  size: string;
  price: number | null;
  available: boolean;
  image: string;
  description: string;
}
