// Diccionario de traducciones completo para el sitio
const TRADUCCIONES = {
  es: {
    nav_inicio: "Inicio",
    nav_clasificacion: "Clasificación",
    nav_jugadores: "Jugadores",
    nav_estadisticas: "Estadísticas",
    nav_candidatos: "Candidatos",
    nav_historial: "Historial",
    nav_admin: "Administración",
    btn_descargar: "📷 Descargar Imagen",
    titulo_posiciones: "Tabla de Posiciones",
    titulo_cuadro_honor: "🏆 Cuadro de Honor Mensual",
    titulo_grand_prix: "🏆 Grand Prix Anual",
    ranking_galardones: "👑 Ranking de Galardones (Jugadores)",
    civs_destacadas: "🏛️ Civilizaciones más Destacadas",
    subtitulo_bienvenida: "Bienvenido al portal oficial del torneo.",
    etiqueta_fecha: "FECHA",
    cargando: "Cargando…",
    opt_todas_las_fechas: "Todas las fechas",
    btn_descargar_imagen_hd: "⬇ Descargar Imagen (HD)"
  },
  en: {
    nav_inicio: "Home",
    nav_clasificacion: "Standings",
    nav_jugadores: "Players",
    nav_estadisticas: "Statistics",
    nav_candidatos: "Candidates",
    nav_historial: "History",
    nav_admin: "Admin",
    btn_descargar: "📷 Download Image",
    titulo_posiciones: "Standings Table",
    titulo_cuadro_honor: "🏆 Monthly Hall of Fame",
    titulo_grand_prix: "🏆 Annual Grand Prix",
    ranking_galardones: "👑 Awards Ranking (Players)",
    civs_destacadas: "🏛️ Most Outstanding Civilizations",
    subtitulo_bienvenida: "Welcome to the official tournament portal.",
    etiqueta_fecha: "ROUND",
    cargando: "Loading...",
    opt_todas_las_fechas: "All dates",
    btn_descargar_imagen_hd: "⬇ Download Image (HD)"
  }
};

// Nombres de meses en español e inglés para soporte dinámico
const NOMBRES_MES = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
};

const NOMBRES_MES_EN = {
  "01": "January", "02": "February", "03": "March", "04": "April",
  "05": "May", "06": "June", "07": "July", "08": "August",
  "09": "September", "10": "October", "11": "November", "12": "December"
};

function NOMBRES_MES_IDIOMA(mesNum, lang) {
  const m = String(mesNum).padStart(2, "0");
  if (lang === 'en') {
    return NOMBRES_MES_EN[m] || m;
  }
  return NOMBRES_MES[m] || m;
}

// Obtener idioma guardado o español por defecto
function obtenerIdiomaActual() {
  return localStorage.getItem("idioma_sitio") || "es";
}

// Cambiar idioma y guardar en localStorage
function cambiarIdioma(nuevoIdioma) {
  localStorage.setItem("idioma_sitio", nuevoIdioma);
  aplicarTraducciones();
  // Recargar o disparar renderizado si la página lo requiere
  if (typeof render === 'function') render();
  else if (typeof actualizarVista === 'function') actualizarVista();
}

// Inyectar el selector con banderas en el topbar
function inyectarSelectorIdioma() {
  const topbar = document.querySelector(".topbar");
  if (!topbar || document.getElementById("selector-idioma")) return;

  const idiomaActual = obtenerIdiomaActual();
  const divIdioma = document.createElement("div");
  divIdioma.id = "selector-idioma";
  divIdioma.style.cssText = "display:flex; align-items:center; gap:6px; margin-left:auto; padding-right:10px;";

  divIdioma.innerHTML = `
    <select id="select-lang" onchange="cambiarIdioma(this.value)" style="background:var(--panel-raised); color:var(--text); border:1px solid var(--line); border-radius:4px; padding:3px 6px; font-size:0.8rem; cursor:pointer;">
      <option value="es" ${idiomaActual === "es" ? "selected" : ""}>🇪🇸 ES</option>
      <option value="en" ${idiomaActual === "en" ? "selected" : ""}>🇺🇸 EN</option>
    </select>
  `;

  topbar.appendChild(divIdioma);
}

// Aplicar traducciones en los elementos de la interfaz
function aplicarTraducciones() {
  const lang = obtenerIdiomaActual();
  const t = TRADUCCIONES[lang];

  // 1. Traducir elementos con atributo data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  // 2. Traducir elementos con atributo data-i18n-placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) {
      el.placeholder = t[key];
    }
  });

  // 3. Traducir menú de navegación superior de forma segura
  const navLinks = document.querySelectorAll(".topbar .tabs a");
  if (navLinks.length >= 7) {
    navLinks[0].textContent = t.nav_inicio;
    navLinks[1].textContent = t.nav_clasificacion;
    navLinks[2].textContent = t.nav_jugadores;
    navLinks[3].textContent = t.nav_estadisticas;
    navLinks[4].textContent = t.nav_candidatos;
    navLinks[5].textContent = t.nav_historial;
    navLinks[6].textContent = t.nav_admin;
  }

  // 4. Traducir subtítulos específicos como el de bienvenida
  const subBienvenida = document.querySelector("main p, .subtitulo, header + main p, h3 + p");
  if (subBienvenida && (subBienvenida.textContent.includes("Bienvenido") || subBienvenida.textContent.includes("Welcome"))) {
    subBienvenida.textContent = t.subtitulo_bienvenida;
  }

  // Evento personalizado por si la página necesita refrescarse
  window.dispatchEvent(new CustomEvent("idiomaCambiado", { detail: { lang } }));
}

// Ejecutar al cargar cualquier página
document.addEventListener("DOMContentLoaded", () => {
  inyectarSelectorIdioma();
  aplicarTraducciones();
});
