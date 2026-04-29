(function () {
const SETTINGS = {
  contactUrl: "index.html#contacto",
  dataUrl: "assets/data/artworks.json",
  fallbackImage: "assets/img/caras.jpeg"
};

const grid = document.querySelector("#grid");
const tabs = document.querySelectorAll(".tab");
const search = document.querySelector("#search");
const sort = document.querySelector("#sort");
const resetBtn = document.querySelector("#resetFilters");
const resultsText = document.querySelector("#resultsText");
const emptyState = document.querySelector("#emptyState");
const collectionFilters = document.querySelector("#collectionFilters");
const collectionFiltersWrap = document.querySelector("#collectionFiltersWrap");

let all = [];
let filter = "all";
let collectionFilter = "";
let requestedOpenId = null;
let requestedOpenHandled = false;

const params = new URLSearchParams(location.search);
const typeParam = params.get("type");
collectionFilter = normalizeCollectionValue(params.get("collection"));
requestedOpenId = params.get("open");

if (typeParam) {
  filter = typeParam;
}

async function getArtworksData() {
  const embeddedData = Array.isArray(window.ARTWORKS_DATA) && window.ARTWORKS_DATA.length > 0
    ? window.ARTWORKS_DATA
    : null;

  if (location.protocol === "file:" && embeddedData) {
    return embeddedData;
  }

  try {
    const response = await fetch(SETTINGS.dataUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: No se pudo cargar ${SETTINGS.dataUrl}`);
    }

    const data = await response.json();
    window.ARTWORKS_DATA = data;
    return data;
  } catch (error) {
    if (embeddedData) {
      return embeddedData;
    }
    throw error;
  }
}

function showError(msg) {
  if (!grid) return;

  grid.innerHTML = `
    <div class="card">
      <h3>Error en la galería</h3>
      <p class="lead">${msg}</p>
      <p style="color: var(--muted); font-size: 14px; margin-top: 12px;">
        Verifica que el archivo <code>assets/data/artworks.json</code> exista y sea válido.
      </p>
    </div>
  `;
}

function showLoading() {
  if (!grid) return;

  grid.innerHTML = `
    <div class="card" style="text-align:center; padding:40px;">
      <p class="lead">Cargando galería...</p>
    </div>
  `;
}

function updateStats() {
  const totalCount = document.querySelector("#totalCount");
  const availableCount = document.querySelector("#availableCount");

  if (totalCount) totalCount.textContent = all.length;

  if (availableCount) {
    const available = all.filter((item) => item.available).length;
    availableCount.textContent = available;
  }
}

function normalizeCollectionValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sameCollection(left, right) {
  return normalizeCollectionValue(left).toLowerCase() === normalizeCollectionValue(right).toLowerCase();
}

function getPrimaryFilteredItems(source = all, activeFilter = filter) {
  let items = [...source];

  if (activeFilter === "pintura" || activeFilter === "ceramica") {
    items = items.filter((item) => item.type === activeFilter);
  }

  if (activeFilter === "disponible") {
    items = items.filter((item) => Boolean(item.available));
  }

  return items;
}

function getCollectionOptions(source = getPrimaryFilteredItems()) {
  const collections = new Map();

  source.forEach((item) => {
    const collection = getCollectionName(item);
    if (!collection) return;

    if (!collections.has(collection)) {
      collections.set(collection, {
        name: collection,
        count: 0
      });
    }

    collections.get(collection).count += 1;
  });

  return Array.from(collections.values());
}

function ensureCollectionFilterIsValid() {
  if (!collectionFilter) return false;

  const options = getCollectionOptions();
  const isValid = options.some((option) => sameCollection(option.name, collectionFilter));

  if (isValid) return false;

  collectionFilter = "";
  return true;
}

function getFilterCopy(activeFilter = filter, activeCollection = collectionFilter) {
  if (activeCollection) {
    return {
      badge: "Colección seleccionada",
      title: activeCollection,
      desc: "Explora esta serie y combina el filtro por colección con tipo, disponibilidad o búsqueda para encontrar la pieza exacta."
    };
  }

  if (activeFilter === "pintura") {
    return {
      badge: "Colecciones de pintura",
      title: "Pinturas originales",
      desc: "Explora las pinturas organizadas por colección para descubrir series completas y piezas relacionadas."
    };
  }

  if (activeFilter === "ceramica") {
    return {
      badge: "Colecciones de cerámica",
      title: "Cerámicas artesanales",
      desc: "Descubre piezas cerámicas únicas hechas a mano y revisa cada obra con sus detalles completos."
    };
  }

  if (activeFilter === "disponible") {
    return {
      badge: "Obras Disponibles",
      title: "Obras listas para ti",
      desc: "Estas son las piezas disponibles en este momento, agrupadas por colección cuando forman parte de una serie."
    };
  }

  return {
    badge: "Explorar colecciones",
    title: "Galería por colecciones",
    desc: "Descubre la galería completa organizada por colecciones para identificar obras que pertenecen a una misma serie."
  };
}

function applyTitle(activeFilter = filter, activeCollection = collectionFilter) {
  const title = document.querySelector("#galleryTitle");
  const desc = document.querySelector("#galleryDesc");
  const badge = document.querySelector("#galleryBadge");
  const copy = getFilterCopy(activeFilter, activeCollection);

  if (!title || !desc) return;

  if (badge) badge.textContent = copy.badge;
  title.textContent = copy.title;
  desc.textContent = copy.desc;
}

function syncUrlState() {
  const nextParams = new URLSearchParams();

  if (filter === "pintura" || filter === "ceramica") {
    nextParams.set("type", filter);
  }

  if (collectionFilter) {
    nextParams.set("collection", collectionFilter);
  }

  if (requestedOpenId && !requestedOpenHandled) {
    nextParams.set("open", requestedOpenId);
  }

  const query = nextParams.toString();
  const nextUrl = query ? `gallery.html?${query}` : "gallery.html";
  window.history.replaceState({}, "", nextUrl);
}

function getCollectionName(item) {
  return typeof item.collection === "string" ? item.collection.trim() : "";
}

function renderCollectionFilters() {
  if (!collectionFilters || !collectionFiltersWrap) return;

  const baseItems = getPrimaryFilteredItems();
  const options = getCollectionOptions(baseItems);

  if (options.length === 0) {
    collectionFiltersWrap.hidden = true;
    collectionFilters.innerHTML = "";
    return;
  }

  const totalCount = baseItems.length;

  collectionFilters.innerHTML = [
    `
      <button
        class="collection-filter${collectionFilter ? "" : " is-active"}"
        type="button"
        data-collection=""
        aria-pressed="${collectionFilter ? "false" : "true"}"
      >
        <span>Todas las colecciones</span>
        <span class="collection-filter__count">${totalCount}</span>
      </button>
    `,
    ...options.map((option) => `
      <button
        class="collection-filter${sameCollection(option.name, collectionFilter) ? " is-active" : ""}"
        type="button"
        data-collection="${option.name}"
        aria-pressed="${sameCollection(option.name, collectionFilter) ? "true" : "false"}"
      >
        <span>${option.name}</span>
        <span class="collection-filter__count">${option.count}</span>
      </button>
    `)
  ].join("");

  collectionFiltersWrap.hidden = false;
}

function safePrice(item) {
  return typeof item.price === "number"
    ? `$${item.price.toLocaleString("es-MX")} MXN`
    : "Precio a consulta";
}

function statusPill(item) {
  const isAvailable = Boolean(item.available);
  return `<span class="status-pill ${isAvailable ? "available" : "sold"}">${isAvailable ? "Disponible" : "Vendida"}</span>`;
}

function cardHTML(item) {
  const collection = getCollectionName(item);
  const subtitle = [
    item.year ? String(item.year) : "",
    item.medium || "",
    item.size || ""
  ].filter(Boolean).join(" • ");

  const price = safePrice(item);
  const description = (item.description || "").trim();
  const typeLabel = item.type === "pintura" ? "Pintura" : "Cerámica";
  const shippingNotice = item.type === "pintura"
    ? "Nota: Esta obra se entrega sin marco para facilitar su envío y permitir que elijas el que mejor combine con tu espacio."
    : "Nota: La pieza de cerámica no incluye los accesorios o la decoración mostrados en las fotografías.";

  return `
    <article class="art-card" data-id="${item.id}">
      <button class="art-summary" type="button" aria-expanded="false">
        <img
          class="art-thumb"
          src="${item.image}"
          alt="${item.title}"
          loading="lazy"
          onerror="this.src='${SETTINGS.fallbackImage}'; this.onerror=null;"
        />

        <div class="art-main">
          <div class="art-meta-row">
            <span class="art-type">${typeLabel}</span>
            ${collection ? `<span class="art-collection">${collection}</span>` : ""}
          </div>
          <h3 class="art-title">${item.title}</h3>
          <p class="art-sub">${subtitle}</p>
        </div>

        <div class="art-status">
          ${statusPill(item)}
          <span class="art-chevron">⌄</span>
        </div>
      </button>

      <div class="art-panel" hidden>
        <div class="panel-grid">
          <div class="panel-image-wrapper">
            <img
              class="panel-img"
              src="${item.image}"
              alt="${item.title}"
              loading="lazy"
              onerror="this.src='${SETTINGS.fallbackImage}'; this.onerror=null;"
            />
          </div>

          <div class="panel-info">
            <div class="panel-header">
              <h3 style="margin:0 0 8px; font-size:24px;">${item.title}</h3>
              ${statusPill(item)}
            </div>

            <div class="panel-details">
              <div class="detail-row">
                <span class="detail-label">Tipo</span>
                <span class="detail-value">${typeLabel}</span>
              </div>

              ${collection ? `
                <div class="detail-row">
                  <span class="detail-label">Colección</span>
                  <span class="detail-value">${collection}</span>
                </div>
              ` : ""}

              ${item.year ? `
                <div class="detail-row">
                  <span class="detail-label">Año</span>
                  <span class="detail-value">${item.year}</span>
                </div>
              ` : ""}

              ${item.medium ? `
                <div class="detail-row">
                  <span class="detail-label">Técnica</span>
                  <span class="detail-value">${item.medium}</span>
                </div>
              ` : ""}

              ${item.size ? `
                <div class="detail-row">
                  <span class="detail-label">Dimensiones</span>
                  <span class="detail-value">${item.size}</span>
                </div>
              ` : ""}

              <div class="detail-row detail-row--highlight">
                <span class="detail-label">Precio</span>
                <span class="detail-value" style="font-weight:700; font-size:18px;">${price}</span>
              </div>
            </div>

            ${description ? `
              <div class="panel-description">
                <strong>Descripción</strong>
                <p>${description}</p>
              </div>
            ` : ""}

            <div class="panel-notice" style="margin: 16px 0; padding: 14px; background: var(--primary-soft); border-radius: 12px; border: 1px solid rgba(200, 16, 46, 0.1); display: flex; gap: 12px; align-items: center;">
              <span style="font-size: 20px;">⚠️</span>
              <p style="margin: 0; font-size: 13px; color: var(--primary-dark); font-weight: 500; line-height: 1.4;">
                ${shippingNotice}
              </p>
            </div>

            <div class="panel-actions">
              <a class="btn btn--large" href="${SETTINGS.contactUrl}">
                Preguntar por esta pieza
              </a>
            </div>

            <small class="fineprint" style="display: block; margin-top: 12px; color: var(--muted); font-size: 12px;">
              Escríbeme por Instagram o correo para más información sobre esta obra.
            </small>
          </div>
        </div>
      </div>
    </article>
  `;
}

function getFiltered() {
  const query = (search?.value || "").trim().toLowerCase();
  let items = getPrimaryFilteredItems();

  if (collectionFilter) {
    items = items.filter((item) => sameCollection(getCollectionName(item), collectionFilter));
  }

  if (query) {
    items = items.filter((item) =>
      [
        item.title,
        item.medium,
        String(item.year ?? ""),
        item.size,
        item.type,
        getCollectionName(item)
      ].join(" ").toLowerCase().includes(query)
    );
  }

  const mode = sort?.value || "newest";

  items.sort((a, b) => {
    const yearA = Number(a.year || 0);
    const yearB = Number(b.year || 0);
    const priceA = typeof a.price === "number" ? a.price : Number.POSITIVE_INFINITY;
    const priceB = typeof b.price === "number" ? b.price : Number.POSITIVE_INFINITY;

    if (mode === "oldest") return yearA - yearB;
    if (mode === "priceAsc") return priceA - priceB;
    if (mode === "priceDesc") return priceB - priceA;
    return yearB - yearA;
  });

  return items;
}

function groupItemsByCollection(items) {
  const groups = [];
  const collections = new Map();
  let ungrouped = null;

  items.forEach((item) => {
    const collection = getCollectionName(item);

    if (!collection) {
      if (!ungrouped) {
        ungrouped = {
          key: "obras-individuales",
          title: "Obras individuales",
          eyebrow: "Sin colección",
          items: [],
          isUngrouped: true
        };
      }

      ungrouped.items.push(item);
      return;
    }

    if (!collections.has(collection)) {
      const group = {
        key: `collection-${groups.length + 1}`,
        title: collection,
        eyebrow: "Colección",
        items: [],
        isUngrouped: false
      };

      collections.set(collection, group);
      groups.push(group);
    }

    collections.get(collection).items.push(item);
  });

  if (ungrouped) {
    groups.push(ungrouped);
  }

  return groups;
}

function collectionMeta(group) {
  const total = group.items.length;
  const available = group.items.filter((item) => item.available).length;
  const artworkLabel = total === 1 ? "obra" : "obras";

  if (available === total) {
    return `${total} ${artworkLabel} • todas disponibles`;
  }

  if (available === 0) {
    return `${total} ${artworkLabel} • todas vendidas`;
  }

  return `${total} ${artworkLabel} • ${available} disponibles`;
}

function collectionSectionHTML(group) {
  return `
    <section class="collection-section${group.isUngrouped ? " collection-section--ungrouped" : ""}" data-collection="${group.key}">
      <div class="collection-section__head">
        <div>
          <p class="collection-section__eyebrow">${group.eyebrow}</p>
          <h2 class="collection-section__title">${group.title}</h2>
          <p class="collection-section__meta">${collectionMeta(group)}</p>
        </div>
      </div>

      <div class="collection-section__list expand-list">
        ${group.items.map(cardHTML).join("")}
      </div>
    </section>
  `;
}

function updateResultsInfo(count, groups) {
  if (!resultsText) return;

  if (count === 0) {
    resultsText.textContent = "No se encontraron resultados";
    return;
  }

  const filterSuffix = filter === "pintura"
    ? " de pintura"
    : filter === "ceramica"
      ? " de cerámica"
      : filter === "disponible"
        ? " disponibles"
        : "";

  if (collectionFilter) {
    resultsText.textContent = `Mostrando ${count} ${count === 1 ? "obra" : "obras"}${filterSuffix} de la colección ${collectionFilter}`;
    return;
  }

  const collectionCount = groups.filter((group) => !group.isUngrouped).length;
  const collectionSuffix = collectionCount > 0
    ? ` en ${collectionCount} ${collectionCount === 1 ? "colección" : "colecciones"}`
    : "";

  resultsText.textContent = `Mostrando ${count} ${count === 1 ? "obra" : "obras"}${filterSuffix}${collectionSuffix}`;
}

function render() {
  const didResetCollection = ensureCollectionFilterIsValid();
  if (didResetCollection) {
    syncUrlState();
  }

  renderCollectionFilters();

  const items = getFiltered();
  const groups = groupItemsByCollection(items);
  const hasResults = items.length > 0;

  if (hasResults) {
    grid.innerHTML = groups.map(collectionSectionHTML).join("");
    grid.style.display = "grid";

    if (emptyState) {
      emptyState.style.display = "none";
    }

    setTimeout(() => {
      observeCards();
      revealRequestedArtwork();
    }, 50);
  } else {
    grid.style.display = "none";

    if (emptyState) {
      emptyState.style.display = "flex";
    }
  }

  applyTitle(filter, collectionFilter);
  updateResultsInfo(items.length, groups);
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.filter === filter));
}

function closeAllExcept(id) {
  document.querySelectorAll(".art-card.is-open").forEach((card) => {
    if (card.dataset.id !== id) {
      closeCard(card);
    }
  });
}

function openCard(card, options = {}) {
  const { scroll = true } = options;
  const button = card.querySelector(".art-summary");
  const panel = card.querySelector(".art-panel");

  card.classList.add("is-open");
  button?.setAttribute("aria-expanded", "true");

  if (panel) {
    panel.hidden = false;
  }

  if (scroll) {
    setTimeout(() => {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }
}

function closeCard(card) {
  const button = card.querySelector(".art-summary");
  const panel = card.querySelector(".art-panel");

  card.classList.remove("is-open");
  button?.setAttribute("aria-expanded", "false");

  if (panel) {
    panel.hidden = true;
  }
}

function revealRequestedArtwork() {
  if (!requestedOpenId || requestedOpenHandled) return;

  const targetCard = Array.from(document.querySelectorAll(".art-card")).find(
    (card) => card.dataset.id === requestedOpenId
  );

  if (!targetCard) return;

  closeAllExcept(requestedOpenId);
  openCard(targetCard, { scroll: false });
  targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
  requestedOpenHandled = true;
  syncUrlState();
}

function resetFilters() {
  filter = "all";
  collectionFilter = "";
  requestedOpenId = null;
  requestedOpenHandled = true;

  if (search) search.value = "";
  if (sort) sort.value = "newest";

  syncUrlState();
  render();
}

document.addEventListener("click", (event) => {
  const summaryButton = event.target.closest(".art-summary");
  if (!summaryButton) return;

  const card = summaryButton.closest(".art-card");
  if (!card) return;

  const isOpen = card.classList.contains("is-open");
  closeAllExcept(card.dataset.id);

  if (isOpen) {
    closeCard(card);
  } else {
    openCard(card);
  }
});

tabs.forEach((tab) => tab.addEventListener("click", () => {
  filter = tab.dataset.filter;
  ensureCollectionFilterIsValid();
  requestedOpenId = null;
  requestedOpenHandled = true;
  syncUrlState();
  render();
}));

collectionFilters?.addEventListener("click", (event) => {
  const button = event.target.closest(".collection-filter");
  if (!button) return;

  const nextCollection = normalizeCollectionValue(button.dataset.collection);

  if (sameCollection(nextCollection, collectionFilter)) {
    return;
  }

  collectionFilter = nextCollection;
  requestedOpenId = null;
  requestedOpenHandled = true;
  syncUrlState();
  render();
});

search?.addEventListener("input", () => {
  requestedOpenId = null;
  requestedOpenHandled = true;
  syncUrlState();
  render();
});

sort?.addEventListener("change", () => {
  requestedOpenId = null;
  requestedOpenHandled = true;
  syncUrlState();
  render();
});

resetBtn?.addEventListener("click", resetFilters);

(async function init() {
  applyTitle();

  if (!grid) {
    console.error("No existe #grid en gallery.html");
    return;
  }

  showLoading();

  try {
    const data = await getArtworksData();

    if (!Array.isArray(data)) {
      throw new Error("El archivo artworks.json no contiene un arreglo válido");
    }

    if (data.length === 0) {
      throw new Error("El archivo artworks.json está vacío");
    }

    all = data;
    updateStats();
    render();
  } catch (error) {
    showError(`No se pudo cargar la galería: ${error.message}`);
  }
})();

(function enableSwipeTabs() {
  const swipeArea = document.querySelector(".filters-section") || document.querySelector("#grid");
  if (!swipeArea || !tabs.length) return;

  const order = ["all", "pintura", "ceramica", "disponible"];
  let startX = 0;
  let startY = 0;
  let tracking = false;

  function indexOfFilter(currentFilter) {
    return Math.max(0, order.indexOf(currentFilter));
  }

  swipeArea.addEventListener("touchstart", (event) => {
    if (!event.touches || event.touches.length !== 1) return;

    const target = event.target;
    if (target.closest("input, textarea, select, button")) return;

    tracking = true;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  }, { passive: true });

  swipeArea.addEventListener("touchend", (event) => {
    if (!tracking) return;
    tracking = false;

    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    if (Math.abs(deltaX) < 55) return;

    let nextIndex = indexOfFilter(filter);
    nextIndex = deltaX < 0
      ? Math.min(order.length - 1, nextIndex + 1)
      : Math.max(0, nextIndex - 1);

    filter = order[nextIndex];
    requestedOpenId = null;
    requestedOpenHandled = true;
    syncUrlState();
    render();

    const activeTab = Array.from(tabs).find((tab) => tab.dataset.filter === filter);
    activeTab?.scrollIntoView?.({ behavior: "smooth", inline: "center", block: "nearest" });
  }, { passive: true });
})();

(function enableCardGestures() {
  const root = document.querySelector("#grid");
  if (!root) return;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  function galleryCards() {
    return Array.from(document.querySelectorAll(".art-card"));
  }

  function openByIndex(nextIndex) {
    const cards = galleryCards();
    const clampedIndex = Math.max(0, Math.min(cards.length - 1, nextIndex));
    const card = cards[clampedIndex];
    if (!card) return;

    closeAllExcept(card.dataset.id);
    openCard(card);
  }

  function currentOpenIndex() {
    return galleryCards().findIndex((card) => card.classList.contains("is-open"));
  }

  root.addEventListener("touchstart", (event) => {
    if (event.touches?.length !== 1) return;

    const targetCard = event.target.closest(".art-card");
    if (!targetCard) return;
    if (event.target.closest("a, button, input, textarea, select")) return;

    tracking = true;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  }, { passive: true });

  root.addEventListener("touchend", (event) => {
    if (!tracking) return;
    tracking = false;

    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const openIndex = currentOpenIndex();

    if (openIndex === -1) return;

    if (absY > absX && deltaY < -70) {
      const openCardElement = galleryCards()[openIndex];
      if (openCardElement) {
        closeCard(openCardElement);
      }
      return;
    }

    if (absX > absY && absX > 70) {
      openByIndex(deltaX < 0 ? openIndex + 1 : openIndex - 1);
    }
  }, { passive: true });
})();

function observeCards() {
  const cards = document.querySelectorAll(".art-card:not(.is-visible)");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (!entry.isIntersecting) return;

      setTimeout(() => {
        entry.target.classList.add("is-visible");
      }, index * 100);

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  cards.forEach((card) => observer.observe(card));
}

let lastScroll = 0;
const header = document.querySelector(".header");
const threshold = 10;

window.addEventListener("scroll", () => {
  if (!header) return;

  const currentScroll = window.pageYOffset;

  if (currentScroll <= 0) {
    header.style.transform = "translateY(0)";
    return;
  }

  if (Math.abs(currentScroll - lastScroll) < threshold) return;

  header.style.transform = currentScroll > lastScroll && currentScroll > 150
    ? "translateY(-100%)"
    : "translateY(0)";

  lastScroll = currentScroll;
}, { passive: true });

document.addEventListener("mousemove", (event) => {
  const wrapper = event.target.closest(".panel-image-wrapper");
  if (!wrapper) return;

  const image = wrapper.querySelector(".panel-img");
  if (!image) return;

  const rect = wrapper.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  image.style.transformOrigin = `${x}% ${y}%`;
});

document.addEventListener("mouseout", (event) => {
  const wrapper = event.target.closest(".panel-image-wrapper");
  if (!wrapper) return;

  const image = wrapper.querySelector(".panel-img");
  if (image) {
    image.style.transformOrigin = "center center";
  }
});
})();
