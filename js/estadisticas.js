document.addEventListener("DOMContentLoaded", () => {
    renderizarEstadisticasTiempos();

    const selectAnio = document.getElementById("select-anio-filtro") || document.getElementById("select-anio") || document.getElementById("anio");
    const selectMes = document.getElementById("select-mes-filtro") || document.getElementById("select-mes") || document.getElementById("mes");

    if (selectAnio) {
        selectAnio.addEventListener("change", renderizarEstadisticasTiempos);
    }
    if (selectMes) {
        selectMes.addEventListener("change", renderizarEstadisticasTiempos);
    }
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
    if (typeof equivalencias !== 'undefined') {
        const guardadas = localStorage.getItem("equivalencias_michi_dm");
        const lista = guardadas ? JSON.parse(guardadas) : equivalencias;
        const buscado = lista.find(e => e.antiguo.toLowerCase() === nombreIngresado.toLowerCase().trim());
        if (buscado) return buscado.oficial;
    }
    return mapaCorrecciones[nombreIngresado] || nombreIngresado.trim();
}

function convertirDuracionASegundos(duracionStr) {
    if (!duracionStr || typeof duracionStr !== 'string') return 0;
    const partes = duracionStr.split(':').map(p => parseInt(p, 10) || 0);
    if (partes.length === 3) {
        return partes[0] * 3600 + partes[1] * 60 + partes[2];
    } else if (partes.length === 2) {
        return partes[0] * 60 + partes[1];
    }
    return 0;
}

function convertirSegundosADuracion(segundosTotales) {
    if (!segundosTotales || segundosTotales <= 0) return "00:00:00";
    const h = Math.floor(segundosTotales / 3600);
    const m = Math.floor((segundosTotales % 3600) / 60);
    const s = segundosTotales % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderizarEstadisticasTiempos() {
    const secTiempos = document.getElementById("sec-tiempos");
    const secCivilizaciones = document.getElementById("sec-civilizaciones");
    const secEnfrentamientos = document.getElementById("sec-enfrentamientos");

    if (!secTiempos || !secCivilizaciones || !secEnfrentamientos) return;

    let estadisticasJugadores = {};
    let estadisticasCivilizaciones = {};
    let estadisticasJugadorCiv = {};
    let estadisticasEquipos = {};
    let listaGlobalJugadores = new Set();
    let partidasDetalleGlobal = [];

    const selectAnio = document.getElementById("select-anio-filtro") || document.getElementById("select-anio") || document.getElementById("anio");
    const selectMes = document.getElementById("select-mes-filtro") || document.getElementById("select-mes") || document.getElementById("mes");
    
    const anioSeleccionado = selectAnio ? selectAnio.value : "2026";
    const mesSeleccionado = selectMes ? selectMes.value : "09";

    const mesesMapInverso = {
        "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
        "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
        "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
    };

    const mesesMapTexto = {
        "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
        "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
        "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12",
        "Septiembre": "09", "Agosto": "08", "Octubre": "10", "Noviembre": "11", "Diciembre": "12"
    };

    const mesFormatoNum = mesesMapTexto[mesSeleccionado] || mesSeleccionado;
    const mesFormatoTexto = mesesMapInverso[mesSeleccionado] || mesSeleccionado;

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        
        if (clave && clave.startsWith("registros_") && !clave.includes("img_")) {
            if (clave.includes(anioSeleccionado) && (clave.includes(mesFormatoNum) || clave.toLowerCase().includes(mesFormatoTexto.toLowerCase()))) {
                try {
                    const registros = JSON.parse(localStorage.getItem(clave));
                    if (Array.isArray(registros) && registros.length > 0) {
                        let jugadoresEnPartida = [];
                        let partidaYaProcesadaEnEstaClave = new Set();

                        registros.forEach(reg => {
                            const nombreRaw = reg.jugador || reg.Jugador;
                            if (!nombreRaw) return;
                            const nombre = obtenerNickOficialEstadisticas(nombreRaw);
                            
                            if (partidaYaProcesadaEnEstaClave.has(nombre)) return;
                            partidaYaProcesadaEnEstaClave.add(nombre);

                            listaGlobalJugadores.add(nombre);

                            const pg = (reg.pg === 1 || reg.PG === 1) ? 1 : 0;
                            const pp = (reg.pp === 1 || reg.PP === 1) ? 1 : 0;
                            const equipoReg = (reg.equipo || reg.Equipo || "Sin Equipo").trim();

                            jugadoresEnPartida.push({ nombre, pg, pp, equipo: equipoReg });

                            if (!estadisticasJugadores[nombre]) {
                                estadisticasJugadores[nombre] = {
                                    nombre: nombre,
                                    totalPartidas: 0,
                                    victorias: 0,
                                    derrotas: 0,
                                    unidadesTotales: 0,
                                    edificiosTotales: 0,
                                    segundosTotales: 0
                                };
                            }

                            const stats = estadisticasJugadores[nombre];
                            stats.totalPartidas++;
                            if (pg === 1) stats.victorias++;
                            if (pp === 1) stats.derrotas++;

                            stats.unidadesTotales += parseInt(reg.unidadesAsesinadas || reg.UnidadesAsesinadas || 0, 10);
                            stats.edificiosTotales += parseInt(reg.edificiosArrasados || reg.EdificiosArrasados || 0, 10);
                            stats.segundosTotales += convertirDuracionASegundos(reg.duracion || reg.Duracion);

                            const civRaw = reg.civ || reg.Civ || reg.civilizacion || reg.Civilizacion;
                            if (civRaw && civRaw !== "-" && String(civRaw).trim() !== "") {
                                const civ = String(civRaw).trim();
                                
                                if (!estadisticasCivilizaciones[civ]) {
                                    estadisticasCivilizaciones[civ] = { civ: civ, jugadas: 0, victorias: 0, derrotas: 0 };
                                }
                                estadisticasCivilizaciones[civ].jugadas++;
                                if (pg === 1) estadisticasCivilizaciones[civ].victorias++;
                                if (pp === 1) estadisticasCivilizaciones[civ].derrotas++;

                                if (!estadisticasJugadorCiv[nombre]) {
                                    estadisticasJugadorCiv[nombre] = {};
                                }
                                if (!estadisticasJugadorCiv[nombre][civ]) {
                                    estadisticasJugadorCiv[nombre][civ] = { jugadas: 0, victorias: 0, derrotas: 0 };
                                }
                                estadisticasJugadorCiv[nombre][civ].jugadas++;
                                if (pg === 1) estadisticasJugadorCiv[nombre][civ].victorias++;
                                if (pp === 1) estadisticasJugadorCiv[nombre][civ].derrotas++;
                            }

                            if (equipoReg && equipoReg !== "-") {
                                const claveEquipo = `${clave} - ${equipoReg}`;
                                if (!estadisticasEquipos[claveEquipo]) {
                                    estadisticasEquipos[claveEquipo] = {
                                        nombreEquipo: equipoReg,
                                        partidaKey: clave,
                                        victorias: 0,
                                        derrotas: 0,
                                        miembros: new Set()
                                    };
                                }
                                estadisticasEquipos[claveEquipo].miembros.add(nombre);
                                if (pg === 1) estadisticasEquipos[claveEquipo].victorias = 1;
                                if (pp === 1) estadisticasEquipos[claveEquipo].derrotas = 1;
                            }
                        });

                        if (jugadoresEnPartida.length > 0) {
                            partidasDetalleGlobal.push(jugadoresEnPartida);
                        }
                    }
                } catch (e) {
                    console.error("Error al procesar registros:", e);
                }
            }
        }
    }

    const listaJugadores = Object.values(estadisticasJugadores).filter(j => j.totalPartidas > 0);
    listaJugadores.sort((a, b) => b.totalPartidas - a.totalPartidas);

    // 1. Render Tiempos
    secTiempos.innerHTML = `
        <h3>⏱️ Consulta Interactiva de Tiempos (2 a 4 Jugadores)</h3>
        <p style="color: #6c757d; font-size: 0.85em; margin-bottom: 12px;">Ingresa de 2 a 4 jugadores para comparar sus tiempos y estadísticas lado a lado.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 12px;">
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 1:</label>
                    <input type="text" id="input-tiempo-1" list="lista-jugadores-sug-t" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 2:</label>
                    <input type="text" id="input-tiempo-2" list="lista-jugadores-sug-t" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 3 (Opc.):</label>
                    <input type="text" id="input-tiempo-3" list="lista-jugadores-sug-t" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 4 (Opc.):</label>
                    <input type="text" id="input-tiempo-4" list="lista-jugadores-sug-t" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
            </div>
            <datalist id="lista-jugadores-sug-t">
                ${Array.from(listaGlobalJugadores).map(j => `<option value="${j}">`).join("")}
            </datalist>
            <button id="btn-consultar-tiempos" style="background: #0d6efd; color: white; border: none; padding: 8px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.9em;">Consultar Tiempos</button>
        </div>
        <div id="resultado-tiempos-container" style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 25px; display: none;"></div>
    `;

    // 2. Render Civilizaciones
    secCivilizaciones.innerHTML = `
        <h3>🏛️ Consulta Interactiva de Civilizaciones (2 a 4 Jugadores)</h3>
        <p style="color: #6c757d; font-size: 0.85em; margin-bottom: 12px;">Ingresa de 2 a 4 jugadores para comparar las civilizaciones que han utilizado y su rendimiento.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 12px;">
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 1:</label>
                    <input type="text" id="input-civ-1" list="lista-jugadores-sug-c" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 2:</label>
                    <input type="text" id="input-civ-2" list="lista-jugadores-sug-c" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 3 (Opc.):</label>
                    <input type="text" id="input-civ-3" list="lista-jugadores-sug-c" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 4 (Opc.):</label>
                    <input type="text" id="input-civ-4" list="lista-jugadores-sug-c" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
            </div>
            <datalist id="lista-jugadores-sug-c">
                ${Array.from(listaGlobalJugadores).map(j => `<option value="${j}">`).join("")}
            </datalist>
            <button id="btn-consultar-civs" style="background: #0d6efd; color: white; border: none; padding: 8px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.9em;">Consultar Civilizaciones</button>
        </div>
        <div id="resultado-civs-container" style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 25px; display: none;"></div>
    `;

    // Evento Tiempos
    const btnConsultarTiempos = document.getElementById("btn-consultar-tiempos");
    if (btnConsultarTiempos) {
        btnConsultarTiempos.addEventListener("click", () => {
            const j1 = document.getElementById("input-tiempo-1").value.trim();
            const j2 = document.getElementById("input-tiempo-2").value.trim();
            const j3 = document.getElementById("input-tiempo-3").value.trim();
            const j4 = document.getElementById("input-tiempo-4").value.trim();
            const contenedorResultado = document.getElementById("resultado-tiempos-container");

            let seleccionados = [j1, j2, j3, j4].filter(j => j !== "");
            seleccionados = [...new Set(seleccionados.map(j => obtenerNickOficialEstadisticas(j)))];

            if (seleccionados.length < 2) {
                alert("Debes ingresar al menos 2 jugadores para comparar.");
                return;
            }

            let htmlTablaComparativa = `
                <h4 style="color: #343a40; margin-bottom: 15px; border-bottom: 2px solid #0d6efd; padding-bottom: 5px;">📊 Comparativa de Tiempos</h4>
                <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                    <table style="width: 100%; min-width: ${seleccionados.length * 150}px; border-collapse: collapse; background: #fff; font-size: 0.88em;">
                        <thead>
                            <tr style="background-color: #343a40; color: #fff;">
                                <th style="padding: 10px 8px; text-align: left;">Métrica</th>
            `;
            seleccionados.forEach(sel => {
                htmlTablaComparativa += `<th style="padding: 10px 8px; text-align: center; white-space: nowrap;">${sel}</th>`;
            });
            htmlTablaComparativa += `</tr></thead><tbody>`;

            const metricasT = [
                { label: "Partidas", fn: j => j.totalPartidas },
                { label: "Dur. Acumulada", fn: j => convertirSegundosADuracion(j.segundosTotales) },
                { label: "Prom. Duración", fn: j => convertirSegundosADuracion(j.totalPartidas > 0 ? Math.round(j.segundosTotales / j.totalPartidas) : 0) },
                { label: "Total Unidades", fn: j => j.unidadesTotales },
                { label: "Prom. Unidades", fn: j => j.totalPartidas > 0 ? (j.unidadesTotales / j.totalPartidas).toFixed(1) : 0 },
                { label: "Total Edificios", fn: j => j.edificiosTotales },
                { label: "Prom. Edificios", fn: j => j.totalPartidas > 0 ? (j.edificiosTotales / j.totalPartidas).toFixed(1) : 0 }
            ];

            metricasT.forEach((metrica, idx) => {
                const bgRow = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
                htmlTablaComparativa += `<tr style="border-bottom: 1px solid #dee2e6; background-color: ${bgRow};">`;
                htmlTablaComparativa += `<td style="padding: 9px 8px; font-weight: bold; color: #343a40; white-space: nowrap;">${metrica.label}</td>`;
                
                seleccionados.forEach(sel => {
                    const jData = listaJugadores.find(j => j.nombre.toLowerCase() === sel.toLowerCase());
                    const valor = jData ? metrica.fn(jData) : "-";
                    htmlTablaComparativa += `<td style="padding: 9px 8px; text-align: center; white-space: nowrap;">${valor}</td>`;
                });
                htmlTablaComparativa += `</tr>`;
            });

            htmlTablaComparativa += `</tbody></table></div>`;
            contenedorResultado.style.display = "block";
            contenedorResultado.innerHTML = htmlTablaComparativa;
        });
    }

    // Evento Civilizaciones
    const btnConsultarCivs = document.getElementById("btn-consultar-civs");
    if (btnConsultarCivs) {
        btnConsultarCivs.addEventListener("click", () => {
            const j1 = document.getElementById("input-civ-1").value.trim();
            const j2 = document.getElementById("input-civ-2").value.trim();
            const j3 = document.getElementById("input-civ-3").value.trim();
            const j4 = document.getElementById("input-civ-4").value.trim();
            const contenedorResultado = document.getElementById("resultado-civs-container");

            let seleccionados = [j1, j2, j3, j4].filter(j => j !== "");
            seleccionados = [...new Set(seleccionados.map(j => obtenerNickOficialEstadisticas(j)))];

            if (seleccionados.length < 2) {
                alert("Debes ingresar al menos 2 jugadores para comparar civilizaciones.");
                return;
            }

            let civsSet = new Set();
            seleccionados.forEach(sel => {
                if (estadisticasJugadorCiv[sel]) {
                    Object.keys(estadisticasJugadorCiv[sel]).forEach(c => civsSet.add(c));
                }
            });

            let listaCivsComparativa = Array.from(civsSet);

            let htmlTablaCivs = `
                <h4 style="color: #343a40; margin-bottom: 15px; border-bottom: 2px solid #0d6efd; padding-bottom: 5px;">📊 Comparativa de Civilizaciones</h4>
            `;

            if (listaCivsComparativa.length === 0) {
                htmlTablaCivs += `<p style="color: #dc3545; font-weight: bold;">⚠️ No se encontraron civilizaciones registradas para los jugadores seleccionados en este periodo.</p>`;
            } else {
                htmlTablaCivs += `
                    <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                        <table style="width: 100%; min-width: ${seleccionados.length * 160 + 120}px; border-collapse: collapse; background: #fff; font-size: 0.88em;">
                            <thead>
                                <tr style="background-color: #343a40; color: #fff;">
                                    <th style="padding: 10px 8px; text-align: left;">Civilización</th>
                `;
                seleccionados.forEach(sel => {
                    htmlTablaCivs += `<th style="padding: 10px 8px; text-align: center; white-space: nowrap;">${sel} (Part. / WR)</th>`;
                });
                htmlTablaCivs += `</tr></thead><tbody>`;

                listaCivsComparativa.forEach((civ, idx) => {
                    const bgRow = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
                    htmlTablaCivs += `<tr style="border-bottom: 1px solid #dee2e6; background-color: ${bgRow};">`;
                    htmlTablaCivs += `<td style="padding: 9px 8px; font-weight: bold; color: #343a40; white-space: nowrap;">🏛️ ${civ}</td>`;

                    seleccionados.forEach(sel => {
                        const datosJugCiv = estadisticasJugadorCiv[sel] && estadisticasJugadorCiv[sel][civ];
                        if (datosJugCiv && datosJugCiv.jugadas > 0) {
                            const wr = ((datosJugCiv.victorias / datosJugCiv.jugadas) * 100).toFixed(0);
                            htmlTablaCivs += `<td style="padding: 9px 8px; text-align: center; white-space: nowrap;">${datosJugCiv.jugadas} jug. (${wr}%)</td>`;
                        } else {
                            htmlTablaCivs += `<td style="padding: 9px 8px; text-align: center; color: #adb5bd; white-space: nowrap;">-</td>`;
                        }
                    });
                    htmlTablaCivs += `</tr>`;
                });

                htmlTablaCivs += `</tbody></table></div>`;
            }

            contenedorResultado.style.display = "block";
            contenedorResultado.innerHTML = htmlTablaCivs;
        });
    }

    // 3. Sinergia / Equipos
    const listaEquipos = Object.values(estadisticasEquipos);
    let htmlEnfrentamientos = `
        <h3>🔍 Consulta Interactiva de Sinergia de Grupo (2 a 4 Jugadores)</h3>
        <p style="color: #6c757d; font-size: 0.85em; margin-bottom: 12px;">Ingresa de 2 a 4 jugadores para conocer sus estadísticas conjuntas en el mismo equipo.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 12px;">
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 1:</label>
                    <input type="text" id="input-sinergia-1" list="lista-jugadores-sug" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 2:</label>
                    <input type="text" id="input-sinergia-2" list="lista-jugadores-sug" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 3 (Opc.):</label>
                    <input type="text" id="input-sinergia-3" list="lista-jugadores-sug" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 4 (Opc.):</label>
                    <input type="text" id="input-sinergia-4" list="lista-jugadores-sug" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
            </div>
            <datalist id="lista-jugadores-sug">
                ${Array.from(listaGlobalJugadores).map(j => `<option value="${j}">`).join("")}
            </datalist>
            <button id="btn-consultar-sinergia" style="background: #0d6efd; color: white; border: none; padding: 8px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.9em;">Consultar Sinergia</button>
        </div>
        <div id="resultado-sinergia-container" style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 25px; display: none;"></div>
        <h3 style="margin-top: 20px;">🤝 Rendimiento por Equipos</h3>
        <div style="width: 100%; max-width: 100%; overflow-x: scroll; -webkit-overflow-scrolling: touch; margin-top: 10px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #dee2e6;">
            <table style="width: 100%; min-width: 600px; border-collapse: collapse; background: #fff; font-size: 0.88em;">
                <thead>
                    <tr style="background-color: #343a40; color: #fff; text-align: left;">
                        <th style="padding: 10px 8px; white-space: nowrap;">Equipo / Bando</th>
                        <th style="padding: 10px 8px; white-space: nowrap;">Miembros Integrantes</th>
                        <th style="padding: 10px 8px; text-align: center; white-space: nowrap;">Partidas</th>
                        <th style="padding: 10px 8px; text-align: center; white-space: nowrap;">Victorias</th>
                        <th style="padding: 10px 8px; text-align: center; white-space: nowrap;">Derrotas</th>
                        <th style="padding: 10px 8px; text-align: center; white-space: nowrap;">Efectividad</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (listaEquipos.length === 0) {
        htmlEnfrentamientos += `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6c757d;">No hay equipos registrados en las partidas.</td></tr>`;
    } else {
        listaEquipos.forEach(eq => {
            const totalP = eq.victorias + eq.derrotas;
            const ef = totalP > 0 ? ((eq.victorias / totalP) * 100).toFixed(0) : 0;
            const miembrosArr = Array.from(eq.miembros).join(", ");
            htmlEnfrentamientos += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 8px; white-space: nowrap;"><strong>${eq.nombreEquipo}</strong></td>
                    <td style="padding: 10px 8px; font-size: 0.9em; color: #495057;">${miembrosArr}</td>
                    <td style="padding: 10px 8px; text-align: center;">${totalP}</td>
                    <td style="padding: 10px 8px; text-align: center; color: #198754; font-weight: bold;">${eq.victorias}</td>
                    <td style="padding: 10px 8px; text-align: center; color: #dc3545; font-weight: bold;">${eq.derrotas}</td>
                    <td style="padding: 10px 8px; text-align: center; font-weight: bold; color: ${eq.victorias > 0 && eq.derrotas === 0 ? '#198754' : '#0d6efd'};">${eq.victorias > 0 && eq.derrotas === 0 ? '🏆 Invictos' : ef + '%'}</td>
                </tr>
            `;
        });
    }

    htmlEnfrentamientos += `</tbody></table></div>`;
    secEnfrentamientos.innerHTML = htmlEnfrentamientos;

    // Evento Sinergia
    const btnConsultarSinergia = document.getElementById("btn-consultar-sinergia");
    if (btnConsultarSinergia) {
        btnConsultarSinergia.addEventListener("click", () => {
            const j1 = document.getElementById("input-sinergia-1").value.trim();
            const j2 = document.getElementById("input-sinergia-2").value.trim();
            const j3 = document.getElementById("input-sinergia-3").value.trim();
            const j4 = document.getElementById("input-sinergia-4").value.trim();
            const contenedorResultado = document.getElementById("resultado-sinergia-container");

            let seleccionados = [j1, j2, j3, j4].filter(j => j !== "");
            seleccionados = [...new Set(seleccionados.map(j => obtenerNickOficialEstadisticas(j)))];

            if (seleccionados.length < 2) {
                alert("Debes ingresar al menos 2 jugadores diferentes para calcular la sinergia.");
                return;
            }

            let partidasJuntos = 0;
            let victoriasJuntos = 0;
            let derrotasJuntos = 0;

            partidasDetalleGlobal.forEach(jugadoresPartida => {
                let equiposEnPartida = {};
                jugadoresPartida.forEach(jp => {
                    if (!equiposEnPartida[jp.equipo]) {
                        equiposEnPartida[jp.equipo] = [];
                    }
                    equiposEnPartida[jp.equipo].push(jp);
                });

                Object.values(equiposEnPartida).forEach(miembrosEquipo => {
                    const nombresEnEquipo = miembrosEquipo.map(me => me.nombre);
                    const todosEnEsteEquipo = seleccionados.every(sel => nombresEnEquipo.includes(sel));

                    if (todosEnEsteEquipo) {
                        partidasJuntos++;
                        let todosGanaron = true;
                        let algunoPerdio = false;

                        seleccionados.forEach(sel => {
                            const datosJugador = miembrosEquipo.find(me => me.nombre === sel);
                            if (datosJugador) {
                                if (datosJugador.pg !== 1) todosGanaron = false;
                                if (datosJugador.pp === 1) algunoPerdio = true;
                            }
                        });

                        if (todosGanaron) victoriasJuntos++;
                        else if (algunoPerdio) derrotasJuntos++;
                    }
                });
            });

            contenedorResultado.style.display = "block";
            if (partidasJuntos === 0) {
                contenedorResultado.innerHTML = `
                    <h4 style="color: #343a40; margin-bottom: 10px;">📊 Sinergia para: ${seleccionados.join(" , ")}</h4>
                    <p style="color: #dc3545; margin: 0; font-weight: bold;">⚠️ Partida no existente: Estos jugadores no han participado juntos en el mismo equipo/bando en ninguna partida registrada.</p>
                `;
            } else {
                const efSinergia = ((victoriasJuntos / partidasJuntos) * 100).toFixed(0);
                let badgeEstado = `<span style="color: #0d6efd; font-weight: bold;">${efSinergia}% Efectividad</span>`;
                if (victoriasJuntos > 0 && derrotasJuntos === 0) badgeEstado = `<span style="color: #198754; font-weight: bold;">🔥 ¡Grupo Invicto!</span>`;
                else if (derrotasJuntos > 0 && victoriasJuntos === 0) badgeEstado = `<span style="color: #dc3545; font-weight: bold;">⚠️ Sin victorias conjuntas</span>`;

                contenedorResultado.innerHTML = `
                    <h4 style="color: #343a40; margin-bottom: 15px; border-bottom: 2px solid #0d6efd; padding-bottom: 5px;">📊 Estadística Conjunta (Mismo Equipo): ${seleccionados.join(" , ")}</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; text-align: center;">
                        <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;"><div style="font-size: 0.8em; color: #6c757d;">Partidas Juntos</div><div style="font-size: 1.3em; font-weight: bold; color: #343a40;">${partidasJuntos}</div></div>
                        <div style="background: #e8f5e9; padding: 8px; border-radius: 6px;"><div style="font-size: 0.8em; color: #198754;">Victorias</div><div style="font-size: 1.3em; font-weight: bold; color: #198754;">${victoriasJuntos}</div></div>
                        <div style="background: #ffebee; padding: 8px; border-radius: 6px;"><div style="font-size: 0.8em; color: #dc3545;">Derrotas</div><div style="font-size: 1.3em; font-weight: bold; color: #dc3545;">${derrotasJuntos}</div></div>
                        <div style="background: #e7f1ff; padding: 8px; border-radius: 6px;"><div style="font-size: 0.8em; color: #0d6efd;">Estado Sinergia</div><div style="font-size: 1em; margin-top: 4px;">${badgeEstado}</div></div>
                    </div>
                `;
            }
        });
    }
}
