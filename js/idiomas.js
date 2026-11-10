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
    civs_destacadas: "🏛️ Civilizaciones más Destacadas"
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
    civs_destacadas: "🏛️ Most Outstanding Civilizations"
  }
};

// Obtener idioma guardado o español por defecto
function obtenerIdiomaActual() {
  return localStorage.getItem("idioma_sitio") || "es";
}

// Cambiar idioma y guardar en localStorage
function cambiarIdioma(nuevoIdioma) {
  localStorage.setItem("idioma_sitio", nuevoIdioma);
  aplicarTraducciones();
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

  // Traducir menú de navegación superior
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

  // Traducir títulos principales si existen en la página
  const hTablaPosiciones = document.querySelector("#seccion-tabla-posiciones h3");
  if (hTablaPosiciones) hTablaPosiciones.textContent = t.titulo_posiciones;

  const hCuadroHonor = document.getElementById("titulo-cuadro-honor");
  if (hCuadroHonor) hCuadroHonor.textContent = t.titulo_cuadro_honor;

  const hGrandPrix = document.getElementById("titulo-grand-prix");
  if (hGrandPrix) hGrandPrix.textContent = t.titulo_grand_prix;

  const hGalardones = document.querySelector("#contenedor-ranking-galardones")?.previousElementSibling;
  if (hGalardones) hGalardones.textContent = t.ranking_galardones;

  const hCivs = document.querySelector("#contenedor-civilizaciones-destacadas")?.previousElementSibling;
  if (hCivs) hCivs.textContent = t.civs_destacadas;

  // Traducir botones de descarga de imágenes
  document.querySelectorAll(".btn.secondary").forEach(btn => {
    if (btn.textContent.includes("Descargar Imagen") || btn.textContent.includes("Download Image")) {
      btn.textContent = t.btn_descargar;
    }
  });

  // Evento personalizado por si la página necesita refrescarse
  window.dispatchEvent(new CustomEvent("idiomaCambiado", { detail: { lang } }));
}

// Ejecutar al cargar cualquier página
document.addEventListener("DOMContentLoaded", () => {
  inyectarSelectorIdioma();
  aplicarTraducciones();
});
