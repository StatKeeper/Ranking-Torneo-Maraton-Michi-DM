// Sincronización forzada con bypass anti-caché absoluto para celulares
const ARCHIVO_DATOS_URL = "./datos_torneo.json";

async function cargarDatosNubeYSincronizar() {
    try {
        // Generamos un parámetro aleatorio único por milisegundo para evitar que el celular use caché vieja
        const urlConAntiCache = `${ARCHIVO_DATOS_URL}?nocache=${new Date().getTime()}`;
        
        const respuesta = await fetch(urlConAntiCache, {
            method: 'GET',
            cache: 'reload',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!respuesta.ok) throw new Error("No se pudo cargar el archivo de datos del torneo.");
        
        const datosNube = await respuesta.json();
        if (datosNube && typeof datosNube === "object") {
            // Limpiamos y sobrescribimos el almacenamiento local por completo con la versión fresca de la nube
            localStorage.clear();
            Object.keys(datosNube).forEach(key => {
                localStorage.setItem(key, datosNube[key]);
            });
            console.log("¡Datos sincronizados y forzados desde GitHub exitosamente!");
        }
    } catch (error) {
        console.warn("Aviso: Usando almacenamiento local actual (modo offline):", error);
    }
}

function generarArchivoDatosTorneoParaGitHub() {
    let todosLosDatos = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        todosLosDatos[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(todosLosDatos, null, 2)], {type: "application/json"});
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "datos_torneo.json";
    enlace.click();
    console.log("¡Archivo datos_torneo.json generado con éxito para subir a GitHub!");
}

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

function procesarBonosRegistro(reg, objetoJugador) {
    if (reg.e !== undefined || reg.bonoE !== undefined) {
        objetoJugador.bonoE += parseInt(reg.e || reg.bonoE || 0);
        objetoJugador.bonoR += parseInt(reg.r || reg.bonoR || 0);
        objetoJugador.bonoM += parseInt(reg.m || reg.bonoM || 0);
        objetoJugador.bonoO += parseInt(reg.o || reg.bonoO || 0);
        objetoJugador.bonoS += parseInt(reg.s || reg.bonoS || 0);
        objetoJugador.bonoRch += parseInt(reg.rch || reg.bonoRch || 0);
        objetoJugador.bonoMG += parseInt(reg.mg || reg.bonoMG || 0);
        objetoJugador.bonoRLP += parseInt(reg.rlp || reg.bonoRLP || 0);
        return;
    }

    const textoSuceso = reg.sucesoNota || reg.suceso || reg.ultimoSuceso || "";
    if (!textoSuceso || typeof textoSuceso !== "string") return;

    const texto = textoSuceso.toUpperCase();

    if (/\bE\b/.test(texto) || texto.includes("EXCELENCIA")) objetoJugador.bonoE += 1;
    if (/\bR\b/.test(texto) || texto.includes("RESISTENCIA")) objetoJugador.bonoR += 1;
    if (/\bM\b/.test(texto) || texto.includes("MILITAR")) objetoJugador.bonoM += 1;
    if (/\bO\b/.test(texto) || texto.includes("ORO")) objetoJugador.bonoO += 1;
    if (/\bS\b/.test(texto) || texto.includes("SOCIEDAD")) objetoJugador.bonoS += 1;

    if (texto.includes("RCH") || texto.includes("RACHA")) objetoJugador.bonoRch += 1;
    if (texto.includes("MG") || texto.includes("MATAGIGANTES")) objetoJugador.bonoMG += 1;
    if (texto.includes("RLP") || texto.includes("RELAMPAGO") || texto.includes("RELÁMPAGO")) objetoJugador.bonoRLP += 1;
}

function inicializarSelectoresAnioFiltro() {
    const selectAnio = document.getElementById("select-anio-filtro");
    if (!selectAnio) return;
    selectAnio.innerHTML = "";
    for (let a = 2026; a <= 2035; a++) {
        const opt = document.createElement("option");
        opt.value = a;
        opt.textContent = a;
        if (a === 2026) opt.selected = true;
        selectAnio.appendChild(opt);
    }
}

function renderTablaRankingGeneral() {
    const tbody = document.getElementById("tabla-clasificacion");
    const elFechaAct = document.getElementById("fecha-actualizacion");
    const elLabelFecha = document.getElementById("label-fecha");
    const elLabelPartida = document.getElementById("label-partida");
    const elTotalPartidasMes = document.getElementById("total-partidas-mes");
    
    const selectAnioFiltro = document.getElementById("select-anio-filtro");
    const selectMesFiltro = document.getElementById("select-mes-filtro");
    const tableElement = tbody ? tbody.closest("table") : null;

    if (!tbody) return;

    const anioSel = selectAnioFiltro ? selectAnioFiltro.value : "2026";
    const mesSel = selectMesFiltro ? selectMesFiltro.value : "08";
    const periodoSeleccionado = `${anioSel}-${mesSel}`;

    let clavesPartidasMes = [];
    let ultimaJornada = "01";
    let ultimaPartida = "1";
    let ultimaFechaHora = "";
    let todosLosJugadoresConocidos = new Set();

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave) {
            const claveLower = clave.toLowerCase();
            if (claveLower.startsWith("img_")) continue;

            if (clave.includes(`_${periodoSeleccionado}_`) && clave.startsWith("registros_")) {
                clavesPartidasMes.push(clave);
                try {
                    const regs = JSON.parse(localStorage.getItem(clave));
                    if (Array.isArray(regs)) {
                        regs.forEach(r => {
                            const nRaw = r.jugador || r.Jugador;
                            if (nRaw) todosLosJugadoresConocidos.add(obtenerNombreOficial(nRaw));
                        });
                    }
                } catch(e) {}
            }
        }
    }

    const listaMaestraGuardada = localStorage.getItem("lista_jugadores") || localStorage.getItem("jugadores_torneo");
    if (listaMaestraGuardada) {
        try {
            const parsedLista = JSON.parse(listaMaestraGuardada);
            if (Array.isArray(parsedLista)) {
                parsedLista.forEach(j => todosLosJugadoresConocidos.add(obtenerNombreOficial(j)));
            }
        } catch(e) {}
    }

    clavesPartidasMes.sort((a, b) => {
        const matchA = a.match(/Fecha_?(\d+).*?Partida_?(\d+)/i) || a.match(/(\d+)_(\d+)$/);
        const matchB = b.match(/Fecha_?(\d+).*?Partida_?(\d+)/i) || b.match(/(\d+)_(\d+)$/);
        if (matchA && matchB) {
            const jA = parseInt(matchA[1], 10);
            const jB = parseInt(matchB[1], 10);
            if (jA !== jB) return jA - jB;
            return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
        }
        return a.localeCompare(b);
    });

    let clavesPartidasUnicas = new Set(clavesPartidasMes);
    if (elTotalPartidasMes) {
        elTotalPartidasMes.textContent = clavesPartidasUnicas.size > 0 ? clavesPartidasUnicas.size : 0;
    }

    let posicionesAnterioresMap = {};
    let totalJugadoresAnteriores = 0;

    if (clavesPartidasMes.length > 0) {
        const clavesAnteriores = clavesPartidasMes.slice(0, clavesPartidasMes.length - 1);
        let acumuladoAnteriorMap = {};

        clavesAnteriores.forEach(clave => {
            try {
                const registros = JSON.parse(localStorage.getItem(clave));
                if (Array.isArray(registros)) {
                    registros.forEach(reg => {
                        const nombreRaw = reg.jugador || reg.Jugador;
                        if (!nombreRaw) return;
                        const nombre = obtenerNombreOficial(nombreRaw);

                        if (!acumuladoAnteriorMap[nombre]) {
                            acumuladoAnteriorMap[nombre] = { jugador: nombre, pts: 0 };
                        }
                        acumuladoAnteriorMap[nombre].pts += parseInt(reg.pts || reg.Pts || 0);
                    });
                }
            } catch (e) {}
        });

        let listaAnterior = Object.values(acumuladoAnteriorMap);
        listaAnterior.sort((a, b) => b.pts - a.pts);
        totalJugadoresAnteriores = listaAnterior.length;

        listaAnterior.forEach((jug, idx) => {
            posicionesAnterioresMap[jug.jugador] = idx + 1;
        });
    }

    let acumuladoMap = {};

    todosLosJugadoresConocidos.forEach(nombre => {
        acumuladoMap[nombre] = {
            jugador: nombre,
            pts: 0, pg: 0, pp: 0, vd: null,
            bonoE: 0, bonoR: 0, bonoM: 0, bonoO: 0, bonoS: 0,
            bonoRch: 0, bonoMG: 0, bonoRLP: 0,
            ultimoSuceso: 'Sin participación',
            participoEnUltima: false
        };
    });

    const ultimaClaveDelMes = clavesPartidasMes.length > 0 ? clavesPartidasMes[clavesPartidasMes.length - 1] : null;
    let jugadoresEnUltimaPartida = new Set();
    if (ultimaClaveDelMes) {
        try {
            const regsUltima = JSON.parse(localStorage.getItem(ultimaClaveDelMes));
            if (Array.isArray(regsUltima)) {
                regsUltima.forEach(r => {
                    const n = obtenerNombreOficial(r.jugador || r.Jugador);
                    if (n) jugadoresEnUltimaPartida.add(n);
                });
            }
        } catch(e) {}
    }

    clavesPartidasMes.forEach(clave => {
        const partesClave = clave.split("_");
        if (partesClave.length >= 4) {
            ultimaJornada = partesClave[partesClave.length - 2] || ultimaJornada;
            ultimaPartida = partesClave[partesClave.length - 1] || ultimaPartida;
        }

        const esLaUltimaPartida = (clave === ultimaClaveDelMes);

        try {
            const registros = JSON.parse(localStorage.getItem(clave));
            if (Array.isArray(registros)) {
                registros.forEach(reg => {
                    if (reg.fechaHora) ultimaFechaHora = reg.fechaHora;

                    const nombreRaw = reg.jugador || reg.Jugador;
                    if (!nombreRaw) return;

                    const nombre = obtenerNombreOficial(nombreRaw);
                    todosLosJugadoresConocidos.add(nombre);

                    if (!acumuladoMap[nombre]) {
                        acumuladoMap[nombre] = {
                            jugador: nombre,
                            pts: 0, pg: 0, pp: 0, vd: null,
                            bonoE: 0, bonoR: 0, bonoM: 0, bonoO: 0, bonoS: 0,
                            bonoRch: 0, bonoMG: 0, bonoRLP: 0,
                            ultimoSuceso: 'Sin participación',
                            participoEnUltima: false
                        };
                    }

                    const puntos = parseInt(reg.pts || reg.Pts || 0);
                    const ganados = parseInt(reg.pg || reg.PG || 0);
                    const perdidos = parseInt(reg.pp || reg.PP || 0);
                    const sucesoActual = reg.sucesoNota || reg.suceso || reg.ultimoSuceso || '';

                    acumuladoMap[nombre].pts += puntos;
                    acumuladoMap[nombre].pg += ganados;
                    acumuladoMap[nombre].pp += perdidos;

                    if (esLaUltimaPartida && jugadoresEnUltimaPartida.has(nombre)) {
                        acumuladoMap[nombre].participoEnUltima = true;
                        acumuladoMap[nombre].ultimoSuceso = sucesoActual || (ganados > 0 ? 'Victoria' : (perdidos > 0 ? 'Derrota' : 'Sin participación'));
                    } else if (!acumuladoMap[nombre].participoEnUltima && acumuladoMap[nombre].ultimoSuceso === 'Sin participación') {
                        if (esLaUltimaPartida && !jugadoresEnUltimaPartida.has(nombre)) {
                            acumuladoMap[nombre].ultimoSuceso = 'Sin participación';
                        } else if (sucesoActual) {
                            acumuladoMap[nombre].ultimoSuceso = sucesoActual;
                        }
                    }

                    if (ganados > 0) acumuladoMap[nombre].vd = 1;
                    else if (perdidos > 0 && acumuladoMap[nombre].vd === null) acumuladoMap[nombre].vd = 0;

                    procesarBonosRegistro(reg, acumuladoMap[nombre]);
                });
            }
        } catch (e) {}
    });

    Object.keys(acumuladoMap).forEach(nombre => {
        if (ultimaClaveDelMes && !jugadoresEnUltimaPartida.has(nombre)) {
            acumuladoMap[nombre].ultimoSuceso = "Sin participación";
        }
    });

    const numFecha = ultimaJornada.replace(/\D/g, "") || "01";
    const numPartida = ultimaPartida.replace(/\D/g, "") || "1";

    if (elFechaAct) elFechaAct.textContent = ultimaFechaHora || new Date().toLocaleString("es-PE");
    if (elLabelFecha) elLabelFecha.textContent = `Fecha ${numFecha}`;
    if (elLabelPartida) elLabelPartida.textContent = `Partida ${numPartida}`;

    let jugadores = Object.values(acumuladoMap);
    
    jugadores.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        return a.jugador.localeCompare(b.jugador);
    });

    jugadores = jugadores.slice(0, 25);

    if (jugadores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="16" style="text-align: center; color: #6c757d; padding: 20px;">
                    No hay partidas registradas para el período seleccionado.
                </td>
            </tr>
        `;
        if (tableElement) {
            let tfoot = tableElement.querySelector("tfoot");
            if (tfoot) tfoot.innerHTML = "";
        }
        return;
    }

    let totalPts = 0, totalE = 0, totalR = 0, totalM = 0, totalO = 0, totalS = 0, totalRch = 0, totalMG = 0, totalRLP = 0, totalTB = 0;

    tbody.innerHTML = "";
    jugadores.forEach((jug, index) => {
        const posActual = index + 1;
        
        let variacion = 0;
        if (clavesPartidasMes.length <= 1) {
            variacion = 0;
        } else if (posicionesAnterioresMap[jug.jugador] !== undefined) {
            const posAnterior = posicionesAnterioresMap[jug.jugador];
            variacion = posAnterior - posActual;
        } else {
            const posAnteriorVirtual = totalJugadoresAnteriores + 1;
            variacion = posAnteriorVirtual - posActual;
        }

        const varTexto = variacion > 0 ? `+${variacion}` : `${variacion}`;
        const pj = jug.pg + jug.pp;
        const vPjStr = `${jug.pg}/${pj}`;
        const tbJugador = jug.bonoE + jug.bonoR + jug.bonoM + jug.bonoO + jug.bonoS + jug.bonoRch + jug.bonoMG + jug.bonoRLP;

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

        let colorCirculo = "#6c757d";
        if (posActual <= 5) colorCirculo = "#198754";
        else if (posActual <= 10) colorCirculo = "#ffc107";
        else if (posActual <= 15) colorCirculo = "#fd7e14";

        const fmtBono = (val) => val > 0 ? `<strong style="color: #dc3545;">${val}</strong>` : `<span style="color: #6c757d;">0</span>`;
        const vdTexto = jug.vd !== null ? jug.vd : 0;

        let sucesoHtml = `<em>${jug.ultimoSuceso || 'Sin participación'}</em>`;
        if (jug.ultimoSuceso === 'Sin participación') {
            sucesoHtml = `<em style="color: #dc3545; font-weight: bold;">Sin participación</em>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${colorCirculo}; margin-right:5px;"></span>
                <strong>${posActual}</strong>
            </td>
            <td>${varTexto}</td>
            <td><strong>${jug.jugador}</strong></td>
            <td><span style="color: #0d6efd; font-weight: bold;">${jug.pts}</span></td>
            <td><strong>${vPjStr}</strong></td>
            <td>${sucesoHtml}</td>
            <td><strong>${vdTexto}</strong></td>
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
                <td>-</td><td>-</td><td>-</td>
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

document.addEventListener("DOMContentLoaded", async () => {
    inicializarSelectoresAnioFiltro();
    await cargarDatosNubeYSincronizar();
    renderTablaRankingGeneral();

    const selectAnio = document.getElementById("select-anio-filtro");
    const selectMes = document.getElementById("select-mes-filtro");

    if (selectAnio) selectAnio.addEventListener("change", renderTablaRankingGeneral);
    if (selectMes) selectMes.addEventListener("change", renderTablaRankingGeneral);
});
