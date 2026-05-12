// Utilidades puras del catálogo: filtrado, ordenamiento, agrupado por colección.
// Sin dependencias del DOM ni de window: pueden testearse directo en node/vitest.

import type { Artwork } from "../types";

export type GalleryFilter = "all" | "pintura" | "ceramica" | "disponible";
export type SortMode = "newest" | "oldest" | "priceAsc" | "priceDesc";
export type AppRoute = "customer" | "gallery" | "artist";

export interface CollectionGroup {
  key: string;
  title: string;
  eyebrow: string;
  items: Artwork[];
  isUngrouped: boolean;
}

export function getCollectionName(item: Artwork): string {
  return typeof item.collection === "string" ? item.collection.trim() : "";
}

export function normalizeCollectionValue(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function sameCollection(left: string, right: string): boolean {
  return (
    normalizeCollectionValue(left).toLowerCase() ===
    normalizeCollectionValue(right).toLowerCase()
  );
}

export function parseFilter(value: string | null): GalleryFilter {
  if (value === "pintura" || value === "ceramica" || value === "disponible") {
    return value;
  }
  return "all";
}

export function getPrimaryFilteredItems(
  source: Artwork[],
  activeFilter: GalleryFilter,
): Artwork[] {
  if (activeFilter === "pintura" || activeFilter === "ceramica") {
    return source.filter((item) => item.type === activeFilter);
  }
  if (activeFilter === "disponible") {
    return source.filter((item) => item.available);
  }
  return [...source];
}

export function getCollectionOptions(
  source: Artwork[],
): { name: string; count: number }[] {
  const collections = new Map<string, { name: string; count: number }>();
  source.forEach((item) => {
    const collection = getCollectionName(item);
    if (!collection) return;
    const option = collections.get(collection) ?? { name: collection, count: 0 };
    option.count += 1;
    collections.set(collection, option);
  });
  return Array.from(collections.values());
}

export function sortItems(items: Artwork[], mode: SortMode): Artwork[] {
  return [...items].sort((a, b) => {
    const yearA = Number(a.year || 0);
    const yearB = Number(b.year || 0);
    const priceA = typeof a.price === "number" ? a.price : Number.POSITIVE_INFINITY;
    const priceB = typeof b.price === "number" ? b.price : Number.POSITIVE_INFINITY;

    if (mode === "oldest") return yearA - yearB;
    if (mode === "priceAsc") return priceA - priceB;
    if (mode === "priceDesc") return priceB - priceA;
    return yearB - yearA;
  });
}

export function groupItemsByCollection(items: Artwork[]): CollectionGroup[] {
  const groups: CollectionGroup[] = [];
  const collections = new Map<string, CollectionGroup>();
  let ungrouped: CollectionGroup | null = null;

  items.forEach((item) => {
    const collection = getCollectionName(item);

    if (!collection) {
      ungrouped ??= {
        key: "obras-individuales",
        title: "Obras individuales",
        eyebrow: "Sin colección",
        items: [],
        isUngrouped: true,
      };
      ungrouped.items.push(item);
      return;
    }

    if (!collections.has(collection)) {
      const group: CollectionGroup = {
        key: `collection-${groups.length + 1}`,
        title: collection,
        eyebrow: "Colección",
        items: [],
        isUngrouped: false,
      };
      collections.set(collection, group);
      groups.push(group);
    }

    collections.get(collection)!.items.push(item);
  });

  if (ungrouped) groups.push(ungrouped);
  return groups;
}

export function safePrice(item: Artwork): string {
  return typeof item.price === "number"
    ? `$${item.price.toLocaleString("es-MX")} MXN`
    : "Precio a consulta";
}

export function artworkTypeLabel(item: Artwork): string {
  return item.type === "ceramica" ? "Cerámica" : "Pintura";
}

export function getAppRoute(path: string): AppRoute {
  const normalized = path.toLowerCase();
  if (
    normalized.includes("artist") ||
    normalized.includes("artista") ||
    normalized.includes("admin")
  ) {
    return "artist";
  }
  if (normalized.includes("gallery") || normalized.includes("galeria")) {
    return "gallery";
  }
  return "customer";
}

export function pickItemsByIds(data: Artwork[], ids: string[]): Artwork[] {
  const byId = new Map(data.map((item) => [item.id, item]));
  const selected = ids.map((id) => byId.get(id)).filter(Boolean) as Artwork[];
  return selected.length ? selected : data.slice(0, 6);
}