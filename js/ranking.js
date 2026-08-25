// Renderiza el Ranking Acumulado General en la Clasificación General
function renderTablaRankingGeneral() {
    const tbody = document.getElementById("tabla-clasificacion");
    const tituloHeader = document.querySelector("#main-content h1");

    // 1. Intentar obtener el acumulado general guardado
    let datosGuardados = localStorage.getItem("ranking_acumulado_general");
    let acumuladoMap = datosGuardados ? JSON.parse(datosGuardados) : null;

    // Identificar la última fecha y partida procesadas desde el localStorage
    let ultimaJornada = "Fecha 01";
    let ultimaPartida = "Partida 1";
    let fallbackAcumulado = {};

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave.startsWith("registros_")) {
            const partesClave = clave.split("_");
            if (partesClave.length >= 4) {
                ultimaJornada = partesClave[2];
                ultimaPartida = partesClave[3];
            }

            // Si por alguna razón no existe ranking_acumulado_general, lo reconstruimos al vuelo
            if (!acumuladoMap) {
                try {
                    const registros = JSON.parse(localStorage.getItem(clave));
                    if (Array.isArray(registros)) {
                        registros.forEach(reg => {
                            if (!fallbackAcumulado[reg.jugador]) {
                                fallbackAcumulado[reg.jugador] = {
                                    jugador: reg.jugador,
                                    pts: 0,
                                    pg: 0,
                                    pp: 0,
                                    ultimoSuceso: reg.sucesoNota
                                };
                            }
                            fallbackAcumulado[reg.jugador].pts += (reg.pts || 0);
                            fallbackAcumulado[reg.jugador].pg += (reg.pg || 0);
                            fallbackAcumulado[reg.jugador].pp += (reg.pp || 0);
                            fallbackAcumulado[reg.jugador].ultimoSuceso = reg.sucesoNota;
                        });
                    }
                } catch (e) {
                    console.error("Error leyendo registros", e);
                }
            }
        }
    }

    // Si tuvimos que reconstruir el acumulado al vuelo, lo asignamos
    if (!acumuladoMap && Object.keys(fallbackAcumulado).length > 0) {
        acumuladoMap = fallbackAcumulado;
    }

    // Formato del título dinámico según reglas
    const ahora = new Date();
    const fechaHoraStr = ahora.toLocaleString('es-PE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    if (tituloHeader) {
        tituloHeader.textContent = `Ranking Michi DM Dinámico ${ultimaJornada} ${ultimaPartida} ${fechaHoraStr}`;
    }

    if (!acumuladoMap || Object.keys(acumuladoMap).length === 0) {
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; color: #6c757d; padding: 15px;">
                        No hay partidas registradas aún en el ranking acumulado.
                    </td>
                </tr>
            `;
        }
        return;
    }

    let jugadores = Object.values(acumuladoMap);

    // Priorizar ordenamiento por Puntos (pts) de mayor a menor
    jugadores.sort((a, b) => b.pts - a.pts);

    if (!tbody) return;
    tbody.innerHTML = "";

    jugadores.forEach((jug, index) => {
        const pos = index + 1;
        const pj = jug.pg + jug.pp;
        const pctVictoria = pj > 0 ? ((jug.pg / pj) * 100).toFixed(1) + "%" : "0.0%";

        // Círculos de color según ranking (1-5 Verde, 6-10 Amarillo, 11-15 Naranja, 16+ Gris)
        let colorCirculo = "#6c757d"; // Gris
        if (pos <= 5) colorCirculo = "#198754"; // Verde
        else if (pos <= 10) colorCirculo = "#ffc107"; // Amarillo
        else if (pos <= 15) colorCirculo = "#fd7e14"; // Naranja

        // Columna Variación (0 para debuts o sin cambios)
        const variacion = jug.var !== undefined ? jug.var : 0;
        const varTexto = variacion > 0 ? `+${variacion}` : `${variacion}`;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${colorCirculo}; margin-right:5px;"></span>
                <strong>${pos}</strong>
            </td>
            <td>${varTexto}</td>
            <td><strong>${jug.jugador}</strong></td>
            <td><span style="color: #0d6efd; font-weight: bold;">${jug.pts}</span></td>
            <td>${pj}</td>
            <td>${jug.pg}</td>
            <td>${jug.pp}</td>
            <td>${pctVictoria}</td>
            <td><em>${jug.ultimoSuceso || 'Sin participación'}</em></td>
        `;

        tbody.appendChild(tr);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderTablaRankingGeneral();
});
