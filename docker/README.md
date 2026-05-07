# Imagen Docker: galeria-viva-tooling

Imagen auxiliar que encapsula los scripts de validación de Galería Viva. Útil para:

- Validar `assets/data/artworks.json` antes de hacer commit.
- Tener un entorno reproducible para correr el pipeline localmente.
- Documentar la dependencia con Docker Hub que pide la propuesta del proyecto.

## Build local

Desde la raíz del repo:

```powershell
docker build -t galeria-viva-tooling -f docker/Dockerfile .
```

## Correr la validación contra el contenido empaquetado en la imagen

```powershell
docker run --rm galeria-viva-tooling
```

## Correr la validación contra el repo local (montando el directorio)

```powershell
docker run --rm `
  -v ${PWD}/assets:/workspace/assets:ro `
  galeria-viva-tooling node scripts/validate-manifest.mjs
```

## Pull desde Docker Hub

Una vez que GitHub Actions publique la imagen:

```powershell
docker pull <DOCKERHUB_USERNAME>/galeria-viva-tooling:latest
docker run --rm <DOCKERHUB_USERNAME>/galeria-viva-tooling:latest
```

## Tags publicadas por el pipeline

- `latest` - última versión de `main`.
- `sha-<commit>` - hash corto del commit.
- `<YYYYMMDD-HHmm>` - timestamp del build.