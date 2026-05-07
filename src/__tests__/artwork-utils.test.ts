import { describe, it, expect } from "vitest";
import {
  parseFilter,
  getCollectionName,
  sameCollection,
  sortItems,
  groupItemsByCollection,
  safePrice,
  pickItemsByIds,
  getAppRoute,
  getPrimaryFilteredItems,
  getCollectionOptions,
  artworkTypeLabel,
} from "../lib/artwork-utils";
import type { Artwork } from "../types";

const baseArtwork: Artwork = {
  id: "p-001",
  type: "pintura",
  title: "Obra de prueba",
  year: 2024,
  medium: "Acrílico",
  size: "50 x 50 cm",
  price: 1000,
  available: true,
  image: "assets/img/test.jpeg",
  description: "Descripción",
};

describe("parseFilter", () => {
  it("acepta valores válidos", () => {
    expect(parseFilter("pintura")).toBe("pintura");
    expect(parseFilter("ceramica")).toBe("ceramica");
    expect(parseFilter("disponible")).toBe("disponible");
  });

  it("regresa 'all' para valores inválidos o nulos", () => {
    expect(parseFilter(null)).toBe("all");
    expect(parseFilter("")).toBe("all");
    expect(parseFilter("escultura")).toBe("all");
  });
});

describe("getCollectionName", () => {
  it("regresa la colección con espacios limpios", () => {
    expect(getCollectionName({ ...baseArtwork, collection: "  Fauna  " })).toBe("Fauna");
  });

  it("regresa string vacío si no hay colección", () => {
    expect(getCollectionName({ ...baseArtwork })).toBe("");
  });
});

describe("sameCollection", () => {
  it("compara sin importar mayúsculas o espacios", () => {
    expect(sameCollection("Fauna del corazón", "fauna del corazón")).toBe(true);
    expect(sameCollection("  Animales  ", "animales")).toBe(true);
  });

  it("distingue colecciones distintas", () => {
    expect(sameCollection("Fauna", "Animales")).toBe(false);
  });
});

describe("getPrimaryFilteredItems", () => {
  const items: Artwork[] = [
    { ...baseArtwork, id: "a", type: "pintura", available: true },
    { ...baseArtwork, id: "b", type: "ceramica", available: false },
    { ...baseArtwork, id: "c", type: "pintura", available: false },
  ];

  it("filtra por tipo pintura", () => {
    expect(getPrimaryFilteredItems(items, "pintura").map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("filtra por tipo ceramica", () => {
    expect(getPrimaryFilteredItems(items, "ceramica").map((i) => i.id)).toEqual(["b"]);
  });

  it("filtra solo disponibles", () => {
    expect(getPrimaryFilteredItems(items, "disponible").map((i) => i.id)).toEqual(["a"]);
  });

  it("regresa todos para 'all'", () => {
    expect(getPrimaryFilteredItems(items, "all")).toHaveLength(3);
  });
});

describe("sortItems", () => {
  const items: Artwork[] = [
    { ...baseArtwork, id: "a", year: 2020, price: 500 },
    { ...baseArtwork, id: "b", year: 2024, price: 2000 },
    { ...baseArtwork, id: "c", year: 2022, price: 1000 },
  ];

  it("ordena por más reciente por default", () => {
    expect(sortItems(items, "newest").map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("ordena por más antiguo", () => {
    expect(sortItems(items, "oldest").map((i) => i.id)).toEqual(["a", "c", "b"]);
  });

  it("ordena por precio ascendente", () => {
    expect(sortItems(items, "priceAsc").map((i) => i.id)).toEqual(["a", "c", "b"]);
  });

  it("ordena por precio descendente", () => {
    expect(sortItems(items, "priceDesc").map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("manda al final los que no tienen precio en orden ascendente", () => {
    const withNull: Artwork[] = [
      { ...baseArtwork, id: "x", price: null },
      { ...baseArtwork, id: "y", price: 100 },
    ];
    expect(sortItems(withNull, "priceAsc").map((i) => i.id)).toEqual(["y", "x"]);
  });
});

describe("groupItemsByCollection", () => {
  it("agrupa por colección y separa los individuales", () => {
    const items: Artwork[] = [
      { ...baseArtwork, id: "p-1", collection: "Fauna" },
      { ...baseArtwork, id: "p-2", collection: "Fauna" },
      { ...baseArtwork, id: "p-3", collection: "Otra" },
      { ...baseArtwork, id: "p-4" },
    ];

    const groups = groupItemsByCollection(items);

    expect(groups).toHaveLength(3);
    expect(groups[0].title).toBe("Fauna");
    expect(groups[0].items).toHaveLength(2);
    expect(groups[0].isUngrouped).toBe(false);
    expect(groups[1].title).toBe("Otra");
    expect(groups[2].isUngrouped).toBe(true);
    expect(groups[2].items).toHaveLength(1);
  });

  it("regresa lista vacía para arreglo vacío", () => {
    expect(groupItemsByCollection([])).toEqual([]);
  });
});

describe("getCollectionOptions", () => {
  it("cuenta obras por colección", () => {
    const items: Artwork[] = [
      { ...baseArtwork, id: "1", collection: "Fauna" },
      { ...baseArtwork, id: "2", collection: "Fauna" },
      { ...baseArtwork, id: "3", collection: "Animales" },
      { ...baseArtwork, id: "4" }, // sin colección
    ];

    const options = getCollectionOptions(items);
    expect(options).toContainEqual({ name: "Fauna", count: 2 });
    expect(options).toContainEqual({ name: "Animales", count: 1 });
    expect(options).toHaveLength(2);
  });
});

describe("safePrice", () => {
  it("formatea precios numéricos en MXN", () => {
    expect(safePrice({ ...baseArtwork, price: 1234 })).toBe("$1,234 MXN");
  });

  it("regresa 'Precio a consulta' cuando no hay precio", () => {
    expect(safePrice({ ...baseArtwork, price: null })).toBe("Precio a consulta");
  });
});

describe("pickItemsByIds", () => {
  const items: Artwork[] = [
    { ...baseArtwork, id: "a" },
    { ...baseArtwork, id: "b" },
    { ...baseArtwork, id: "c" },
  ];

  it("regresa los items en el orden pedido", () => {
    expect(pickItemsByIds(items, ["c", "a"]).map((i) => i.id)).toEqual(["c", "a"]);
  });

  it("ignora ids inexistentes", () => {
    expect(pickItemsByIds(items, ["a", "z"]).map((i) => i.id)).toEqual(["a"]);
  });

  it("regresa los primeros 6 cuando ningún id matchea", () => {
    expect(pickItemsByIds(items, ["x", "y"])).toEqual(items.slice(0, 6));
  });
});

describe("getAppRoute", () => {
  it("detecta ruta de artista", () => {
    expect(getAppRoute("/artist")).toBe("artist");
    expect(getAppRoute("/artista")).toBe("artist");
    expect(getAppRoute("/admin")).toBe("artist");
  });

  it("detecta ruta de galería", () => {
    expect(getAppRoute("/gallery")).toBe("gallery");
    expect(getAppRoute("/galeria")).toBe("gallery");
  });

  it("default a customer", () => {
    expect(getAppRoute("/")).toBe("customer");
    expect(getAppRoute("/customer")).toBe("customer");
    expect(getAppRoute("/cualquier-otra")).toBe("customer");
  });
});

describe("artworkTypeLabel", () => {
  it("regresa 'Cerámica' o 'Pintura'", () => {
    expect(artworkTypeLabel({ ...baseArtwork, type: "ceramica" })).toBe("Cerámica");
    expect(artworkTypeLabel({ ...baseArtwork, type: "pintura" })).toBe("Pintura");
  });
});