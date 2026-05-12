import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { artworks, fallbackImage, faviconImage } from "./artworks";
import type { Artwork } from "./types";

const SETTINGS = {
  email: "artista@correo.com",
  instagramUrl: "https://www.instagram.com/artedelulu",
  linktreeUrl:
    "https://linktr.ee/lulucardenas?utm_source=linktree_profile_share&ltsid=c105b71a-f330-43ba-a84f-3cb85dae8ddf",
};

const HOME_HERO_IDS = ["p-008", "p-006", "p-011", "p-014", "p-017", "p-015"];
const FEATURED_CURATION_IDS = ["p-018", "p-020", "p-013", "p-008", "p-006", "c-002"];

type GalleryFilter = "all" | "pintura" | "ceramica" | "disponible";
type SortMode = "newest" | "oldest" | "priceAsc" | "priceDesc";
type AppRoute = "customer" | "gallery" | "artist";
type ArtistStatusFilter = "all" | "available" | "sold" | "missingPrice";
type ArtistTypeFilter = "all" | "pintura" | "ceramica";
type AuthRole = "customer" | "artist";

interface UserSession {
  token: string;
  user: {
    name: string;
    email: string;
    role: AuthRole;
  };
}

function App() {
  const path = window.location.pathname.toLowerCase();
  const route = getAppRoute(path);
  const [session, setSession] = useState<UserSession | null>(() => readStoredSession());

  useEffect(() => {
    let icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.type = "image/png";
    icon.href = faviconImage;
  }, []);

  useEffect(() => {
    if (!session) {
      window.localStorage.removeItem("galeria-viva-session");
      return;
    }

    window.localStorage.setItem("galeria-viva-session", JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (!session) return;

    if (session.user.role === "customer" && route === "artist") {
      window.history.replaceState({}, "", "/customer");
    }

    if (session.user.role === "artist" && route === "customer") {
      window.history.replaceState({}, "", "/artist");
    }
  }, [route, session]);

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  const effectiveRoute =
    session.user.role === "artist"
      ? route === "gallery"
        ? "gallery"
        : "artist"
      : route === "gallery"
        ? "gallery"
        : "customer";

  return (
    <>
      <Header activeRoute={effectiveRoute} session={session} onLogout={() => setSession(null)} />
      {effectiveRoute === "artist" ? (
        <ArtistPage />
      ) : effectiveRoute === "gallery" ? (
        <GalleryPage />
      ) : (
        <HomePage />
      )}
      <Footer />
      {effectiveRoute !== "artist" && (
        <a className="ig-float" href={SETTINGS.instagramUrl} target="_blank" rel="noreferrer">
          Mensaje por Instagram
        </a>
      )}
    </>
  );
}

function LoginPage({ onLogin }: { onLogin: (session: UserSession) => void }) {
  const [role, setRole] = useState<AuthRole>("customer");
  const [email, setEmail] = useState("cliente@galeriaviva.local");
  const [password, setPassword] = useState("cliente123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useDocumentMeta("Login - Galeria Viva", "Acceso para cliente o artista en Galeria Viva.");

  function chooseRole(nextRole: AuthRole) {
    setRole(nextRole);
    setError("");

    if (nextRole === "artist") {
      setEmail("artista@galeriaviva.local");
      setPassword("artista123");
      return;
    }

    setEmail("cliente@galeriaviva.local");
    setPassword("cliente123");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const nextSession = await login(role, email, password);
      onLogin(nextSession);
      window.history.replaceState(
        {},
        "",
        nextSession.user.role === "artist" ? "/artist" : "/customer",
      );
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No se pudo iniciar sesion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel__brand">
          <span className="brand__mark" aria-hidden="true">
            <img src={imageForFile("WhatsApp Image 2026-02-16 at 5.12.09 PM.jpeg")} alt="" />
          </span>
          <div>
            <div className="section-badge">Galeria Viva</div>
            <h1 id="login-title">Entrar a la galeria</h1>
            <p>
              Inicia sesion como cliente para explorar obras o como artista para abrir el
              panel editorial.
            </p>
          </div>
        </div>

        <div className="login-role-grid" role="tablist" aria-label="Seleccion de rol">
          <button
            className={`login-role${role === "customer" ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={role === "customer"}
            onClick={() => chooseRole("customer")}
          >
            <strong>Cliente</strong>
            <span>Explorar galeria, colecciones y fichas de obra.</span>
          </button>
          <button
            className={`login-role${role === "artist" ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={role === "artist"}
            onClick={() => chooseRole("artist")}
          >
            <strong>Artista</strong>
            <span>Entrar al inventario y panel editorial.</span>
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={email}
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button className="btn btn--large" type="submit" disabled={loading}>
            {loading ? "Entrando..." : `Entrar como ${role === "artist" ? "artista" : "cliente"}`}
          </button>
        </form>

        <div className="login-demo">
          <strong>Usuarios demo</strong>
          <span>Cliente: cliente@galeriaviva.local / cliente123</span>
          <span>Artista: artista@galeriaviva.local / artista123</span>
        </div>
      </section>
    </main>
  );
}

function Header({
  activeRoute,
  session,
  onLogout,
}: {
  activeRoute: AppRoute;
  session: UserSession;
  onLogout: () => void;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("nav-open", navOpen);
    return () => document.body.classList.remove("nav-open");
  }, [navOpen]);

  useEffect(() => {
    let lastScroll = 0;
    const threshold = 10;

    function onScroll() {
      const currentScroll = window.pageYOffset;

      if (currentScroll <= 0) {
        setHeaderHidden(false);
        return;
      }

      if (Math.abs(currentScroll - lastScroll) < threshold) return;

      setHeaderHidden(currentScroll > lastScroll && currentScroll > 150);
      lastScroll = currentScroll;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setNavOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const headerStyle: CSSProperties = {
    transform: headerHidden ? "translateY(-100%)" : "translateY(0)",
  };

  return (
    <>
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>

      <header className="header" style={headerStyle}>
        <div className="container header__inner">
          <a
            className="brand"
            href={session.user.role === "artist" ? "/artist" : "/customer"}
            aria-label="Inicio"
            onClick={() => setNavOpen(false)}
          >
            <span className="brand__mark" aria-hidden="true">
              <img
                src={imageForFile("WhatsApp Image 2026-02-16 at 5.12.09 PM.jpeg")}
                alt=""
              />
            </span>
            <span className="brand__text">
              <span className="brand__name">Galería Viva</span>
              <span className="brand__sub">Arte emergente</span>
            </span>
          </a>

          <nav
            id="navMenu"
            className={`nav${navOpen ? " is-open" : ""}`}
            aria-label="Navegación principal"
          >
            <button
              className="nav__close"
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setNavOpen(false)}
            >
              x
            </button>
            <p className="nav__eyebrow">Explora el estudio</p>
            <div className="nav__primary">
              {session.user.role === "customer" && (
                <a
                  className={activeRoute === "customer" ? "is-active" : ""}
                  href="/customer"
                  onClick={() => setNavOpen(false)}
                >
                  Cliente
                </a>
              )}
              <details className="nav__dropdown">
                <summary className={`nav__link${activeRoute === "gallery" ? " is-active" : ""}`}>
                  Galería
                </summary>
                <div className="nav__dropdown-menu">
                  <a href="/gallery" onClick={() => setNavOpen(false)}>
                    Ver todo
                  </a>
                  <a href="/gallery?type=pintura" onClick={() => setNavOpen(false)}>
                    Pinturas
                  </a>
                  <a href="/gallery?type=ceramica" onClick={() => setNavOpen(false)}>
                    Cerámicas
                  </a>
                </div>
              </details>
              <a href="/#about" onClick={() => setNavOpen(false)}>
                Acerca
              </a>
              <a href="/#contacto" onClick={() => setNavOpen(false)}>
                Contacto
              </a>
              {session.user.role === "artist" && (
                <a
                  className={activeRoute === "artist" ? "is-active" : ""}
                  href="/artist"
                  onClick={() => setNavOpen(false)}
                >
                  Artista
                </a>
              )}
            </div>
            <div className="nav__actions">
              <span className="session-pill">
                {session.user.role === "artist" ? "Artista" : "Cliente"} · {session.user.name}
              </span>
              <a className="ig-pill ig-pill--solid" href={SETTINGS.instagramUrl} target="_blank" rel="noreferrer">
                Instagram
              </a>
              <button className="ig-pill ig-pill--ghost" type="button" onClick={onLogout}>
                Salir
              </button>
            </div>
          </nav>

          <button
            className="nav__toggle"
            type="button"
            aria-expanded={navOpen}
            aria-controls="navMenu"
            onClick={() => setNavOpen((open) => !open)}
          >
            <span className="sr-only">Abrir menú</span>
            <span className="nav__toggle-box" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </header>

      <button
        className={`nav__backdrop${navOpen ? " is-open" : ""}`}
        id="navBackdrop"
        hidden={!navOpen}
        type="button"
        aria-label="Cerrar navegación"
        onClick={() => setNavOpen(false)}
      />
    </>
  );
}

function HomePage() {
  useDocumentMeta(
    "Galería Viva - Arte emergente",
    "Galería online para artistas emergentes, obras originales, colecciones y comisiones.",
  );

  const heroItems = useMemo(() => pickItemsByIds(artworks, HOME_HERO_IDS), []);
  const featuredItems = useMemo(() => pickItemsByIds(artworks, FEATURED_CURATION_IDS), []);
  const [spotlight, ...secondary] = featuredItems;

  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const subject = encodeURIComponent(`Consulta desde el sitio - ${name}`);
    const body = encodeURIComponent(
      `Nombre: ${name}\nCorreo electrónico: ${email}\n\nMensaje:\n${message}`,
    );

    window.location.href = `mailto:${SETTINGS.email}?subject=${subject}&body=${body}`;
  }

  return (
    <main id="contenido">
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__text">
            <h1>Galería Viva para arte emergente</h1>
            <p className="lead">
              Explora obras originales, colecciones y fichas de artista en una experiencia
              visual creada para exhibir talento emergente desde Cloudflare Pages.
            </p>

            <div className="cta">
              <a className="btn" href="/gallery?type=pintura">
                Explorar pinturas
              </a>
              <a className="btn btn--ghost" href="/gallery?type=ceramica">
                Ver cerámicas
              </a>
            </div>

            <div className="meta">
              <span>Zapopan, México</span>
              <span>•</span>
              <span>Comisiones abiertas</span>
            </div>
          </div>

          <div className="hero__media">
            <HeroCarousel items={heroItems} />
          </div>
        </div>
      </section>

      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            <Stat number="50+" label="Obras Creadas" />
            <Stat number="2" label="Disciplinas" />
            <Stat number="100%" label="Piezas Únicas" />
            <Stat number="MX" label="Hecho en México" />
          </div>
        </div>
      </section>

      <section id="about" className="section">
        <div className="container about-rework">
          <div className="about-rework__intro">
            <div className="section-badge">Perfil de artista</div>
            <h2>Lulú Cárdenas</h2>
            <p>
              Soy una artista mexicana. Expreso mis sentidos, emociones y sentimientos por
              medio del arte. En cada pieza comparto un pedacito de mi alma.
            </p>
            <p>
              Transformo la arcilla con mis manos y dejo en ella un poco de mi esencia para
              convertirla en objetos útiles o adornos llenos de vida e historia propia.
            </p>
          </div>

          <div className="about-rework__grid" aria-label="Valores de la obra">
            <InfoCard title="Obra original">
              Cada pieza es única y creada a mano, sin reproducciones.
            </InfoCard>
            <InfoCard title="Técnica mixta">
              Pintura y cerámica se combinan con un proceso sensible y personal.
            </InfoCard>
            <InfoCard title="Comisiones abiertas">
              Desarrollo piezas personalizadas según tu espacio e intención.
            </InfoCard>
          </div>

          <div className="about-rework__chips chips">
            <span className="chip">Obras originales</span>
            <span className="chip">Piezas únicas</span>
            <span className="chip">Envíos nacionales</span>
            <span className="chip">Comisiones personalizadas</span>
          </div>

          <div className="about-rework__cta cta">
            <a className="btn" href="/gallery">
              Ver portafolio completo
            </a>
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <div className="section-header-center">
            <div className="section-badge section-badge--light">Mi Proceso</div>
            <h2 style={{ color: "#fff", marginTop: 12 }}>De la idea a la pieza final</h2>
            <p
              className="lead"
              style={{ color: "rgba(255,255,255,0.7)", maxWidth: 600, margin: "12px auto 0" }}
            >
              Cada obra pasa por un proceso cuidadoso que combina técnica, intuición y
              experimentación.
            </p>
          </div>

          <div className="process-grid">
            <ProcessCard number="01" title="Inspiración">
              Observación de la naturaleza, texturas urbanas y emociones cotidianas.
            </ProcessCard>
            <ProcessCard number="02" title="Boceto">
              Exploración de composiciones, paletas de color y formas iniciales.
            </ProcessCard>
            <ProcessCard number="03" title="Creación">
              Trabajo manual con acrílicos, óleos, arcilla y esmaltes cerámicos.
            </ProcessCard>
            <ProcessCard number="04" title="Acabado">
              Detalles finales, horneado cerámico y preparación para exhibición.
            </ProcessCard>
          </div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="featured-head">
            <div className="featured-head__content">
              <div className="section-badge">Obras Destacadas</div>
              <h2>Piezas Recientes</h2>
              <p className="lead">
                Una selección curada de obras con gran presencia visual, formatos sólidos y
                piezas ideales para explorar el universo del estudio.
              </p>
            </div>
          </div>

          {spotlight && (
            <div className="featured-curation">
              <FeaturedSpotlight item={spotlight} />
              <div className="featured-curation__stack">
                {secondary.map((item) => (
                  <FeaturedCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          <div className="featured-footer">
            <p>
              Cada pieza está hecha a mano y disponible para consulta directa, compra o
              desarrollo de una comisión relacionada.
            </p>
            <a className="btn btn--large" href="/gallery">
              Ver Galería Completa
            </a>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="section-header-center">
            <div className="section-badge">Testimonios</div>
            <h2 style={{ marginTop: 12 }}>Lo que dicen los coleccionistas</h2>
          </div>

          <div className="testimonials-grid">
            <TestimonialCard author="Daniela Fernández" role="Coleccionista, GDL">
              "La pieza que compré superó mis expectativas. El uso del color es magistral y
              la calidad impecable. Definitivamente compraré más obras."
            </TestimonialCard>
            <TestimonialCard author="Marina Fernández" role="Cliente, Guadalajara">
              "Las cerámicas tienen una energía especial. Se nota el amor y cuidado en cada
              detalle. Una compra que atesoro."
            </TestimonialCard>
            <TestimonialCard author="Eduardo Fernández" role="Comisión personalizada">
              "Trabajar con Lulú en una comisión fue un placer. Entendió perfectamente lo
              que buscaba y el resultado es hermoso."
            </TestimonialCard>
          </div>
        </div>
      </section>

      <section id="contacto" className="section section--dark">
        <div className="container">
          <div className="section-header-center">
            <div className="section-badge section-badge--light">Hablemos</div>
            <h2 style={{ color: "#fff", marginTop: 12 }}>¿Te interesa una obra?</h2>
            <p
              className="lead"
              style={{
                color: "rgba(255,255,255,0.7)",
                maxWidth: 600,
                margin: "12px auto 32px",
              }}
            >
              Contáctame para compras, comisiones personalizadas o colaboraciones artísticas.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-methods">
                <ContactMethod icon="@" title="Correo" href={`mailto:${SETTINGS.email}`}>
                  {SETTINGS.email}
                </ContactMethod>
                <ContactMethod icon="IG" title="Instagram" href={SETTINGS.instagramUrl} external>
                  @artedelulu
                </ContactMethod>
                <ContactMethod icon="LT" title="Linktree" href={SETTINGS.linktreeUrl} external>
                  Todos mis enlaces
                </ContactMethod>
              </div>

              <div className="contact-cta">
                <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 16 }}>
                  ¿Prefieres enviar un mensaje directo?
                </p>
                <a className="btn btn--light btn--large" href={`mailto:${SETTINGS.email}?subject=Consulta%20de%20obra`}>
                  Enviar correo
                </a>
              </div>
            </div>

            <div className="contact-form-wrapper">
              <div className="card card--dark">
                <h3 style={{ color: "#fff" }}>Envía un mensaje</h3>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 8 }}>
                  Te responderé en menos de 24 horas.
                </p>

                <form id="contactForm" onSubmit={handleContactSubmit}>
                  <label className="sr-only" htmlFor="name">
                    Nombre
                  </label>
                  <input id="name" name="name" type="text" placeholder="Nombre" required />

                  <label className="sr-only" htmlFor="emailC">
                    Correo electrónico
                  </label>
                  <input id="emailC" name="email" type="email" placeholder="Correo electrónico" required />

                  <label className="sr-only" htmlFor="msg">
                    Mensaje
                  </label>
                  <textarea
                    id="msg"
                    name="message"
                    placeholder="Cuéntame qué pieza te interesa o qué tipo de comisión buscas..."
                    rows={5}
                    required
                  />

                  <button className="btn btn--light" type="submit">
                    Enviar mensaje
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function GalleryPage() {
  useDocumentMeta("Galería Viva - Colecciones", "Galería de pinturas y cerámicas originales.");

  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [filter, setFilter] = useState<GalleryFilter>(() => parseFilter(initialParams.get("type")));
  const [collectionFilter, setCollectionFilter] = useState(() =>
    normalizeCollectionValue(initialParams.get("collection")),
  );
  const [requestedOpenId, setRequestedOpenId] = useState<string | null>(() => initialParams.get("open"));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");

  const primaryItems = useMemo(() => getPrimaryFilteredItems(artworks, filter), [filter]);
  const collectionOptions = useMemo(() => getCollectionOptions(primaryItems), [primaryItems]);

  useEffect(() => {
    if (!collectionFilter) return;
    const isValid = collectionOptions.some((option) => sameCollection(option.name, collectionFilter));
    if (!isValid) setCollectionFilter("");
  }, [collectionFilter, collectionOptions]);

  const filteredItems = useMemo(() => {
    let items = [...primaryItems];
    const query = search.trim().toLowerCase();

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
          getCollectionName(item),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }

    return sortItems(items, sort);
  }, [collectionFilter, primaryItems, search, sort]);

  const groups = useMemo(() => groupItemsByCollection(filteredItems), [filteredItems]);
  const galleryCopy = getFilterCopy(filter, collectionFilter);
  const availableCount = artworks.filter((item) => item.available).length;

  useEffect(() => {
    const params = new URLSearchParams();

    if (filter === "pintura" || filter === "ceramica") {
      params.set("type", filter);
    }

    if (collectionFilter) {
      params.set("collection", collectionFilter);
    }

    if (requestedOpenId) {
      params.set("open", requestedOpenId);
    }

    const query = params.toString();
    const nextUrl = query ? `/gallery?${query}` : "/gallery";
    window.history.replaceState({}, "", nextUrl);
  }, [collectionFilter, filter, requestedOpenId]);

  useEffect(() => {
    if (!requestedOpenId) return;

    const existsInResults = filteredItems.some((item) => item.id === requestedOpenId);
    if (!existsInResults) return;

    setExpandedId(requestedOpenId);
    window.setTimeout(() => {
      document.querySelector(`[data-artwork-id="${requestedOpenId}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
    setRequestedOpenId(null);
  }, [filteredItems, requestedOpenId]);

  function changeFilter(nextFilter: GalleryFilter) {
    setFilter(nextFilter);
    setRequestedOpenId(null);
  }

  function resetFilters() {
    setFilter("all");
    setCollectionFilter("");
    setRequestedOpenId(null);
    setExpandedId(null);
    setSearch("");
    setSort("newest");
  }

  return (
    <main id="contenido" className="section">
      <div className="container">
        <div className="gallery-hero">
          <div className="gallery-hero__content">
            <div className="section-badge">{galleryCopy.badge}</div>
            <h1>{galleryCopy.title}</h1>
            <p className="lead">{galleryCopy.desc}</p>
            <div className="gallery-stats">
              <GalleryStat number={artworks.length} label="Obras totales" />
              <GalleryStat number={availableCount} label="Disponibles" />
            </div>
          </div>
          <div className="gallery-hero__actions">
            <a className="btn" href="/#contacto">
              Solicitar comisión
            </a>
            <a className="btn btn--ghost" href="/#contacto">
              Contactar
            </a>
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-header">
            <h2>Filtrar obras</h2>
            <button className="btn btn--ghost btn--small" type="button" onClick={resetFilters}>
              Limpiar filtros
            </button>
          </div>

          <div className="tabs" role="tablist" aria-label="Filtros de galería">
            {[
              ["all", "Todo"],
              ["pintura", "Pinturas"],
              ["ceramica", "Cerámicas"],
              ["disponible", "Disponibles"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`tab${filter === value ? " is-active" : ""}`}
                type="button"
                role="tab"
                aria-selected={filter === value}
                onClick={() => changeFilter(value as GalleryFilter)}
              >
                {label}
              </button>
            ))}
          </div>

          {collectionOptions.length > 0 && (
            <div className="collection-filter-bar">
              <div className="collection-filter-bar__head">
                <div>
                  <p className="collection-filter-bar__eyebrow">Colecciones</p>
                  <p className="collection-filter-bar__hint">
                    Filtra series completas y combina este filtro con tipo, disponibilidad o búsqueda.
                  </p>
                </div>
              </div>
              <div className="collection-filters" aria-label="Filtros por colección">
                <CollectionButton
                  active={!collectionFilter}
                  count={primaryItems.length}
                  label="Todas las colecciones"
                  onClick={() => setCollectionFilter("")}
                />
                {collectionOptions.map((option) => (
                  <CollectionButton
                    key={option.name}
                    active={sameCollection(option.name, collectionFilter)}
                    count={option.count}
                    label={option.name}
                    onClick={() => setCollectionFilter(option.name)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="toolbar">
            <div className="search-wrapper">
              <input
                className="search"
                type="search"
                value={search}
                placeholder="Buscar por obra, colección, año o técnica..."
                aria-label="Buscar obras"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="select"
              value={sort}
              aria-label="Ordenar"
              onChange={(event) => setSort(event.target.value as SortMode)}
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="priceAsc">Precio: menor a mayor</option>
              <option value="priceDesc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>

        <div className="results-info">
          <p>{resultsLabel(filteredItems.length, groups, filter, collectionFilter)}</p>
        </div>

        {filteredItems.length > 0 ? (
          <div id="grid" className="expand-list">
            {groups.map((group) => (
              <CollectionSection
                key={group.key}
                group={group}
                expandedId={expandedId}
                onToggle={(id) => setExpandedId((current) => (current === id ? null : id))}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No se encontraron resultados</h3>
            <p>Intenta ajustar tus filtros o términos de búsqueda.</p>
            <button className="btn" type="button" onClick={resetFilters}>
              Limpiar filtros
            </button>
          </div>
        )}

        <div className="gallery-cta">
          <div className="gallery-cta__content">
            <h2>¿No encuentras lo que buscas?</h2>
            <p className="lead">
              Acepto comisiones personalizadas. Cuéntame tu idea y trabajemos en conjunto
              para crear la pieza ideal para ti.
            </p>
            <div className="cta">
              <a className="btn btn--large" href="/#contacto">
                Solicitar comisión
              </a>
              <a className="btn btn--ghost btn--large" href="/">
                Volver al inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ArtistPage() {
  useDocumentMeta(
    "Galería Viva - Vista artista",
    "Panel de artista para revisar inventario, disponibilidad y detalles de obras.",
  );

  const [items, setItems] = useState<Artwork[]>(() => artworks.map((item) => ({ ...item })));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArtistStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<ArtistTypeFilter>("all");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");

  const collections = useMemo(
    () =>
      Array.from(new Set(items.map(getCollectionName).filter(Boolean))).sort((left, right) =>
        left.localeCompare(right, "es"),
      ),
    [items],
  );

  const artistStats = useMemo(() => {
    const available = items.filter((item) => item.available).length;
    const sold = items.length - available;
    const missingPrice = items.filter((item) => item.price === null).length;
    const inventoryValue = items.reduce((total, item) => total + (item.available ? item.price ?? 0 : 0), 0);

    return {
      total: items.length,
      available,
      sold,
      missingPrice,
      inventoryValue,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter === "available" && !item.available) return false;
      if (statusFilter === "sold" && item.available) return false;
      if (statusFilter === "missingPrice" && item.price !== null) return false;

      if (!normalizedQuery) return true;

      return [
        item.title,
        item.medium,
        String(item.year ?? ""),
        item.size,
        item.type,
        getCollectionName(item),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [items, query, statusFilter, typeFilter]);

  const selectedItem =
    items.find((item) => item.id === selectedId) ?? filteredItems[0] ?? items[0] ?? null;

  useEffect(() => {
    if (!selectedItem) return;
    if (selectedItem.id !== selectedId) setSelectedId(selectedItem.id);
  }, [selectedId, selectedItem]);

  function updateArtwork<K extends keyof Artwork>(id: string, key: K, value: Artwork[K]) {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  }

  function toggleAvailability(id: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item,
      ),
    );
  }

  return (
    <main id="contenido" className="artist-shell">
      <section className="artist-hero">
        <div className="container artist-hero__inner">
          <div>
            <div className="section-badge">Vista artista</div>
            <h1>Panel editorial</h1>
            <p className="lead">
              Controla el catálogo versionado, revisa disponibilidad y prepara las obras que
              verá el cliente en la galería pública.
            </p>
          </div>
          <div className="artist-hero__actions">
            <a className="btn" href="/customer">
              Ver como cliente
            </a>
            <a className="btn btn--ghost" href="/gallery">
              Abrir galería
            </a>
          </div>
        </div>
      </section>

      <section className="container artist-summary-grid" aria-label="Resumen de inventario">
        <ArtistStatCard label="Obras" value={artistStats.total} />
        <ArtistStatCard label="Disponibles" value={artistStats.available} />
        <ArtistStatCard label="Vendidas" value={artistStats.sold} />
        <ArtistStatCard label="Sin precio" value={artistStats.missingPrice} />
        <ArtistStatCard
          label="Valor disponible"
          value={`$${artistStats.inventoryValue.toLocaleString("es-MX")}`}
        />
      </section>

      <section className="container artist-workspace">
        <div className="artist-panel artist-panel--wide">
          <div className="artist-panel__head">
            <div>
              <div className="section-badge">Inventario</div>
              <h2>Obras del catálogo</h2>
            </div>
            <span className="artist-count">{filteredItems.length} visibles</span>
          </div>

          <div className="artist-controls">
            <input
              className="search"
              type="search"
              value={query}
              placeholder="Buscar por obra, colección, año o técnica"
              aria-label="Buscar en inventario"
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="select"
              value={typeFilter}
              aria-label="Filtrar por tipo"
              onChange={(event) => setTypeFilter(event.target.value as ArtistTypeFilter)}
            >
              <option value="all">Todos los tipos</option>
              <option value="pintura">Pinturas</option>
              <option value="ceramica">Cerámicas</option>
            </select>
            <select
              className="select"
              value={statusFilter}
              aria-label="Filtrar por estado"
              onChange={(event) => setStatusFilter(event.target.value as ArtistStatusFilter)}
            >
              <option value="all">Todos los estados</option>
              <option value="available">Disponibles</option>
              <option value="sold">Vendidas</option>
              <option value="missingPrice">Sin precio</option>
            </select>
          </div>

          <div className="artist-list" role="list" aria-label="Obras filtradas">
            {filteredItems.map((item) => (
              <ArtistArtworkRow
                key={item.id}
                item={item}
                selected={selectedItem?.id === item.id}
                onSelect={() => setSelectedId(item.id)}
                onToggleAvailability={() => toggleAvailability(item.id)}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="empty-state artist-empty">
                <h3>No hay obras con esos filtros</h3>
                <p>Ajusta la búsqueda o limpia los filtros para volver al inventario completo.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="artist-panel">
          <div className="artist-panel__head">
            <div>
              <div className="section-badge">Ficha de obra</div>
              <h2>Detalle editable</h2>
            </div>
          </div>

          {selectedItem && (
            <div className="artist-editor">
              <img
                className="artist-editor__image"
                src={selectedItem.image}
                alt={selectedItem.title}
                loading="lazy"
              />

              <label>
                Título
                <input
                  value={selectedItem.title}
                  onChange={(event) => updateArtwork(selectedItem.id, "title", event.target.value)}
                />
              </label>

              <div className="artist-editor__grid">
                <label>
                  Tipo
                  <select
                    value={selectedItem.type}
                    onChange={(event) =>
                      updateArtwork(selectedItem.id, "type", event.target.value as Artwork["type"])
                    }
                  >
                    <option value="pintura">Pintura</option>
                    <option value="ceramica">Cerámica</option>
                  </select>
                </label>

                <label>
                  Año
                  <input
                    type="number"
                    value={selectedItem.year ?? ""}
                    onChange={(event) =>
                      updateArtwork(
                        selectedItem.id,
                        "year",
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                  />
                </label>
              </div>

              <label>
                Colección
                <input
                  list="artist-collections"
                  value={getCollectionName(selectedItem)}
                  onChange={(event) =>
                    updateArtwork(
                      selectedItem.id,
                      "collection",
                      event.target.value.trim() || undefined,
                    )
                  }
                />
              </label>
              <datalist id="artist-collections">
                {collections.map((collection) => (
                  <option key={collection} value={collection} />
                ))}
              </datalist>

              <label>
                Técnica
                <input
                  value={selectedItem.medium}
                  onChange={(event) => updateArtwork(selectedItem.id, "medium", event.target.value)}
                />
              </label>

              <div className="artist-editor__grid">
                <label>
                  Dimensiones
                  <input
                    value={selectedItem.size}
                    onChange={(event) => updateArtwork(selectedItem.id, "size", event.target.value)}
                  />
                </label>

                <label>
                  Precio MXN
                  <input
                    type="number"
                    min="0"
                    value={selectedItem.price ?? ""}
                    onChange={(event) =>
                      updateArtwork(
                        selectedItem.id,
                        "price",
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                  />
                </label>
              </div>

              <label>
                Descripción
                <textarea
                  rows={5}
                  value={selectedItem.description}
                  onChange={(event) =>
                    updateArtwork(selectedItem.id, "description", event.target.value)
                  }
                />
              </label>

              <label className="artist-checkbox">
                <input
                  type="checkbox"
                  checked={selectedItem.available}
                  onChange={() => toggleAvailability(selectedItem.id)}
                />
                Disponible para venta
              </label>

              <div className="artist-editor__actions">
                <a className="btn btn--ghost" href={`/gallery?open=${encodeURIComponent(selectedItem.id)}`}>
                  Vista cliente
                </a>
                <button className="btn" type="button" onClick={() => toggleAvailability(selectedItem.id)}>
                  {selectedItem.available ? "Marcar vendida" : "Marcar disponible"}
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>

      <section className="container artist-flow" aria-label="Flujo editorial">
        <div className="artist-panel artist-panel--flow">
          <div className="artist-panel__head">
            <div>
              <div className="section-badge">Flujo editorial</div>
              <h2>Del catálogo al deploy</h2>
            </div>
          </div>

          <div className="artist-flow__grid">
            <ProcessCard number="01" title="Contenido">
              Obras, artistas y colecciones se mantienen como contenido versionado.
            </ProcessCard>
            <ProcessCard number="02" title="Validación">
              El build revisa TypeScript y prepara la versión lista para publicación.
            </ProcessCard>
            <ProcessCard number="03" title="Commit">
              Los cambios se suben a GitHub en ramas de contenido o funcionalidad.
            </ProcessCard>
            <ProcessCard number="04" title="Cloudflare">
              Pages reconstruye y publica la galería en el edge desde la rama principal.
            </ProcessCard>
          </div>
        </div>
      </section>
    </main>
  );
}

function ArtistStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="artist-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ArtistArtworkRow({
  item,
  selected,
  onSelect,
  onToggleAvailability,
}: {
  item: Artwork;
  selected: boolean;
  onSelect: () => void;
  onToggleAvailability: () => void;
}) {
  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      className={`artist-row${selected ? " is-selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <img src={item.image} alt="" loading="lazy" />
      <div className="artist-row__main">
        <strong>{item.title}</strong>
        <span>
          {artworkTypeLabel(item)} · {getCollectionName(item) || "Sin colección"}
        </span>
      </div>
      <div className="artist-row__meta">
        <span>{safePrice(item)}</span>
        <StatusPill item={item} />
      </div>
      <button
        className="artist-mini-action"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleAvailability();
        }}
      >
        {item.available ? "Vender" : "Reactivar"}
      </button>
    </div>
  );
}

function HeroCarousel({ items }: { items: Artwork[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrent((index) => (index + 1) % items.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [items.length]);

  function show(index: number) {
    setCurrent((index + items.length) % items.length);
  }

  return (
    <section className="hero-carousel" aria-label="Carrusel de obras destacadas">
      <div className="hero-carousel__track" aria-live="polite">
        {items.map((item, index) => (
          <article
            key={item.id}
            className={`hero-carousel__slide${index === current ? " is-active" : ""}`}
          >
            <img src={item.image} alt={item.title} loading={index === 0 ? "eager" : "lazy"} />
            <div className="hero-carousel__caption">
              <strong>{item.title}</strong>
              <span>
                {artworkTypeLabel(item)}
                {item.year ? ` · ${item.year}` : ""}
              </span>
            </div>
          </article>
        ))}
      </div>
      <button
        className="hero-carousel__btn hero-carousel__btn--prev"
        type="button"
        aria-label="Obra anterior"
        onClick={() => show(current - 1)}
      >
        ‹
      </button>
      <button
        className="hero-carousel__btn hero-carousel__btn--next"
        type="button"
        aria-label="Siguiente obra"
        onClick={() => show(current + 1)}
      >
        ›
      </button>
      <div className="hero-carousel__dots" aria-label="Seleccionar obra">
        {items.map((item, index) => (
          <button
            key={item.id}
            className={`hero-carousel__dot${index === current ? " is-active" : ""}`}
            type="button"
            aria-label={`Ir a obra ${index + 1}`}
            onClick={() => show(index)}
          />
        ))}
      </div>
    </section>
  );
}

function FeaturedSpotlight({ item }: { item: Artwork }) {
  const collection = getCollectionName(item);
  const meta = [item.year, item.medium, item.size].filter(Boolean).join(" • ");

  return (
    <a className="featured-spotlight" href={`/gallery?open=${encodeURIComponent(item.id)}`}>
      <div className="featured-spotlight__media">
        <img src={item.image} alt={item.title} loading="eager" />
      </div>
      <div className="featured-spotlight__content">
        <div className="featured-spotlight__chips">
          <AvailabilityBadge item={item} />
          <span className="featured-chip">{artworkTypeLabel(item)}</span>
          {collection && <span className="featured-chip featured-chip--soft">{collection}</span>}
        </div>
        <div className="featured-spotlight__copy">
          <span className="featured-kicker">Obra protagonista</span>
          <h3>{item.title}</h3>
          <p>{artworkDescription(item)}</p>
        </div>
        {meta && <p className="featured-spotlight__meta">{meta}</p>}
        <span className="featured-spotlight__cta">Ver detalle completo</span>
      </div>
    </a>
  );
}

function FeaturedCard({ item }: { item: Artwork }) {
  const collection = getCollectionName(item);
  const meta = [item.year, artworkTypeLabel(item)].filter(Boolean).join(" • ");

  return (
    <a className="featured-card" href={`/gallery?open=${encodeURIComponent(item.id)}`}>
      <div className="featured-card__media">
        <img className="featured-card__img" src={item.image} alt={item.title} loading="lazy" />
      </div>
      <div className="featured-card__body">
        <div className="featured-card__top">
          <span className="featured-card__meta">{meta}</span>
          <AvailabilityBadge item={item} />
        </div>
        <h3 className="featured-card__title">{item.title}</h3>
        {collection && <p className="featured-card__collection">{collection}</p>}
      </div>
    </a>
  );
}

function CollectionSection({
  group,
  expandedId,
  onToggle,
}: {
  group: CollectionGroup;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <section
      className={`collection-section${group.isUngrouped ? " collection-section--ungrouped" : ""}`}
      data-collection={group.key}
    >
      <div className="collection-section__head">
        <div>
          <p className="collection-section__eyebrow">{group.eyebrow}</p>
          <h2 className="collection-section__title">{group.title}</h2>
          <p className="collection-section__meta">{collectionMeta(group)}</p>
        </div>
      </div>

      <div className="collection-section__list expand-list">
        {group.items.map((item) => (
          <ArtworkCard
            key={item.id}
            item={item}
            isOpen={expandedId === item.id}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ArtworkCard({ item, isOpen, onToggle }: { item: Artwork; isOpen: boolean; onToggle: () => void }) {
  const panelImageRef = useRef<HTMLImageElement>(null);
  const collection = getCollectionName(item);
  const subtitle = [item.year ? String(item.year) : "", item.medium, item.size].filter(Boolean).join(" • ");
  const typeLabel = artworkTypeLabel(item);
  const shippingNotice =
    item.type === "pintura"
      ? "Nota: Esta obra se entrega sin marco para facilitar su envío y permitir que elijas el que mejor combine con tu espacio."
      : "Nota: La pieza de cerámica no incluye los accesorios o la decoración mostrados en las fotografías.";

  function handleImageMove(event: MouseEvent<HTMLDivElement>) {
    if (!panelImageRef.current) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    panelImageRef.current.style.transformOrigin = `${x}% ${y}%`;
  }

  function resetImageOrigin() {
    if (panelImageRef.current) {
      panelImageRef.current.style.transformOrigin = "center center";
    }
  }

  return (
    <article
      className={`art-card is-visible${isOpen ? " is-open" : ""}`}
      data-artwork-id={item.id}
      data-id={item.id}
    >
      <button className="art-summary" type="button" aria-expanded={isOpen} onClick={onToggle}>
        <img
          className="art-thumb"
          src={item.image}
          alt={item.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />

        <div className="art-main">
          <div className="art-meta-row">
            <span className="art-type">{typeLabel}</span>
            {collection && <span className="art-collection">{collection}</span>}
          </div>
          <h3 className="art-title">{item.title}</h3>
          <p className="art-sub">{subtitle}</p>
        </div>

        <div className="art-status">
          <StatusPill item={item} />
          <span className="art-chevron">⌄</span>
        </div>
      </button>

      <div className="art-panel">
        <div className="panel-grid">
          <div
            className="panel-image-wrapper"
            onMouseMove={handleImageMove}
            onMouseLeave={resetImageOrigin}
          >
            <img
              ref={panelImageRef}
              className="panel-img"
              src={item.image}
              alt={item.title}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = fallbackImage;
              }}
            />
          </div>

          <div className="panel-info">
            <div className="panel-header">
              <h3 style={{ margin: "0 0 8px", fontSize: 24 }}>{item.title}</h3>
              <StatusPill item={item} />
            </div>

            <div className="panel-details">
              <DetailRow label="Tipo" value={typeLabel} />
              {collection && <DetailRow label="Colección" value={collection} />}
              {item.year && <DetailRow label="Año" value={String(item.year)} />}
              {item.medium && <DetailRow label="Técnica" value={item.medium} />}
              {item.size && <DetailRow label="Dimensiones" value={item.size} />}
              <div className="detail-row detail-row--highlight">
                <span className="detail-label">Precio</span>
                <span className="detail-value" style={{ fontWeight: 700, fontSize: 18 }}>
                  {safePrice(item)}
                </span>
              </div>
            </div>

            {item.description && (
              <div className="panel-description">
                <strong>Descripción</strong>
                <p>{item.description}</p>
              </div>
            )}

            <div
              className="panel-notice"
              style={{
                margin: "16px 0",
                padding: 14,
                background: "var(--primary-soft)",
                borderRadius: 12,
                border: "1px solid rgba(200, 16, 46, 0.1)",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 20 }}>!</span>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "var(--primary-dark)",
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {shippingNotice}
              </p>
            </div>

            <div className="panel-actions">
              <a className="btn btn--large" href="/#contacto">
                Preguntar por esta pieza
              </a>
            </div>

            <small className="fineprint" style={{ display: "block", marginTop: 12, color: "var(--muted)", fontSize: 12 }}>
              Escríbeme por Instagram o correo para más información sobre esta obra.
            </small>
          </div>
        </div>
      </div>
    </article>
  );
}

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer-brand">
            <strong>Galería Viva</strong>
            <small>Arte emergente desde Zapopan, México</small>
        </div>
        <div className="footer__links">
          <a href="/customer">Cliente</a>
          <a href="/gallery?type=pintura">Pinturas</a>
          <a href="/gallery?type=ceramica">Cerámicas</a>
          <a href="/artist">Artista</a>
          <a href="/#contacto">Contacto</a>
          <a href={SETTINGS.instagramUrl} target="_blank" rel="noreferrer">
            Instagram ↗
          </a>
          <a href={SETTINGS.linktreeUrl} target="_blank" rel="noreferrer">
            Linktree ↗
          </a>
        </div>
      </div>
      <div className="container" style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 16 }}>
        <small style={{ display: "block", textAlign: "center", color: "var(--muted)" }}>
          © {year} Galería Viva. Todos los derechos reservados.
        </small>
      </div>
    </footer>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="stat">
      <div className="stat__number">{number}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function GalleryStat({ number, label }: { number: number; label: string }) {
  return (
    <div className="gallery-stat">
      <span className="gallery-stat__number">{number}</span>
      <span className="gallery-stat__label">{label}</span>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: string }) {
  return (
    <div className="about-rework__card">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function ProcessCard({ number, title, children }: { number: string; title: string; children: string }) {
  return (
    <div className="process-card">
      <div className="process-number">{number}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function TestimonialCard({ author, role, children }: { author: string; role: string; children: string }) {
  return (
    <div className="testimonial-card">
      <div className="testimonial-stars">★★★★★</div>
      <p className="testimonial-text">{children}</p>
      <div className="testimonial-author">
        <strong>{author}</strong>
        <span>{role}</span>
      </div>
    </div>
  );
}

function ContactMethod({
  icon,
  title,
  href,
  external = false,
  children,
}: {
  icon: string;
  title: string;
  href: string;
  external?: boolean;
  children: string;
}) {
  return (
    <a
      href={href}
      className="contact-method"
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      <div className="contact-icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{children}</span>
      </div>
    </a>
  );
}

function CollectionButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`collection-filter${active ? " is-active" : ""}`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="collection-filter__count">{count}</span>
    </button>
  );
}

function AvailabilityBadge({ item }: { item: Artwork }) {
  return (
    <span className={`badge ${item.available ? "badge--available" : "badge--sold"}`}>
      {item.available ? "Disponible" : "Vendida"}
    </span>
  );
}

function StatusPill({ item }: { item: Artwork }) {
  return (
    <span className={`status-pill ${item.available ? "available" : "sold"}`}>
      {item.available ? "Disponible" : "Vendida"}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector<HTMLMetaElement>("meta[name='description']");
    if (meta) meta.content = description;
  }, [description, title]);
}

function imageForFile(fileName: string) {
  return artworks.find((item) => item.image.includes(fileName))?.image ?? faviconImage;
}

function pickItemsByIds(data: Artwork[], ids: string[]) {
  const byId = new Map(data.map((item) => [item.id, item]));
  const selected = ids.map((id) => byId.get(id)).filter(Boolean) as Artwork[];
  return selected.length ? selected : data.slice(0, 6);
}

function artworkTypeLabel(item: Artwork) {
  return item.type === "ceramica" ? "Cerámica" : "Pintura";
}

function getCollectionName(item: Artwork) {
  return typeof item.collection === "string" ? item.collection.trim() : "";
}

function normalizeCollectionValue(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function sameCollection(left: string, right: string) {
  return normalizeCollectionValue(left).toLowerCase() === normalizeCollectionValue(right).toLowerCase();
}

function artworkDescription(item: Artwork) {
  const description = (item.description || "").trim();

  if (!description || /descripci[oó]n pendiente/i.test(description)) {
    const collection = getCollectionName(item);
    return collection
      ? `Parte de la colección ${collection}, una serie de piezas originales donde color, gesto y fauna dialogan entre sí.`
      : "Obra original creada a mano, disponible para consulta, compra o desarrollo de una comisión relacionada.";
  }

  return description.length > 175 ? `${description.slice(0, 175).trim()}...` : description;
}

function parseFilter(value: string | null): GalleryFilter {
  if (value === "pintura" || value === "ceramica" || value === "disponible") return value;
  return "all";
}

function getPrimaryFilteredItems(source: Artwork[], activeFilter: GalleryFilter) {
  if (activeFilter === "pintura" || activeFilter === "ceramica") {
    return source.filter((item) => item.type === activeFilter);
  }

  if (activeFilter === "disponible") {
    return source.filter((item) => item.available);
  }

  return [...source];
}

function getCollectionOptions(source: Artwork[]) {
  const collections = new Map<string, { name: string; count: number }>();

  source.forEach((item) => {
    const collection = getCollectionName(item);
    if (!collection) return;

    const option = collections.get(collection) ?? { name: collection, count: 0 };
    option.count += 1;
    collections.set(collection, option);
  });

  return Array.from(collections.values());
}

function getFilterCopy(activeFilter: GalleryFilter, activeCollection: string) {
  if (activeCollection) {
    return {
      badge: "Colección seleccionada",
      title: activeCollection,
      desc: "Explora esta serie y combina el filtro por colección con tipo, disponibilidad o búsqueda para encontrar la pieza exacta.",
    };
  }

  if (activeFilter === "pintura") {
    return {
      badge: "Colecciones de pintura",
      title: "Pinturas originales",
      desc: "Explora las pinturas organizadas por colección para descubrir series completas y piezas relacionadas.",
    };
  }

  if (activeFilter === "ceramica") {
    return {
      badge: "Colecciones de cerámica",
      title: "Cerámicas artesanales",
      desc: "Descubre piezas cerámicas únicas hechas a mano y revisa cada obra con sus detalles completos.",
    };
  }

  if (activeFilter === "disponible") {
    return {
      badge: "Obras Disponibles",
      title: "Obras listas para ti",
      desc: "Estas son las piezas disponibles en este momento, agrupadas por colección cuando forman parte de una serie.",
    };
  }

  return {
    badge: "Explorar colecciones",
    title: "Galería por colecciones",
    desc: "Descubre la galería completa organizada por colecciones para identificar obras que pertenecen a una misma serie.",
  };
}

function sortItems(items: Artwork[], mode: SortMode) {
  return [...items].sort((a, b) => {
    const yearA = Number(a.year || 0);
    const yearB = Number(b.year || 0);
    const priceA = typeof a.price === "number" ? a.price : Number.POSITIVE_INFINITY;
    const priceB = typeof b.price === "number" ? b.price : Number.POSITIVE_INFINITY;

    if (mode === "oldest") return yearA - yearB;
    if (mode === "priceAsc") return priceA - priceB;
    if (mode === "priceDesc") return priceB - priceA;
    return yearB - yearA;
  });
}

interface CollectionGroup {
  key: string;
  title: string;
  eyebrow: string;
  items: Artwork[];
  isUngrouped: boolean;
}

function groupItemsByCollection(items: Artwork[]): CollectionGroup[] {
  const groups: CollectionGroup[] = [];
  const collections = new Map<string, CollectionGroup>();
  let ungrouped: CollectionGroup | null = null;

  items.forEach((item) => {
    const collection = getCollectionName(item);

    if (!collection) {
      ungrouped ??= {
        key: "obras-individuales",
        title: "Obras individuales",
        eyebrow: "Sin colección",
        items: [],
        isUngrouped: true,
      };
      ungrouped.items.push(item);
      return;
    }

    if (!collections.has(collection)) {
      const group = {
        key: `collection-${groups.length + 1}`,
        title: collection,
        eyebrow: "Colección",
        items: [],
        isUngrouped: false,
      };
      collections.set(collection, group);
      groups.push(group);
    }

    collections.get(collection)!.items.push(item);
  });

  if (ungrouped) groups.push(ungrouped);
  return groups;
}

function collectionMeta(group: CollectionGroup) {
  const total = group.items.length;
  const available = group.items.filter((item) => item.available).length;
  const artworkLabel = total === 1 ? "obra" : "obras";

  if (available === total) return `${total} ${artworkLabel} • todas disponibles`;
  if (available === 0) return `${total} ${artworkLabel} • todas vendidas`;
  return `${total} ${artworkLabel} • ${available} disponibles`;
}

function resultsLabel(
  count: number,
  groups: CollectionGroup[],
  filter: GalleryFilter,
  collectionFilter: string,
) {
  if (count === 0) return "No se encontraron resultados";

  const filterSuffix =
    filter === "pintura" ? " de pintura" : filter === "ceramica" ? " de cerámica" : filter === "disponible" ? " disponibles" : "";

  if (collectionFilter) {
    return `Mostrando ${count} ${count === 1 ? "obra" : "obras"}${filterSuffix} de la colección ${collectionFilter}`;
  }

  const collectionCount = groups.filter((group) => !group.isUngrouped).length;
  const collectionSuffix =
    collectionCount > 0 ? ` en ${collectionCount} ${collectionCount === 1 ? "colección" : "colecciones"}` : "";

  return `Mostrando ${count} ${count === 1 ? "obra" : "obras"}${filterSuffix}${collectionSuffix}`;
}

function safePrice(item: Artwork) {
  return typeof item.price === "number" ? `$${item.price.toLocaleString("es-MX")} MXN` : "Precio a consulta";
}

function getAppRoute(path: string): AppRoute {
  if (path.includes("artist") || path.includes("artista") || path.includes("admin")) {
    return "artist";
  }

  if (path.includes("gallery") || path.includes("galeria")) {
    return "gallery";
  }

  return "customer";
}

async function login(role: AuthRole, email: string, password: string): Promise<UserSession> {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role, email, password }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      token?: string;
      user?: {
        name?: string;
        email?: string;
        role?: string;
      };
      message?: string;
    };

    if (!response.ok || !data.token || !data.user || !isAuthRole(data.user.role)) {
      throw new Error(data.message || "No se pudo iniciar sesion.");
    }

    return {
      token: data.token,
      user: {
        name: String(data.user.name ?? ""),
        email: String(data.user.email ?? ""),
        role: data.user.role,
      },
    };
  } catch (error) {
    if (isLocalDev()) {
      return loginWithLocalDemo(role, email, password);
    }

    throw error;
  }
}

function loginWithLocalDemo(role: AuthRole, email: string, password: string): UserSession {
  const demoUser =
    role === "artist"
      ? {
          email: "artista@galeriaviva.local",
          password: "artista123",
          name: "Lulu Cardenas",
          role,
        }
      : {
          email: "cliente@galeriaviva.local",
          password: "cliente123",
          name: "Cliente demo",
          role,
        };

  if (email.trim().toLowerCase() !== demoUser.email || password !== demoUser.password) {
    throw new Error("Correo, password o rol incorrecto.");
  }

  return {
    token: window.btoa(
      JSON.stringify({
        role: demoUser.role,
        email: demoUser.email,
        issuedAt: new Date().toISOString(),
        mode: "local-dev",
      }),
    ),
    user: {
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
    },
  };
}

function readStoredSession(): UserSession | null {
  try {
    const raw = window.localStorage.getItem("galeria-viva-session");
    if (!raw) return null;

    const session = JSON.parse(raw) as UserSession;
    if (!session.token || !session.user || !isAuthRole(session.user.role)) return null;

    return session;
  } catch {
    return null;
  }
}

function isAuthRole(role: unknown): role is AuthRole {
  return role === "customer" || role === "artist";
}

function isLocalDev() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

export default App;
