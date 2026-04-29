(function () {
// ====== CONFIG (CAMBIA SOLO EL EMAIL) ======
const SETTINGS = {
  email: "artista@correo.com",
  instagramUrl: "https://www.instagram.com/artedelulu",
  linktreeUrl: "https://linktr.ee/lulucardenas?utm_source=linktree_profile_share&ltsid=c105b71a-f330-43ba-a84f-3cb85dae8ddf",
  artworksUrl: "assets/data/artworks.json"
};

const HOME_HERO_IDS = ["p-008", "p-006", "p-011", "p-014", "p-017", "p-015"];
const FEATURED_CURATION_IDS = ["p-018", "p-020", "p-013", "p-008", "p-006", "c-002"];

function pickItemsByIds(data, ids) {
  const byId = new Map(data.map((item) => [item.id, item]));
  const selected = ids.map((id) => byId.get(id)).filter(Boolean);
  return selected.length ? selected : data.slice(0, 6);
}

async function getArtworksData() {
  const embeddedData = Array.isArray(window.ARTWORKS_DATA) && window.ARTWORKS_DATA.length > 0
    ? window.ARTWORKS_DATA
    : null;

  if (location.protocol === "file:" && embeddedData) {
    return embeddedData;
  }

  try {
    const response = await fetch(SETTINGS.artworksUrl);
    const data = await response.json();
    window.ARTWORKS_DATA = data;
    return data;
  } catch (_) {
    if (embeddedData) {
      return embeddedData;
    }
    throw _;
  }
}

// Menú mobile + año footer
const toggle = document.querySelector(".nav__toggle");
const nav = document.querySelector("#navMenu");
const backdrop = document.querySelector("#navBackdrop");
const closeBtn = nav?.querySelector(".nav__close");

function openNav(){
  if (!nav) return;
  nav.classList.add("is-open");
  backdrop?.classList.add("is-open");
  document.body.classList.add("nav-open");
  toggle?.setAttribute("aria-expanded", "true");
  if (backdrop) backdrop.hidden = false;
}

function closeNav(){
  if (!nav) return;
  nav.classList.remove("is-open");
  backdrop?.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  toggle?.setAttribute("aria-expanded", "false");
  if (backdrop) backdrop.hidden = true;
  nav.querySelectorAll(".nav__dropdown[open]").forEach((dropdown) => {
    dropdown.open = false;
  });
}

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.contains("is-open");
    isOpen ? closeNav() : openNav();
  });
}

backdrop?.addEventListener("click", closeNav);
closeBtn?.addEventListener("click", closeNav);

// cerrar con ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav?.classList.contains("is-open")) closeNav();
});

// cerrar al tocar un link
nav?.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (a) closeNav();
});


const yearEl = document.querySelector("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Featured (en home)
async function loadFeatured() {
  const grid = document.querySelector("#featuredGrid");
  if (!grid) return;

  try {
    const data = await getArtworksData();
    if (!Array.isArray(data) || data.length === 0) return;

    const featured = pickItemsByIds(data, FEATURED_CURATION_IDS);
    const [spotlight, ...secondary] = featured;
    if (!spotlight) return;

    grid.innerHTML = `
      ${featuredSpotlightHTML(spotlight)}
      <div class="featured-curation__stack">
        ${secondary.map(featuredCardHTML).join("")}
      </div>
    `;
  } catch (_) {
    // Si falla la carga, la sección mantiene el layout sin tarjetas.
  }
}

function artworkTypeLabel(item) {
  return item.type === "ceramica" ? "Cerámica" : "Pintura";
}

function artworkCollection(item) {
  return typeof item.collection === "string" ? item.collection.trim() : "";
}

function artworkDescription(item) {
  const description = (item.description || "").trim();
  if (!description || /descripci[oó]n pendiente/i.test(description)) {
    const collection = artworkCollection(item);
    return collection
      ? `Parte de la colección ${collection}, una serie de piezas originales donde color, gesto y fauna dialogan entre sí.`
      : "Obra original creada a mano, disponible para consulta, compra o desarrollo de una comisión relacionada.";
  }

  return description.length > 175
    ? `${description.slice(0, 175).trim()}…`
    : description;
}

function availabilityLabel(item) {
  return item.available ? "Disponible" : "Vendida";
}

function featuredSpotlightHTML(item) {
  const meta = [item.year, item.medium, item.size].filter(Boolean).join(" • ");
  const collection = artworkCollection(item);

  return `
    <a class="featured-spotlight" href="gallery.html?open=${encodeURIComponent(item.id)}">
      <div class="featured-spotlight__media">
        <img src="${item.image}" alt="${item.title}" loading="eager" />
      </div>
      <div class="featured-spotlight__content">
        <div class="featured-spotlight__chips">
          <span class="badge ${item.available ? "badge--available" : "badge--sold"}">${availabilityLabel(item)}</span>
          <span class="featured-chip">${artworkTypeLabel(item)}</span>
          ${collection ? `<span class="featured-chip featured-chip--soft">${collection}</span>` : ""}
        </div>
        <div class="featured-spotlight__copy">
          <span class="featured-kicker">Obra protagonista</span>
          <h3>${item.title}</h3>
          <p>${artworkDescription(item)}</p>
        </div>
        ${meta ? `<p class="featured-spotlight__meta">${meta}</p>` : ""}
        <span class="featured-spotlight__cta">Ver detalle completo</span>
      </div>
    </a>
  `;
}

function featuredCardHTML(item) {
  const collection = artworkCollection(item);
  const meta = [item.year, artworkTypeLabel(item)].filter(Boolean).join(" • ");

  return `
    <a class="featured-card" href="gallery.html?open=${encodeURIComponent(item.id)}">
      <div class="featured-card__media">
        <img class="featured-card__img" src="${item.image}" alt="${item.title}" loading="lazy" />
      </div>
      <div class="featured-card__body">
        <div class="featured-card__top">
          <span class="featured-card__meta">${meta}</span>
          <span class="badge ${item.available ? "badge--available" : "badge--sold"}">${availabilityLabel(item)}</span>
        </div>
        <h3 class="featured-card__title">${item.title}</h3>
        ${collection ? `<p class="featured-card__collection">${collection}</p>` : ""}
      </div>
    </a>
  `;
}
loadFeatured();

async function loadHeroCarousel() {
  const track = document.querySelector("#heroCarouselTrack");
  const prevBtn = document.querySelector("#heroPrev");
  const nextBtn = document.querySelector("#heroNext");
  const dotsWrap = document.querySelector("#heroDots");
  if (!track || !prevBtn || !nextBtn || !dotsWrap) return;

  try {
    const data = await getArtworksData();
    if (!Array.isArray(data) || data.length === 0) return;

    const items = pickItemsByIds(data, HOME_HERO_IDS);
    let current = 0;
    let timer = null;

    track.innerHTML = items.map((item, index) => `
      <article class="hero-carousel__slide ${index === 0 ? "is-active" : ""}" data-slide="${index}">
        <img src="${item.image}" alt="${item.title}" loading="${index === 0 ? "eager" : "lazy"}" />
        <div class="hero-carousel__caption">
          <strong>${item.title}</strong>
          <span>${item.type === "ceramica" ? "Cerámica" : "Pintura"}${item.year ? ` · ${item.year}` : ""}</span>
        </div>
      </article>
    `).join("");

    dotsWrap.innerHTML = items.map((_, index) => `
      <button class="hero-carousel__dot ${index === 0 ? "is-active" : ""}" type="button" data-dot="${index}" aria-label="Ir a obra ${index + 1}"></button>
    `).join("");

    const slides = Array.from(track.querySelectorAll(".hero-carousel__slide"));
    const dots = Array.from(dotsWrap.querySelectorAll(".hero-carousel__dot"));

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === current));
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === current));
    }

    function next() { showSlide(current + 1); }
    function prev() { showSlide(current - 1); }

    function startAuto() {
      stopAuto();
      timer = setInterval(next, 4200);
    }
    function stopAuto() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    prevBtn.addEventListener("click", () => { prev(); startAuto(); });
    nextBtn.addEventListener("click", () => { next(); startAuto(); });
    dotsWrap.addEventListener("click", (e) => {
      const dot = e.target.closest("[data-dot]");
      if (!dot) return;
      showSlide(Number(dot.dataset.dot));
      startAuto();
    });

    track.addEventListener("mouseenter", stopAuto);
    track.addEventListener("mouseleave", startAuto);
    track.addEventListener("touchstart", stopAuto, { passive: true });
    track.addEventListener("touchend", startAuto, { passive: true });

    startAuto();
  } catch (_) {
    // Si falla la carga, el hero mantiene estructura sin carrusel.
  }
}
loadHeroCarousel();

// Contact form (mailto)
const contactForm = document.querySelector("#contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.querySelector("#name")?.value?.trim() || "";
    const email = document.querySelector("#emailC")?.value?.trim() || "";
    const message = document.querySelector("#msg")?.value?.trim() || "";

    const subject = encodeURIComponent(`Consulta desde el sitio — ${name}`);
    const body = encodeURIComponent(`Nombre: ${name}\nCorreo electrónico: ${email}\n\nMensaje:\n${message}`);

    window.location.href = `mailto:${SETTINGS.email}?subject=${subject}&body=${body}`;
  });
}
let lastScroll = 0;
const header = document.querySelector(".header");
const threshold = 10; // Cantidad de pixeles de tolerancia

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset;

  // Si el scroll es menor a 0 (rebote en iOS) no hace nada
  if (currentScroll <= 0) {
    header.style.transform = "translateY(0)";
    return;
  }

  // Si el movimiento es muy pequeño, lo ignoramos para mayor suavidad
  if (Math.abs(currentScroll - lastScroll) < threshold) return;

  if (currentScroll > lastScroll && currentScroll > 150) {
    // Bajando: Escondemos el header
    header.style.transform = "translateY(-100%)";
  } else {
    // Subiendo: Mostramos el header
    header.style.transform = "translateY(0)";
  }

  lastScroll = currentScroll;
}, { passive: true }); // Mejora el rendimiento del scroll
})();
