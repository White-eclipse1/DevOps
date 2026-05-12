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
│   │   ├── artworks.ts
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── backend/
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

## Monitoreo Con Axiom

El proyecto envia eventos estructurados a Axiom desde dos superficies:

- Backend Worker: registra requests, errores no controlados y login exitoso/fallido.
- Frontend: registra carga de app, carga de catalogo, login/logout y errores del navegador mediante `POST /api/monitor`.

Variables necesarias:

```text
AXIOM_TOKEN_BACKEND
AXIOM_TOKEN_FRONTEND
AXIOM_INGEST_URL_BACKEND
VITE_AXIOM_INGEST_URL
```

`AXIOM_INGEST_URL_BACKEND` debe apuntar al dataset del backend y `VITE_AXIOM_INGEST_URL` al dataset del frontend, por ejemplo:

```text
https://api.axiom.co/v1/datasets/galeria-backend-dev/ingest
https://api.axiom.co/v1/datasets/galeria-frontend/ingest
```

Los secrets de GitHub se usan para configurar el Worker durante los deploys. Para Cloudflare Pages, configura tambien `AXIOM_TOKEN_FRONTEND` y `VITE_AXIOM_INGEST_URL` como variables/secrets del proyecto Pages, porque el endpoint `frontend/functions/api/monitor.js` corre dentro de Cloudflare Pages Functions.

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
