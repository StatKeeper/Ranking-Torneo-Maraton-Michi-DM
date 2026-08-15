document.addEventListener("DOMContentLoaded", function () {
    const adminPassInput = document.getElementById("admin-pass");
    
    // Verificar si la sesión guardada ya tiene acceso admin
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
        
        // Si no es admin y está en una página privada, lo redirige a inicio
        const paginaActual = window.location.pathname;
        if (paginaActual.includes("galeria.html") || paginaActual.includes("correccion.html")) {
            window.location.href = "index.html";
        }
    }
}
