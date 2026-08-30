// js/estadisticas.js

document.addEventListener("DOMContentLoaded", () => {
    renderizarEstadisticasTiempos();
});

function obtenerNombreOficial(nombreOriginal) {
    if (!nombreOriginal) return "";
    let mapaCorrecciones = {};
    const correccionesGuardadas = localStorage.getItem("mapa_correccion_nombres") || localStorage.getItem("correcciones_nombres");
    if (correccionesGuardadas) {
        try {
            mapaCorrecciones = JSON.parse(correccionesGuardadas);
        } catch (e) {
            console.error("Error parseando correcciones:", e);
        }
    }
    return mapaCorrecciones[nombreOriginal] || nombreOriginal;
}

function renderizarEstadisticasTiempos() {
    const contenedorEstadisticas = document.getElementById("contenedor-estadisticas-tiempos");
    
    // Recopilar todos los registros del localStorage
    let todasLasPartidas = [];
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
                        const nombre = obtenerNombreOficial(nombreRaw);

                        if (!estadisticasJugadores[nombre]) {
                            estadisticasJugadores[nombre] = {
                                nombre: nombre,
                                totalPartidas: 0,
                                victorias: 0,
                                derrotas: 0,
                                tiempos: [],
                                unidadesAsesinadas: 0,
                                edificiosArrasados: 0
                            };
                        }

                        const stats = estadisticasJugadores[nombre];
                        stats.totalPartidas++;
                        
                        const pg = parseInt(reg.pg || reg.PG || 0);
                        const pp = parseInt(reg.pp || reg.PP || 0);
                        if (pg > 0) stats.victorias++;
                        if (pp > 0) stats.derrotas++;

                        // Sumar unidades y edificios si vienen en el registro
                        stats.unidadesAsesinadas += parseInt(reg.unidades || reg.unidadesAsesinadas || reg.military || 0);
                        stats.edificiosArrasados += parseInt(reg.edificios || reg.edificiosArrasados || reg.buildings || 0);

                        // Procesar tiempo si existe en el registro (ej. formato en segundos o minutos)
                        if (reg.tiempo || reg.duracion) {
                            stats.tiempos.push(parseFloat(reg.tiempo || reg.duracion));
                        }
                    });
                }
            } catch (e) {
                console.error("Error leyendo clave de estadísticas:", e);
            }
        }
    }

    // Renderizar la vista si existe el contenedor en estadisticas.html
    if (contenedorEstadisticas) {
        let html = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; background: #fff;">
                    <thead>
                        <tr style="background-color: #343a40; color: #fff; text-align: left;">
                            <th style="padding: 10px;">Jugador</th>
                            <th style="padding: 10px;">Partidas Jugadas</th>
                            <th style="padding: 10px;">Victorias</th>
                            <th style="padding: 10px;">Derrotas</th>
                            <th style="padding: 10px;">Unidades Asesinadas</th>
                            <th style="padding: 10px;">Edificios Arrasados</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const jugadoresArray = Object.values(estadisticasJugadores);
        if (jugadoresArray.length === 0) {
            html += `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6c757d;">No hay estadísticas registradas aún.</td></tr>`;
        } else {
            jugadoresArray.forEach(j => {
                html += `
                    <tr style="border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 10px;"><strong>${j.nombre}</strong></td>
                        <td style="padding: 10px;">${j.totalPartidas}</td>
                        <td style="padding: 10px; color: #198754;">${j.victorias}</td>
                        <td style="padding: 10px; color: #dc3545;">${j.derrotas}</td>
                        <td style="padding: 10px;">${j.unidadesAsesinadas}</td>
                        <td style="padding: 10px;">${j.edificiosArrasados}</td>
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
}
