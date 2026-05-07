import { readFile, access } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(__dirname, "..");

const VALID_TYPES = new Set(["pintura", "ceramica"]);
const REQUIRED_FIELDS = [
  "id",
  "type",
  "title",
  "year",
  "medium",
  "size",
  "price",
  "available",
  "image",
  "description",
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;
const MAX_YEAR = CURRENT_YEAR + 5;

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida el manifest de obras.
 * @param {object} options
 * @param {string} [options.root] - Raíz del repo (default: ../ del script).
 * @param {boolean} [options.strictImages=true] - Si true, imagen faltante es error.
 * @returns {Promise<{ok: boolean, errors: string[], warnings: string[], stats: object}>}
 */
export async function validateManifest({ root = DEFAULT_ROOT, strictImages = true } = {}) {
  const manifestPath = join(root, "assets", "data", "artworks.json");
  const imagesDir = join(root, "assets", "img");

  const raw = await readFile(manifestPath, "utf-8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      errors: [`No se pudo parsear el JSON: ${err.message}`],
      warnings: [],
      stats: { total: 0, available: 0, withPrice: 0, collections: {} },
    };
  }

  if (!Array.isArray(data)) {
    return {
      ok: false,
      errors: ["El manifest debe ser un arreglo de obras."],
      warnings: [],
      stats: { total: 0, available: 0, withPrice: 0, collections: {} },
    };
  }

  const errors = [];
  const warnings = [];
  const seenIds = new Set();
  const collections = new Map();
  let availableCount = 0;
  let withPriceCount = 0;

  for (const [index, item] of data.entries()) {
    const where = `obra ${index} (id="${item?.id ?? "?"}")`;

    if (!item || typeof item !== "object") {
      errors.push(`${where}: no es un objeto válido.`);
      continue;
    }

    for (const field of REQUIRED_FIELDS) {
      if (!(field in item)) {
        errors.push(`${where}: falta el campo "${field}".`);
      }
    }

    if (typeof item.id !== "string" || !item.id.trim()) {
      errors.push(`${where}: "id" debe ser un string no vacío.`);
    } else if (seenIds.has(item.id)) {
      errors.push(`${where}: id "${item.id}" duplicado.`);
    } else {
      seenIds.add(item.id);
    }

    if (!VALID_TYPES.has(item.type)) {
      errors.push(
        `${where}: "type" debe ser uno de [${[...VALID_TYPES].join(", ")}] (recibido "${item.type}").`,
      );
    }

    if (typeof item.title !== "string" || !item.title.trim()) {
      errors.push(`${where}: "title" debe ser un string no vacío.`);
    }

    if (item.year !== null) {
      if (typeof item.year !== "number" || !Number.isInteger(item.year)) {
        errors.push(`${where}: "year" debe ser un entero o null.`);
      } else if (item.year < MIN_YEAR || item.year > MAX_YEAR) {
        warnings.push(`${where}: "year" ${item.year} fuera del rango [${MIN_YEAR}, ${MAX_YEAR}].`);
      }
    }

    if (item.price !== null && (typeof item.price !== "number" || item.price < 0)) {
      errors.push(`${where}: "price" debe ser número no negativo o null.`);
    }
    if (typeof item.price === "number") withPriceCount++;

    if (typeof item.available !== "boolean") {
      errors.push(`${where}: "available" debe ser boolean.`);
    } else if (item.available) {
      availableCount++;
    }

    if (typeof item.image !== "string" || !item.image.trim()) {
      errors.push(`${where}: "image" debe ser un string no vacío.`);
    } else {
      const fileName = item.image.split("/").pop();
      const imagePath = join(imagesDir, fileName);
      const exists = await fileExists(imagePath);
      if (!exists) {
        const message = `${where}: imagen "${fileName}" no existe en assets/img/.`;
        if (strictImages) errors.push(message);
        else warnings.push(message);
      }
    }

    if (item.collection !== undefined) {
      if (typeof item.collection !== "string") {
        errors.push(`${where}: "collection" debe ser string si está presente.`);
      } else {
        const name = item.collection.trim();
        if (name) {
          collections.set(name, (collections.get(name) ?? 0) + 1);
        }
      }
    }

    if ("description" in item && typeof item.description !== "string") {
      errors.push(`${where}: "description" debe ser string.`);
    }
    if ("medium" in item && typeof item.medium !== "string") {
      errors.push(`${where}: "medium" debe ser string.`);
    }
    if ("size" in item && typeof item.size !== "string") {
      errors.push(`${where}: "size" debe ser string.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      total: data.length,
      available: availableCount,
      withPrice: withPriceCount,
      collections: Object.fromEntries(collections),
    },
  };
}

async function main() {
  const strictImages = !process.argv.includes("--no-strict-images");
  console.log("[validate-manifest] Validando assets/data/artworks.json...");

  try {
    const result = await validateManifest({ strictImages });

    console.log(`\n[validate-manifest] Total de obras: ${result.stats.total}`);
    console.log(`[validate-manifest] Disponibles: ${result.stats.available}`);
    console.log(`[validate-manifest] Con precio: ${result.stats.withPrice}`);

    const collectionEntries = Object.entries(result.stats.collections);
    if (collectionEntries.length > 0) {
      console.log(`[validate-manifest] Colecciones (${collectionEntries.length}):`);
      for (const [name, count] of collectionEntries) {
        console.log(`  - ${name}: ${count} obras`);
      }
    }

    if (result.warnings.length > 0) {
      console.log(`\n[validate-manifest] Advertencias (${result.warnings.length}):`);
      for (const w of result.warnings) console.log(`  ! ${w}`);
    }

    if (!result.ok) {
      console.error(`\n[validate-manifest] ERRORES (${result.errors.length}):`);
      for (const e of result.errors) console.error(`  X ${e}`);
      process.exit(1);
    }

    console.log("\n[validate-manifest] OK - Manifest válido.");
  } catch (err) {
    console.error(`[validate-manifest] Error fatal: ${err.message}`);
    process.exit(1);
  }
}

// Solo correr main cuando se ejecuta como CLI, no cuando se importa desde un test
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}