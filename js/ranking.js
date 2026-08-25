// Obtener el nombre oficial corregido desde localStorage
function obtenerNombreOficial(nombreOriginal) {
    if (!nombreOriginal) return "";
    let mapaCorrecciones = {};
    
    const correccionesGuardadas = localStorage.getItem("mapa_correccion_nombres") || localStorage.getItem("correcciones_nombres");
    if (correccionesGuardadas) {
        try {
            mapaCorrecciones = JSON.parse(correccionesGuardadas);
        } catch (e) {
            console.error("Error parseando mapa de corrección de nombres:", e);
        }
    }
    
    return mapaCorrecciones[nombreOriginal] || nombreOriginal;
}

// Función auxiliar para parsear y contabilizar la cantidad de bonos por unidad (+1)
function procesarBonosPorUnidad(textoSuceso, objetoJugador) {
    if (!textoSuceso || typeof textoSuceso !== "string") return;

    // Normalizar texto para comparación
    const texto = textoSuceso.toUpperCase();

    // Bonos principales
    if (/\bE\b/.test(texto) || texto.includes("EXCELENCIA")) objetoJugador.bonoE += 1;
    if (/\bR\b/.test(texto) || texto.includes("RESISTENCIA")) objetoJugador.bonoR += 1;
    if (/\bM\b/.test(texto) || texto.includes("MILITAR")) objetoJugador.bonoM += 1;
    if (/\bO\b/.test(texto) || texto.includes("ORO")) objetoJugador.bonoO += 1;
    if (/\bS\b/.test(texto) || texto.includes("SOCIEDAD")) objetoJugador.bonoS += 1;

    // Bonos especiales
    if (texto.includes("RCH") || texto.includes("RACHA")) objetoJugador.bonoRch += 1;
    if (texto.includes("MG") || texto.includes("MATAGIGANTES")) objetoJugador.bonoMG += 1;
}

// Renderiza el Ranking Acumulado General en Clasificación General (index.html)
function renderTablaRankingGeneral() {
    const tbody = document.getElementById("tabla-clasificacion");
    const tituloHeader = document.querySelector("#main-content h1");
    const tableElement = tbody ? tbody.closest("table") : null;

    if (!tbody) return;

    let acumuladoMap = {};
    let ultimaJornada = "Fecha 01";
    let ultimaPartida = "Partida 1";

    // 1. Leer dinámicamente registros masivos de localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave && clave.startsWith("registros_")) {
            const partesClave = clave.split("_");
            if (partesClave.length >= 2) {
                ultimaJornada = partesClave[partesClave.length - 2] || ultimaJornada;
                ultimaPartida = partesClave[partesClave.length - 1] || ultimaPartida;
            }

            try {
                const registros = JSON.parse(localStorage.getItem(clave));
                if (Array.isArray(registros)) {
                    registros.forEach(reg => {
                        const nombreRaw = reg.jugador || reg.Jugador;
                        if (!nombreRaw) return;

                        const nombre = obtenerNombreOficial(nombreRaw);

                        if (!acumuladoMap[nombre]) {
                            acumuladoMap[nombre] = {
                                jugador: nombre,
                                pts: 0,
                                pg: 0,
                                pp: 0,
                                var: 0,
                                bonoE: 0,
                                bonoR: 0,
                                bonoM: 0,
                                bonoO: 0,
                                bonoS: 0,
                                bonoRch: 0,
                                bonoMG: 0,
                                ultimoSuceso: reg.sucesoNota || reg.suceso || reg.ultimoSuceso || 'Victoria'
                            };
                        }

                        const puntos = parseInt(reg.pts || reg.Pts || 0);
                        const ganados = parseInt(reg.pg || reg.PG || 0);
                        const perdidos = parseInt(reg.pp || reg.PP || 0);
                        const sucesoActual = reg.sucesoNota || reg.suceso || reg.ultimoSuceso || '';

                        acumuladoMap[nombre].pts += puntos;
                        acumuladoMap[nombre].pg += ganados;
                        acumuladoMap[nombre].pp += perdidos;
                        acumuladoMap[nombre].ultimoSuceso = sucesoActual || acumuladoMap[nombre].ultimoSuceso;

                        // Contabilizar bonos por unidad (+1)
                        procesarBonosPorUnidad(sucesoActual, acumuladoMap[nombre]);
                    });
                }
            } catch (e) {
                console.error("Error procesando registro:", e);
            }
        }
    }

    // 2. Título dinámico en el encabezado
    const ahora = new Date();
    const fechaHoraStr = ahora.toLocaleString('es-PE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    if (tituloHeader) {
        tituloHeader.textContent = `Ranking Michi DM Dinámico ${ultimaJornada} ${ultimaPartida} ${fechaHoraStr}`;
    }

    // 3. Si no hay registros guardados
    let jugadores = Object.values(acumuladoMap);
    if (jugadores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="16" style="text-align: center; color: #6c757d; padding: 20px;">
                    No hay partidas registradas aún en el ranking acumulado.
                </td>
            </tr>
        `;
        return;
    }

    // 4. Ordenar por Puntos descendente
    jugadores.sort((a, b) => b.pts - a.pts);

    // Totales globales para la fila inferior
    let totalPts = 0, totalPJ = 0, totalPG = 0, totalPP = 0;
    let totalE = 0, totalR = 0, totalM = 0, totalO = 0, totalS = 0, totalRch = 0, totalMG = 0;

    // 5. Dibujar las filas de la tabla
    tbody.innerHTML = "";
    jugadores.forEach((jug, index) => {
        const pos = index + 1;
        const pj = jug.pg + jug.pp;
        const pctVictoria = pj > 0 ? ((jug.pg / pj) * 100).toFixed(1) + "%" : "0.0%";

        // Acumular totales de bonos y partidos
        totalPts += jug.pts;
        totalPJ += pj;
        totalPG += jug.pg;
        totalPP += jug.pp;
        totalE += jug.bonoE;
        totalR += jug.bonoR;
        totalM += jug.bonoM;
        totalO += jug.bonoO;
        totalS += jug.bonoS;
        totalRch += jug.bonoRch;
        totalMG += jug.bonoMG;

        // Indicadores visuales por zona (1-5 Verde, 6-10 Amarillo, 11-15 Naranja, 16+ Gris)
        let colorCirculo = "#6c757d";
        if (pos <= 5) colorCirculo = "#198754";
        else if (pos <= 10) colorCirculo = "#ffc107";
        else if (pos <= 15) colorCirculo = "#fd7e14";

        const variacion = jug.var !== undefined ? jug.var : 0;
        const varTexto = variacion > 0 ? `+${variacion}` : `${variacion}`;

        // Helper para resaltar en negrilla y rojo si el jugador tiene bonos ganados
        const fmtBono = (val) => val > 0 ? `<strong style="color: #dc3545;">${val}</strong>` : `<span style="color: #6c757d;">0</span>`;

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
            <td>${fmtBono(jug.bonoE)}</td>
            <td>${fmtBono(jug.bonoR)}</td>
            <td>${fmtBono(jug.bonoM)}</td>
            <td>${fmtBono(jug.bonoO)}</td>
            <td>${fmtBono(jug.bonoS)}</td>
            <td>${fmtBono(jug.bonoRch)}</td>
            <td>${fmtBono(jug.bonoMG)}</td>
            <td><em>${jug.ultimoSuceso || 'Sin participación'}</em></td>
        `;
        tbody.appendChild(tr);
    });

    // 6. Fila de sumatoria acumulada en la parte inferior
    if (tableElement) {
        let tfoot = tableElement.querySelector("tfoot");
        if (!tfoot) {
            tfoot = document.createElement("tfoot");
            tableElement.appendChild(tfoot);
        }
        tfoot.innerHTML = `
            <tr style="background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #dee2e6;">
                <td colspan="3" style="text-align: right; padding: 10px;">Sumatoria Total de Bonos:</td>
                <td style="color: #0d6efd;">${totalPts}</td>
                <td>${totalPJ}</td>
                <td>${totalPG}</td>
                <td>${totalPP}</td>
                <td>-</td>
                <td style="color: #dc3545;">${totalE}</td>
                <td style="color: #dc3545;">${totalR}</td>
                <td style="color: #dc3545;">${totalM}</td>
                <td style="color: #dc3545;">${totalO}</td>
                <td style="color: #dc3545;">${totalS}</td>
                <td style="color: #dc3545;">${totalRch}</td>
                <td style="color: #dc3545;">${totalMG}</td>
                <td>-</td>
            </tr>
        `;
    }
}

// Forzar ejecución al cargar la página
if (document.readyState === "complete" || document.readyState === "interactive") {
    renderTablaRankingGeneral();
} else {
    document.addEventListener("DOMContentLoaded", renderTablaRankingGeneral);
}
