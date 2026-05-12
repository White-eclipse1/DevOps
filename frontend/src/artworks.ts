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

export async function fetchArtworks(): Promise<Artwork[]> {
  const API_URL = import.meta.env.VITE_API_URL || "https://art-worker.agentemafigue.workers.dev";
  
  const response = await fetch(`${API_URL}/artworks`);
  if (!response.ok) throw new Error("Error al cargar las obras");
  
  const rawArtworks = await response.json();
  return rawArtworks.map((artwork: Artwork) => ({
    ...artwork,
    image: imageUrl(artwork.image),
  }));
}

export async function updateArtworkInDb(artwork: Artwork): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL || "https://art-worker.agentemafigue.workers.dev";

  const response = await fetch(`${API_URL}/artworks`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artwork),
  });

  if (!response.ok) throw new Error("Error al guardar la obra");
}

export async function createArtworkInDb(artwork: Artwork): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL || "https://art-worker.agentemafigue.workers.dev";

  const response = await fetch(`${API_URL}/artworks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artwork),
  });

  if (!response.ok) throw new Error("Error al crear la obra");
}

export const fallbackImage = imageUrl("assets/img/caras.jpeg");
export const faviconImage = imageUrl("assets/img/arte de lulu1.PNG");
