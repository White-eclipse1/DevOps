import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas a los archivos
const jsonPath = path.resolve(__dirname, "../../frontend/assets/data/artworks.json");
const sqlPath = path.resolve(__dirname, "../migrations/0002_seed_artworks.sql");

// Leer el JSON
const rawData = fs.readFileSync(jsonPath, "utf-8");
const artworks = JSON.parse(rawData);

let sql = `-- Migración 0002: Sembrar (seed) datos iniciales desde artworks.json\n\n`;

for (const art of artworks) {
  const id = art.id.replace(/'/g, "''");
  const type = art.type.replace(/'/g, "''");
  const collection = art.collection ? `'${art.collection.replace(/'/g, "''")}'` : "NULL";
  const title = art.title.replace(/'/g, "''");
  const year = art.year || "NULL";
  const medium = art.medium ? `'${art.medium.replace(/'/g, "''")}'` : "NULL";
  const size = art.size ? `'${art.size.replace(/'/g, "''")}'` : "NULL";
  const price = art.price !== null && art.price !== undefined ? art.price : "NULL";
  const available = art.available ? 1 : 0;
  const image = art.image ? `'${art.image.replace(/'/g, "''")}'` : "NULL";
  const description = art.description ? `'${art.description.replace(/'/g, "''")}'` : "NULL";

  sql += `INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) \n`;
  sql += `VALUES ('${id}', '${type}', ${collection}, '${title}', ${year}, ${medium}, ${size}, ${price}, ${available}, ${image}, ${description});\n\n`;
}

// Asegurarse de que la carpeta migrations exista
const migrationsDir = path.dirname(sqlPath);
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Guardar el archivo SQL
fs.writeFileSync(sqlPath, sql);
console.log(`✅ Archivo de migración generado exitosamente en: migrations/0002_seed_artworks.sql`);
console.log(`➡️  Ahora ejecuta: npx wrangler d1 migrations apply art-db --env production --remote`);
