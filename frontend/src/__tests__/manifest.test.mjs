import { describe, it, expect } from "vitest";
import { validateManifest } from "../../scripts/validate-manifest.mjs";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function setupFixture(items, options = {}) {
  const { includeImages = true } = options;
  const root = await mkdtemp(join(tmpdir(), "manifest-"));
  await mkdir(join(root, "assets", "data"), { recursive: true });
  await mkdir(join(root, "assets", "img"), { recursive: true });
  await writeFile(
    join(root, "assets", "data", "artworks.json"),
    JSON.stringify(items, null, 2),
  );

  if (includeImages) {
    for (const item of items) {
      const fileName = item.image?.split("/").pop();
      if (fileName) {
        await writeFile(join(root, "assets", "img", fileName), "fake image");
      }
    }
  }

  return root;
}

const validItem = {
  id: "p-001",
  type: "pintura",
  title: "Test",
  year: 2024,
  medium: "Acrílico",
  size: "30x30 cm",
  price: 1000,
  available: true,
  image: "assets/img/test.jpeg",
  description: "Una pieza de prueba",
};

describe("validateManifest", () => {
  it("acepta un manifest válido", async () => {
    const root = await setupFixture([validItem]);
    try {
      const result = await validateManifest({ root });
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.total).toBe(1);
      expect(result.stats.available).toBe(1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("detecta IDs duplicados", async () => {
    const root = await setupFixture([
      { ...validItem, id: "dup-001", image: "assets/img/a.jpeg" },
      { ...validItem, id: "dup-001", image: "assets/img/b.jpeg" },
    ]);
    try {
      const result = await validateManifest({ root });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("duplicado"))).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rechaza un type inválido", async () => {
    const root = await setupFixture([{ ...validItem, type: "escultura" }]);
    try {
      const result = await validateManifest({ root });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("type"))).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("detecta imágenes faltantes en modo estricto", async () => {
    const root = await setupFixture([validItem], { includeImages: false });
    try {
      const result = await validateManifest({ root, strictImages: true });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("no existe"))).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("imágenes faltantes son warning en modo no estricto", async () => {
    const root = await setupFixture([validItem], { includeImages: false });
    try {
      const result = await validateManifest({ root, strictImages: false });
      expect(result.ok).toBe(true);
      expect(result.warnings.some((w) => w.includes("no existe"))).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("permite price y year null", async () => {
    const root = await setupFixture([{ ...validItem, year: null, price: null }]);
    try {
      const result = await validateManifest({ root });
      expect(result.ok).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rechaza price negativo", async () => {
    const root = await setupFixture([{ ...validItem, price: -100 }]);
    try {
      const result = await validateManifest({ root });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("price"))).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("cuenta colecciones correctamente", async () => {
    const root = await setupFixture([
      { ...validItem, id: "p-001", image: "assets/img/a.jpeg", collection: "Fauna" },
      { ...validItem, id: "p-002", image: "assets/img/b.jpeg", collection: "Fauna" },
      { ...validItem, id: "p-003", image: "assets/img/c.jpeg", collection: "Otra" },
      { ...validItem, id: "p-004", image: "assets/img/d.jpeg" },
    ]);
    try {
      const result = await validateManifest({ root });
      expect(result.ok).toBe(true);
      expect(result.stats.collections.Fauna).toBe(2);
      expect(result.stats.collections.Otra).toBe(1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rechaza un manifest que no es arreglo", async () => {
    const root = await mkdtemp(join(tmpdir(), "manifest-"));
    await mkdir(join(root, "assets", "data"), { recursive: true });
    await writeFile(
      join(root, "assets", "data", "artworks.json"),
      JSON.stringify({ not: "an array" }),
    );
    try {
      const result = await validateManifest({ root });
      expect(result.ok).toBe(false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});