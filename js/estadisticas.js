document.addEventListener("DOMContentLoaded", () => {
    renderizarSeccionCorreccionNombres();
});

function obtenerNickOficialGlobal(nombreIngresado) {
    if (!nombreIngresado) return "";
    let mapaCorrecciones = {};
    const correccionesGuardadas = localStorage.getItem("mapa_correccion_nombres") || localStorage.getItem("correcciones_nombres");
    if (correccionesGuardadas) {
        try {
            mapaCorrecciones = JSON.parse(correccionesGuardadas);
        } catch (e) {
            console.error("Error parseando correcciones:", e);
        }
    }

    const guardadasEq = localStorage.getItem("equivalencias_michi_dm");
    if (guardadasEq) {
        try {
            const listaEq = JSON.parse(guardadasEq);
            for (let eq of listaEq) {
                // Verificar si coincide con el antiguo o con cualquiera de los 5 nicks vinculados
                if (eq.antiguo.toLowerCase() === nombreIngresado.toLowerCase().trim()) {
                    return eq.nicks[0] || eq.antiguo;
                }
                if (eq.nicks && eq.nicks.some(n => n && n.toLowerCase() === nombreIngresado.toLowerCase().trim())) {
                    return eq.nicks[0];
                }
            }
        } catch (e) {
            console.error("Error al leer equivalencias:", e);
        }
    }
    return mapaCorrecciones[nombreIngresado] || nombreIngresado.trim();
}

function renderizarSeccionCorreccionNombres() {
    const contenedorCorreccion = document.getElementById("sec-correccion-nombres") || document.getElementById("tab-correccion-nombres") || document.body;
    
    // Si la estructura HTML principal de la pestaña se genera por script o requiere actualizarse:
    let htmlFormulario = `
        <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #343a40;">✏️ Corrección de Nombres y unificación multi-alias</h3>
            <p style="color: #6c757d; font-size: 0.9em;">Asocia un historial antiguo a hasta 5 nicks oficiales o variantes frecuentes utilizadas por el jugador.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; font-weight: bold; font-size: 0.85em; margin-bottom: 4px;">Historial Antiguo (Registro):</label>
                    <input type="text" id="input-antiguo" placeholder="Ej: B. Rommel" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; font-size: 0.85em; margin-bottom: 4px;">Nick Vinculado 1:</label>
                    <input type="text" id="input-nick-1" placeholder="Ej: [cLm] bLiTz" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; font-size: 0.85em; margin-bottom: 4px;">Nick Vinculado 2:</label>
                    <input type="text" id="input-nick-2" placeholder="Opcional" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; font-size: 0.85em; margin-bottom: 4px;">Nick Vinculado 3:</label>
                    <input type="text" id="input-nick-3" placeholder="Opcional" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; font-size: 0.85em; margin-bottom: 4px;">Nick Vinculado 4:</label>
                    <input type="text" id="input-nick-4" placeholder="Opcional" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; font-size: 0.85em; margin-bottom: 4px;">Nick Vinculado 5:</label>
                    <input type="text" id="input-nick-5" placeholder="Opcional" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                </div>
            </div>
            
            <button id="btn-guardar-equivalencia" style="background: #0d6efd; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">💾 Guardar / Actualizar Jugador</button>
        </div>
    `;

    // Cargar y pintar la lista de equivalencias guardadas y jugadores detectados
    let listaEq = [];
    try {
        listaEq = JSON.parse(localStorage.getItem("equivalencias_michi_dm")) || [];
    } catch(e) {
        listaEq = [];
    }

    let htmlTablaEq = `
        <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="margin-top: 0; color: #343a40;">📋 Lista Completa de Equivalencias Registradas y Nicks Múltiples</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em;">
                    <thead>
                        <tr style="background-color: #343a40; color: #fff; text-align: left;">
                            <th style="padding: 10px;">ID</th>
                            <th style="padding: 10px;">Historial Antiguo</th>
                            <th style="padding: 10px;">N. 1</th>
                            <th style="padding: 10px;">N. 2</th>
                            <th style="padding: 10px;">N. 3</th>
                            <th style="padding: 10px;">N. 4</th>
                            <th style="padding: 10px;">N. 5</th>
                            <th style="padding: 10px;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    if (listaEq.length === 0) {
        htmlTablaEq += `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #6c757d;">No hay equivalencias registradas todavía.</td></tr>`;
    } else {
        listaEq.forEach((eq, index) => {
            const nicks = eq.nicks || [eq.captura || ""];
            const esNuevo = eq.esNuevo || false;
            htmlTablaEq += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px;">${index + 1}</td>
                    <td style="padding: 10px;"><strong>${eq.antiguo}</strong></td>
                    <td style="padding: 10px;">${nicks[0] || "-"}</td>
                    <td style="padding: 10px;">${nicks[1] || "-"}</td>
                    <td style="padding: 10px;">${nicks[2] || "-"}</td>
                    <td style="padding: 10px;">${nicks[3] || "-"}</td>
                    <td style="padding: 10px;">${nicks[4] || "-"}</td>
                    <td style="padding: 10px;">
                        <span style="background: ${esNuevo ? '#cff4fc' : '#d1e7dd'}; color: ${esNuevo ? '#055160' : '#0f5132'}; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold;">
                            ${esNuevo ? '✨ Nuevo Jugador' : '✏️ Corregido'}
                        </span>
                    </td>
                </tr>
            `;
        });
    }

    htmlTablaEq += `</tbody></table></div></div>`;

    // Si existe un contenedor específico en el DOM para esta vista, inyectarlo
    const seccionContenedor = document.getElementById("contenedor-dinamico-correcciones");
    if (seccionContenedor) {
        seccionContenedor.innerHTML = htmlFormulario + htmlTablaEq;
    }

    // Configurar evento del botón Guardar
    setTimeout(() => {
        const btnGuardar = document.getElementById("btn-guardar-equivalencia");
        if (btnGuardar) {
            btnGuardar.onclick = () => {
                const antiguo = document.getElementById("input-antiguo").value.trim();
                const n1 = document.getElementById("input-nick-1").value.trim();
                const n2 = document.getElementById("input-nick-2").value.trim();
                const n3 = document.getElementById("input-nick-3").value.trim();
                const n4 = document.getElementById("input-nick-4").value.trim();
                const n5 = document.getElementById("input-nick-5").value.trim();

                if (!antiguo) {
                    alert("Por favor ingresa al menos el Historial Antiguo.");
                    return;
                }

                let listaActual = [];
                try {
                    listaActual = JSON.parse(localStorage.getItem("equivalencias_michi_dm")) || [];
                } catch(e) {
                    listaActual = [];
                }

                // Buscar si ya existe el registro antiguo para actualizarlo o crear uno nuevo
                const indexExistente = listaActual.findIndex(e => e.antiguo.toLowerCase() === antiguo.toLowerCase());
                const nicksArray = [n1, n2, n3, n4, n5].filter(n => n !== "");
                const esNuevoJugador = nicksArray.length === 0 || (nicksArray.length === 1 && nicksArray[0].toLowerCase() === antiguo.toLowerCase());

                const objetoEquivalencia = {
                    antiguo: antiguo,
                    nicks: nicksArray.length > 0 ? nicksArray : [antiguo],
                    captura: n1 || antiguo, // Retrocompatibilidad
                    esNuevo: esNuevoJugador
                };

                if (indexExistente >= 0) {
                    listaActual[indexExistente] = objetoEquivalencia;
                } else {
                    listaActual.push(objetoEquivalencia);
                }

                localStorage.setItem("equivalencias_michi_dm", JSON.stringify(listaActual));
                alert("¡Equivalencia y nicks múltiples guardados correctamente!");
                renderizarSeccionCorreccionNombres();
            };
        }
    }, 100);
}
