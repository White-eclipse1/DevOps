import rawArtworks from "../assets/data/artworks.json";
import type { Artwork } from "./types";

const imageModules = import.meta.glob("../assets/img/*", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const imageByFileName = new Map(
  Object.entries(imageModules).map(([path, url]) => {
    const fileName = path.split("/").pop() ?? path;
    return [fileName, url];
  }),
);

export function imageUrl(source: string): string {
  const fileName = source.split("/").pop() ?? source;
  return imageByFileName.get(fileName) ?? source;
}

export const artworks: Artwork[] = (rawArtworks as Artwork[]).map((artwork) => ({
  ...artwork,
  image: imageUrl(artwork.image),
}));

export const fallbackImage = imageUrl("assets/img/caras.jpeg");
export const faviconImage = imageUrl("assets/img/arte de lulu1.PNG");
