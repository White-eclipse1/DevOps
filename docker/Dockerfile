# Imagen auxiliar de Galería Viva
# Encapsula la validación de manifests y herramientas reproducibles
# para ingestar/verificar contenido fuera de Cloudflare Pages.

FROM node:20-alpine

LABEL org.opencontainers.image.title="galeria-viva-tooling"
LABEL org.opencontainers.image.description="Tooling reproducible para validar contenido de Galería Viva"
LABEL org.opencontainers.image.licenses="MIT"

# Crear usuario sin privilegios
RUN addgroup -S galeria && adduser -S galeria -G galeria

WORKDIR /workspace

# Solo se copia lo necesario para correr scripts standalone
# (los scripts no tienen dependencias npm, así no necesitamos npm install)
COPY --chown=galeria:galeria scripts/ ./scripts/
COPY --chown=galeria:galeria assets/data/ ./assets/data/
COPY --chown=galeria:galeria assets/img/ ./assets/img/

USER galeria

# Por defecto valida el manifest del contenido empaquetado
ENTRYPOINT ["node"]
CMD ["scripts/validate-manifest.mjs"]