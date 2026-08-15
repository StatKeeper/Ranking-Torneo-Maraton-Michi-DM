document.addEventListener("DOMContentLoaded", function () {
    const adminPassInput = document.getElementById("admin-pass");
    
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
