// js/estadisticas.js

document.addEventListener("DOMContentLoaded", () => {
    renderizarEstadisticasTiempos();
});

function obtenerNickOficialEstadisticas(nombreIngresado) {
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
    // Compatible también con equivalencias.js si existe
    if (typeof equivalencias !== 'undefined') {
        const guardadas = localStorage.getItem("equivalencias_michi_dm");
        const lista = guardadas ? JSON.parse(guardadas) : equivalencias;
        const buscado = lista.find(e => e.antiguo.toLowerCase() === nombreIngresado.toLowerCase().trim());
        if (buscado) return buscado.oficial;
    }
    return mapaCorrecciones[nombreIngresado] || nombreIngresado.trim();
}

function renderizarEstadisticasTiempos() {
    const contenedorEstadisticas = document.getElementById("contenedor-estadisticas-tiempos");
    if (!contenedorEstadisticas) return;

    let estadisticasJugadores = {};

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave && clave.startsWith("registros_")) {
            try {
                const registros = JSON.parse(localStorage.getItem(clave));
                if (Array.isArray(registros)) {
                    registros.forEach(reg => {
                        const nombreRaw = reg.jugador || reg.Jugador;
                        if (!nombreRaw) return;
                        const nombre = obtenerNickOficialEstadisticas(nombreRaw);

                        if (!estadisticasJugadores[nombre]) {
                            estadisticasJugadores[nombre] = {
                                nombre: nombre,
                                totalPartidas: 0,
                                victorias: 0,
                                derrotas: 0,
                                unidadesTotales: 0,
                                edificiosTotales: 0,
                                tiempos: []
                            };
                        }

                        const stats = estadisticasJugadores[nombre];
                        stats.totalPartidas++;
                        
                        if (reg.pg === 1 || reg.PG === 1) stats.victorias++;
                        if (reg.pp === 1 || reg.PP === 1) stats.derrotas++;

                        // Acumulando Unidades Asesinadas y Edificios Arrasados
                        stats.unidadesTotales += parseInt(reg.unidadesAsesinadas || reg.equipo || 0, 10);
                        stats.edificiosTotales += parseInt(reg.edificiosArrasados || reg.civ || 0, 10);

                        if (reg.duracion) {
                            stats.tiempos.push(reg.duracion);
                        }
                    });
                }
            } catch (e) {
                console.error("Error al procesar estadísticas:", e);
            }
        }
    }

    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background-color: #343a40; color: #fff; text-align: left;">
                        <th style="padding: 12px;">Jugador</th>
                        <th style="padding: 12px;">Partidas</th>
                        <th style="padding: 12px;">Victorias</th>
                        <th style="padding: 12px;">Derrotas</th>
                        <th style="padding: 12px;">Unidades Asesinadas</th>
                        <th style="padding: 12px;">Edificios Arrasados</th>
                    </tr>
                </thead>
                <tbody>
    `;

    const listaJugadores = Object.values(estadisticasJugadores);
    if (listaJugadores.length === 0) {
        html += `<tr><td colspan="6" style="text-align: center; padding: 25px; color: #6c757d;">No hay registros de estadísticas disponibles.</td></tr>`;
    } else {
        listaJugadores.sort((a, b) => b.victorias - a.victorias);
        listaJugadores.forEach(j => {
            html += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px;"><strong>${j.nombre}</strong></td>
                    <td style="padding: 12px;">${j.totalPartidas}</td>
                    <td style="padding: 12px; color: #198754; font-weight: bold;">${j.victorias}</td>
                    <td style="padding: 12px; color: #dc3545; font-weight: bold;">${j.derrotas}</td>
                    <td style="padding: 12px;">${j.unidadesTotales}</td>
                    <td style="padding: 12px;">${j.edificiosTotales}</td>
                </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
        </div>
    `;
    contenedorEstadisticas.innerHTML = html;
}
