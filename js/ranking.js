// Renderiza el Ranking Acumulado General en Clasificación General (index.html)
function renderTablaRankingGeneral() {
    const tbody = document.getElementById("tabla-clasificacion");
    const tituloHeader = document.querySelector("#main-content h1");

    if (!tbody) return;

    let acumuladoMap = {};
    let ultimaJornada = "Fecha 01";
    let ultimaPartida = "Partida 1";

    // 1. Intentar leer acumulado global directo
    const datosGuardados = localStorage.getItem("ranking_acumulado_general");
    if (datosGuardados) {
        try {
            acumuladoMap = JSON.parse(datosGuardados);
        } catch (e) {
            console.error("Error parseando ranking_acumulado_general:", e);
        }
    }

    // 2. Recorrer claves para obtener la última fecha y procesar datos si acumuladoMap está vacío
    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave && clave.startsWith("registros_")) {
            const partesClave = clave.split("_");
            if (partesClave.length >= 4) {
                ultimaJornada = partesClave[2];
                ultimaPartida = partesClave[3];
            }

            // Fallback: Si no había acumulado global, lo sumamos al vuelo
            if (Object.keys(acumuladoMap).length === 0) {
                try {
                    const registros = JSON.parse(localStorage.getItem(clave));
                    if (Array.isArray(registros)) {
                        registros.forEach(reg => {
                            if (!acumuladoMap[reg.jugador]) {
                                acumuladoMap[reg.jugador] = {
                                    jugador: reg.jugador,
                                    pts: 0, pg: 0, pp: 0,
                                    ultimoSuceso: reg.sucesoNota
                                };
                            }
                            acumuladoMap[reg.jugador].pts += (reg.pts || 0);
                            acumuladoMap[reg.jugador].pg += (reg.pg || 0);
                            acumuladoMap[reg.jugador].pp += (reg.pp || 0);
                            acumuladoMap[reg.jugador].ultimoSuceso = reg.sucesoNota;
                        });
                    }
                } catch (e) {
                    console.error("Error procesando registro:", e);
                }
            }
        }
    }

    // 3. Título dinámico
    const ahora = new Date();
    const fechaHoraStr = ahora.toLocaleString('es-PE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    if (tituloHeader) {
        tituloHeader.textContent = `Ranking Michi DM Dinámico ${ultimaJornada} ${ultimaPartida} ${fechaHoraStr}`;
    }

    // 4. Si no hay datos registrados
    let jugadores = Object.values(acumuladoMap);
    if (jugadores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: #6c757d; padding: 20px;">
                    No hay partidas registradas aún en el ranking acumulado.
                </td>
            </tr>
        `;
        return;
    }

    // 5. Ordenar por Puntos descendente
    jugadores.sort((a, b) => b.pts - a.pts);

    // 6. Dibujar la tabla
    tbody.innerHTML = "";
    jugadores.forEach((jug, index) => {
        const pos = index + 1;
        const pj = jug.pg + jug.pp;
        const pctVictoria = pj > 0 ? ((jug.pg / pj) * 100).toFixed(1) + "%" : "0.0%";

        let colorCirculo = "#6c757d"; // Gris
        if (pos <= 5) colorCirculo = "#198754"; // Verde
        else if (pos <= 10) colorCirculo = "#ffc107"; // Amarillo
        else if (pos <= 15) colorCirculo = "#fd7e14"; // Naranja

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

// Forzar la ejecución cuando el documento esté listo
if (document.readyState === "complete" || document.readyState === "interactive") {
    renderTablaRankingGeneral();
} else {
    document.addEventListener("DOMContentLoaded", renderTablaRankingGeneral);
}
