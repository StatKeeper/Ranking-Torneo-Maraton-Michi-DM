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
    if (texto.includes("RLP") || texto.includes("RELAMPAGO") || texto.includes("RELÁMPAGO")) objetoJugador.bonoRLP += 1;
}

// Renderiza el Ranking Acumulado General en Clasificación General (index.html)
function renderTablaRankingGeneral() {
    const tbody = document.getElementById("tabla-clasificacion");
    const elFechaAct = document.getElementById("fecha-actualizacion");
    const elLabelFecha = document.getElementById("label-fecha");
    const elLabelPartida = document.getElementById("label-partida");
    const tableElement = tbody ? tbody.closest("table") : null;

    if (!tbody) return;

    let acumuladoMap = {};
    let ultimaJornada = "Fecha 01";
    let ultimaPartida = "Partida 1";
    let ultimaFechaHora = "";

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

                        if (reg.fechaHora) {
                            ultimaFechaHora = reg.fechaHora;
                        }

                        if (!acumuladoMap[nombre]) {
                            acumuladoMap[nombre] = {
                                jugador: nombre,
                                pts: 0,
                                pg: 0,
                                pp: 0,
                                var: 0,
                                vd: 0,
                                bonoE: 0,
                                bonoR: 0,
                                bonoM: 0,
                                bonoO: 0,
                                bonoS: 0,
                                bonoRch: 0,
                                bonoMG: 0,
                                bonoRLP: 0,
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

                        // Determinar V/D (1 si hubo victoria en esta partida, 0 si hubo derrota)
                        if (ganados > 0) {
                            acumuladoMap[nombre].vd = 1;
                        } else if (perdidos > 0) {
                            acumuladoMap[nombre].vd = 0;
                        }

                        // Contabilizar bonos por unidad (+1)
                        procesarBonosPorUnidad(sucesoActual, acumuladoMap[nombre]);
                    });
                }
            } catch (e) {
                console.error("Error procesando registro:", e);
            }
        }
    }

    // 2. Encabezados y Subencabezados dinámicos
    if (!ultimaFechaHora) {
        const ahora = new Date();
        ultimaFechaHora = ahora.toLocaleString('es-PE', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
    }

    if (elFechaAct) elFechaAct.textContent = ultimaFechaHora;
    if (elLabelFecha) elLabelFecha.textContent = ultimaJornada.includes("Fecha") ? ultimaJornada : `Fecha ${ultimaJornada}`;
    if (elLabelPartida) elLabelPartida.textContent = ultimaPartida.includes("Partida") ? ultimaPartida : `Partida ${ultimaPartida}`;

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
    let totalPts = 0, totalE = 0, totalR = 0, totalM = 0, totalO = 0, totalS = 0, totalRch = 0, totalMG = 0, totalRLP = 0, totalTB = 0;

    // 5. Dibujar las filas de la tabla
    tbody.innerHTML = "";
    jugadores.forEach((jug, index) => {
        const pos = index + 1;
        const pj = jug.pg + jug.pp;
        const vPjStr = `${jug.pg}/${pj}`;

        // Cálculo del Total de Bonos (TB)
        const tbJugador = jug.bonoE + jug.bonoR + jug.bonoM + jug.bonoO + jug.bonoS + jug.bonoRch + jug.bonoMG + jug.bonoRLP;

        // Acumular totales globales
        totalPts += jug.pts;
        totalE += jug.bonoE;
        totalR += jug.bonoR;
        totalM += jug.bonoM;
        totalO += jug.bonoO;
        totalS += jug.bonoS;
        totalRch += jug.bonoRch;
        totalMG += jug.bonoMG;
        totalRLP += jug.bonoRLP;
        totalTB += tbJugador;

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
            <td><strong>${vPjStr}</strong></td>
            <td><em>${jug.ultimoSuceso || 'Sin participación'}</em></td>
            <td><strong>${jug.vd}</strong></td>
            <td>${fmtBono(jug.bonoE)}</td>
            <td>${fmtBono(jug.bonoR)}</td>
            <td>${fmtBono(jug.bonoM)}</td>
            <td>${fmtBono(jug.bonoO)}</td>
            <td>${fmtBono(jug.bonoS)}</td>
            <td>${fmtBono(jug.bonoRch)}</td>
            <td>${fmtBono(jug.bonoMG)}</td>
            <td>${fmtBono(jug.bonoRLP)}</td>
            <td><strong style="color: #198754;">${tbJugador}</strong></td>
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
                <td colspan="3" style="text-align: right; padding: 10px;">Sumatoria Total:</td>
                <td style="color: #0d6efd;">${totalPts}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td style="color: #dc3545;">${totalE}</td>
                <td style="color: #dc3545;">${totalR}</td>
                <td style="color: #dc3545;">${totalM}</td>
                <td style="color: #dc3545;">${totalO}</td>
                <td style="color: #dc3545;">${totalS}</td>
                <td style="color: #dc3545;">${totalRch}</td>
                <td style="color: #dc3545;">${totalMG}</td>
                <td style="color: #dc3545;">${totalRLP}</td>
                <td style="color: #198754;">${totalTB}</td>
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
