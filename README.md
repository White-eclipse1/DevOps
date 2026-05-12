# Galeria Viva

Galeria Viva es una galeria de arte online para artistas emergentes. El proyecto usa un frontend visual en React + Vite + TypeScript y despliegue en Cloudflare Pages, con recursos de Cloudflare para Worker y D1.

El enfoque actual es tener una experiencia publica para clientes y una vista ligera para artista, dejando el contenido versionado en el repositorio y listo para desplegarse automaticamente con cada push a `main`.

## Alcance Actual

- Vista cliente con home, obra destacada, perfil artistico, proceso creativo, contacto y galeria publica.
- Galeria con filtros por tipo, disponibilidad, coleccion, busqueda y ordenamiento.
- Vista artista en `/artist` con resumen de inventario, filtros, seleccion de obra y editor local de ficha.
- Catalogo versionado en `frontend/assets/data/artworks.json`.
- Deploy en Cloudflare Pages desde GitHub.
- Infraestructura Terraform para Pages, Worker y D1.

Se omite por ahora la parte de imagenes Docker/Docker Hub del planning.

## Rutas Del Frontend

- `/` o `/customer`: vista cliente.
- `/gallery`: galeria publica filtrable.
- `/artist`: vista de artista para revisar y preparar el catalogo.

Cloudflare Pages usa `public/_redirects` para que esas rutas funcionen como SPA.

## Login Demo

El acceso inicial usa un backend ligero en Cloudflare Pages Functions:

```text
POST /api/login
```

Usuarios de prueba:

```text
Cliente
correo: cliente@galeriaviva.local
password: cliente123

Artista
correo: artista@galeriaviva.local
password: artista123
```

Segun el rol autenticado, React muestra automaticamente la vista cliente o la vista artista. En desarrollo local, si Vite no encuentra `/api/login`, la app usa un fallback local solo para poder probar la interfaz.

## Stack

- React
- Vite
- TypeScript
- CSS propio en `frontend/assets/css/styles.css`
- Cloudflare Pages
- Cloudflare Worker
- Cloudflare D1
- Cloudflare R2 planeado para almacenamiento de imagenes
- Terraform
- Axiom (logs y errores desde el navegador y desde Workers vía Tail Consumer)

## Estructura

```text
.
├── frontend/
│   ├── assets/
│   │   ├── css/styles.css
│   │   ├── data/artworks.json
│   │   └── img/
│   ├── functions/api/login.js
│   ├── public/_redirects
│   ├── scripts/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── lib/artwork-utils.ts
│   │   ├── artworks.ts
│   │   ├── ErrorBoundary.tsx
│   │   ├── instrument.ts
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── axiom-tail/
│   │   ├── src/index.js      # Tail consumer → Axiom ingest
│   │   ├── package.json
│   │   └── wrangler.toml
│   ├── src/worker.js
│   ├── src/worker.test.js
│   ├── package.json
│   └── wrangler.toml
├── infra/
│   ├── db/
│   ├── pages/
│   ├── workers/
│   ├── main.tf
│   ├── providers.tf
│   └── variables.tf
├── docker/
└── .github/workflows/
```

## Desarrollo Local

```powershell
npm install
npm run dev
```

Abre:

```text
http://127.0.0.1:5173/customer
http://127.0.0.1:5173/gallery
http://127.0.0.1:5173/artist
```

## Build

```powershell
npm run build
```

Cloudflare Pages debe usar:

- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Root directory: `frontend`

## Observabilidad (Axiom)

Se usa **Axiom** con **exactamente 2 datasets** en la cuenta del equipo:

| Dataset | Origen | Contenido |
|---------|--------|-----------|
| `galeria-frontend` | `frontend/src/instrument.ts` | Errores no capturados, `ErrorBoundary`, batches de ingest desde el navegador |
| `galeria-backend` | Worker `art-worker` + Tail `axiom-tail-dev` / `axiom-tail` | Telemetría de invocación, `console.*` JSON y excepciones del runtime |

**Separar dev vs producción:** el producer incluye campo `environment` (`dev` | `production`) en cada línea JSON (`logEvent` en [backend/src/worker.js](backend/src/worker.js)). En Axiom: `where environment == "dev"` o `where environment == "production"`.

**Backend (Cloudflare)**

1. Crea en Axiom los datasets `galeria-frontend` y `galeria-backend`; el Tail usa `AXIOM_DATASET = "galeria-backend"` en [backend/axiom-tail/wrangler.toml](backend/axiom-tail/wrangler.toml) (ya ambos envs).
2. Token ingest para el Tail: secreto Worker `AXIOM_TOKEN` desde `backend/axiom-tail` (en CI: GitHub secret `AXIOM_TOKEN_BACKEND`).
3. Despliegue: tail consumer antes del producer; scripts `npm run deploy:tail:dev` y `deploy:tail:prod` en el paquete del backend.
4. **Workers Paid**: [Tail Workers](https://developers.cloudflare.com/workers/observability/tail-workers/) según Cloudflare.
5. Opcional tras deploy: `GET .../axiom-test` fuerza una excepción para validar ingest (quitar en producción estable si prefieren).

**Secretos GitHub Actions** (un compañero con acceso las configura):

| Secreto | Uso |
|---------|-----|
| `VITE_AXIOM_INGEST_URL` | Ingest frontend, típico `https://api.axiom.co/v1/datasets/galeria-frontend/ingest` (EU: host `api.eu.axiom.co`). |
| `AXIOM_TOKEN_FRONTEND` | Token solo ingest sobre `galeria-frontend` → se inyecta como `VITE_AXIOM_TOKEN` en [frontend-deploy-dev.yml](.github/workflows/frontend-deploy-dev.yml). |
| `AXIOM_TOKEN_BACKEND` | Token ingest sobre `galeria-backend` → el workflow ejecuta `wrangler secret put AXIOM_TOKEN` en el Tail worker antes de deploy. |

**Frontend (Pages / Vite)** — sin secretos configurados el build sigue funcionando pero no envía eventos desde el navegador.

Variables equivalentes locales:

```text
VITE_AXIOM_INGEST_URL=https://api.axiom.co/v1/datasets/galeria-frontend/ingest
VITE_AXIOM_TOKEN=<token solo ingest galeria-frontend>
```

**CORS**: si falla ingest desde browser, usar proxy Worker u otra vía admitida por Axiom. El ingest vía Tail no usa CORS del navegador.

**D1 dev**: el `database_id` de `art-db-dev` en [backend/wrangler.toml](backend/wrangler.toml) debe ser válido.

Consulta dashboards en [app.axiom.co](https://app.axiom.co).

## Infraestructura

La infraestructura vive en `infra/`.

Recursos creados:

- Cloudflare Pages Project: `paaginaludos-devops`
- Cloudflare D1: `art-db`
- Cloudflare Worker: `art_worker`

Backend actual:

- `frontend/functions/api/login.js`: login usado por Cloudflare Pages.
- `backend/src/worker.js`: endpoint `/login` equivalente para el Worker separado.

Recurso pendiente del planning:

- Cloudflare R2 para almacenar imagenes fuera del repositorio. Por ahora las imagenes viven en `frontend/assets/img/`.

Comandos principales:

```powershell
cd infra
terraform init -reconfigure
terraform plan
terraform apply
```

`terraform.tfvars` contiene valores locales sensibles y no debe subirse al repositorio.

## Modelo De Contenido

Las obras se administran por ahora en:

```text
frontend/assets/data/artworks.json
```

Cada obra contiene:

- `id`
- `type`
- `collection`
- `title`
- `year`
- `medium`
- `size`
- `price`
- `available`
- `image`
- `description`

La vista artista permite editar estas fichas en memoria durante la sesion. La persistencia real en D1 queda como siguiente paso.

## Flujo De Trabajo

Estrategia sugerida:

- `main`: produccion.
- `develop`: integracion.
- `feature/*`: nuevas funcionalidades.
- `content/*`: cambios editoriales de obras, textos o colecciones.

Flujo normal:

```powershell
npm run build
git add .
git commit -m "Descripcion del cambio"
git push origin main
```

El push a `main` dispara el deploy en Cloudflare Pages.

## Siguientes Pasos

- Persistir cambios de la vista artista en D1 mediante Worker.
- Crear bucket R2 y migrar las imagenes del catalogo.
- Agregar pruebas unitarias para filtros, cards y detalle de obra.
- Agregar GitHub Actions para build y validacion de contenido.
- Crear Wiki y Project Board con epicas de planeacion, frontend, Cloudflare, calidad y entrega.
