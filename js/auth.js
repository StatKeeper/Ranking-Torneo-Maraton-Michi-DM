document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const adminPassInput = document.getElementById("admin-pass");

    // CLAVE SECRETA DE ACCESO AL PANEL (por URL). Solo quien conozca esta URL
    // podrá ver siquiera el campo de contraseña. Cámbiala aquí si alguna vez
    // se filtra o quieres renovarla.
    const CLAVE_SECRETA_PANEL = "qnLKyVeHVkr60poG";

    const parametros = new URLSearchParams(window.location.search);
    const solicitaAccesoPorURL = parametros.get("admin") === CLAVE_SECRETA_PANEL;
    const yaDesbloqueadoEnEstaSesion = sessionStorage.getItem("panelAdminDesbloqueado") === "true";

    if (solicitaAccesoPorURL) {
        sessionStorage.setItem("panelAdminDesbloqueado", "true");
    }

    const mostrarPanel = solicitaAccesoPorURL || yaDesbloqueadoEnEstaSesion;

    if (sidebar) {
        sidebar.style.display = mostrarPanel ? "" : "none";
    }

    // Verificar si existe una sesión activa guardada
    if (sessionStorage.getItem("adminSession") === "active") {
        if (adminPassInput) adminPassInput.value = "michi2026";
        aplicarModoAdmin(true);
    } else {
        aplicarModoAdmin(false);
    }

    if (adminPassInput) {
        adminPassInput.addEventListener("input", function () {
            if (this.value === "michi2026") {
                sessionStorage.setItem("adminSession", "active");
                aplicarModoAdmin(true);
            } else {
                sessionStorage.removeItem("adminSession");
                aplicarModoAdmin(false);
            }
        });
    }
});

function aplicarModoAdmin(esAdmin) {
    const badge = document.getElementById("status-mode");
    const elementosAdmin = document.querySelectorAll(".admin-only");

    if (esAdmin) {
        if (badge) {
            badge.innerText = "Modo Administrador Activo";
            badge.className = "status-badge status-admin";
        }
        elementosAdmin.forEach(el => el.style.display = "inline-block");
    } else {
        if (badge) {
            badge.innerText = "Modo Espectador";
            badge.className = "status-badge status-espectador";
        }
        elementosAdmin.forEach(el => el.style.display = "none");
    }
}

// FUNCIÓN COMPARTIDA: disponible en TODAS las páginas (porque auth.js se carga en todas).
// Genera un archivo datos_torneo.json con el contenido actual de localStorage, para que
// el administrador lo descargue y lo suba manualmente a GitHub. Este paso es INDISPENSABLE
// después de cada cambio importante (registrar partidas, corregir nombres, borrar registros),
// porque de lo contrario otros dispositivos (celulares, otras PCs) seguirán viendo datos viejos,
// ya que su única fuente de información es este archivo JSON almacenado en el repositorio.
function generarArchivoDatosTorneoParaGitHub() {
    let todosLosDatos = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith("img_")) {
            todosLosDatos[key] = localStorage.getItem(key);
        }
    }
    const blob = new Blob([JSON.stringify(todosLosDatos, null, 2)], {type: "application/json"});
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "datos_torneo.json";
    enlace.click();
    alert("¡Archivo datos_torneo.json descargado!\n\nAhora súbelo a GitHub (reemplazando el que ya existe en la raíz del repositorio) para que estos cambios se vean en todos los dispositivos.");
    console.log("¡Archivo datos_torneo.json generado con éxito para subir a GitHub!");
}
