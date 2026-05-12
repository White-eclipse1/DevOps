-- Migración 0002: Sembrar (seed) datos iniciales desde artworks.json

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-001', 'pintura', NULL, 'Entre laberintos me encuentras', 2025, 'Acrílico sobre lienzo', '100 x 100 cm', 8500, 1, 'assets/img/Entre laberintos me encuentras.jpeg', 'Descripción corta de la pieza: inspiración, paleta y proceso.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-002', 'pintura', NULL, 'Pintas mi corazón de colores', 2022, 'Acrílico sobre tela', '50 x 50 cm', 6200, 0, 'assets/img/Pintas mi corazón de colores.jpeg', 'Pieza vendida. Se puede realizar algo similar por comisión.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('c-001', 'ceramica', NULL, 'Cruz Jalics', 2025, 'Cerámica esmaltada', '28 cm alto', 3200, 0, 'assets/img/Cruz Jalics.jpeg', 'Cruz inspirada en la cruz que tenía a un costado de su cama en Gries mi maestro Franz Jalics SJ. Crearla me remonta a su sencillez de corazón y su grandeza de alma.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('c-002', 'ceramica', NULL, 'Mascaradas', 2025, 'Cerámica de alta temperatura', '8 cm alto', 980, 1, 'assets/img/caras.jpeg', 'Colgantes que simulan el baile de máscaras de las culturas actuales y ancestrales. No hacen referencia a nadie en específico. Son personajes que pueden ser encontrados en la ficción o en la realidad.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-003', 'pintura', NULL, 'Reflejos de mi alma', 2025, 'Acrílico', '80 x 60 cm', 7500, 1, 'assets/img/Reflejos de mi alma.jpeg', 'Descripción corta de la pieza: inspiración, paleta y proceso.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-004', 'pintura', NULL, 'Los amantes patagónicos', 2025, 'Acrílico sobre canvas', '80 x 60 cm', 7500, 1, 'assets/img/Los amantes patagónicos.jpeg', 'Descripción corta de la pieza: inspiración, paleta y proceso.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('c-003', 'ceramica', NULL, 'Charola portatiliches buró', 2025, 'Cerámica de alta temperatura', '10 x 30 cm', 200, 1, 'assets/img/Charola portatiliches buró.jpeg', 'Charola portatiliches para el buró');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-005', 'pintura', NULL, 'Charola portatiliches buró', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Charola portatiliches buró.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-006', 'pintura', 'Fauna del corazón', 'Conejo', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Conejo.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-007', 'pintura', 'Fauna del corazón', 'Corazón enmielado', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Corazón enmielado.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-008', 'pintura', 'Fauna del corazón', 'Gallo', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Gallo.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-009', 'pintura', 'Fauna del corazón', 'La ventana de mi corazón', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/La ventana de mi corazón.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-010', 'pintura', 'Animales en lienzo', 'Los amantes patagónicos', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Los amantes patagónicos.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-011', 'pintura', 'Animales en lienzo', 'Mono', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Mono.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-012', 'pintura', 'Fauna del corazón', 'Mosaicos de mi corazón', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Mosaicos de mi corazón.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-013', 'pintura', 'Fauna del corazón', 'Pajarito de mi corazón', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Pajarito de mi corazón.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-014', 'pintura', 'Animales en lienzo', 'Perro', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Perro.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-015', 'pintura', 'Fauna del corazón', 'Pintas mi corazón de colores', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Pintas mi corazón de colores.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-016', 'pintura', NULL, 'Pintura1', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Pintura1.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-017', 'pintura', 'Animales en lienzo', 'Pollo', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/Pollo.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-018', 'pintura', NULL, 'Hay fiesta en el pueblo', 2025, 'mixta sobre canvas', '100x80 cm', NULL, 1, 'assets/img/Hay fiesta en el pueblo.jpeg', 'En mi pueblo, cada año, la gente sale a festejar la vida. A mí me gusta creer que la vida debería celebrarse cada día como si fuera un carnaval; tal vez así evitaríamos sentimientos como la tristeza y la ira. Tal vez así, día con día, las personas de mi pueblo serían felices.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-019', 'pintura', NULL, 'Rosas de vida', 2025, 'acrílico', '310 x 200 cm', NULL, 1, 'assets/img/Rosas de vida.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-020', 'pintura', 'Fauna del corazón', 'Pájaros al vuelo', 2026, 'Acrílico sobre canvas', '100x80 cm', NULL, 1, 'assets/img/Pájaros al vuelo.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-021', 'pintura', NULL, 'WhatsApp Image 2026-02-16 at 5.12.09 PM', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/WhatsApp Image 2026-02-16 at 5.12.09 PM.jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-022', 'pintura', NULL, 'WhatsApp Image 2026-02-16 at 5.12.10 PM (1)', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/WhatsApp Image 2026-02-16 at 5.12.10 PM (1).jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-023', 'pintura', NULL, 'WhatsApp Image 2026-02-16 at 5.12.10 PM (2)', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/WhatsApp Image 2026-02-16 at 5.12.10 PM (2).jpeg', 'Descripción pendiente de la pieza.');

INSERT OR REPLACE INTO artworks (id, type, collection, title, year, medium, size, price, available, image, description) 
VALUES ('p-024', 'pintura', NULL, 'WhatsApp Image 2026-02-16 at 5.12.10 PM', 2026, 'Acrílico sobre lienzo', 'Por definir', NULL, 1, 'assets/img/WhatsApp Image 2026-02-16 at 5.12.10 PM.jpeg', 'Descripción pendiente de la pieza.');

