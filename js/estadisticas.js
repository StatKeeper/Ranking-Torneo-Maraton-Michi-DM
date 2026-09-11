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
    let limpioIngresado = nombreIngresado.toLowerCase().trim();
    
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
        const buscado = lista.find(e => e.antiguo.toLowerCase().includes(limpioIngresado) || limpioIngresado.includes(e.antiguo.toLowerCase()));
        if (buscado) return buscado.oficial;
    }

    for (let key in mapaCorrecciones) {
        if (key.toLowerCase().includes(limpioIngresado) || limpioIngresado.includes(key.toLowerCase())) {
            return mapaCorrecciones[key];
        }
    }

    return nombreIngresado.trim();
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

function convertirSegundosADuracionCorto(segundosTotales) {
    if (!segundosTotales || segundosTotales <= 0) return "00:00";
    const h = Math.floor(segundosTotales / 3600);
    const m = Math.floor((segundosTotales % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
    const mesSeleccionado = selectMes ? selectMes.value : "08";

    const mesesMapInverso = {
        "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
        "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
        "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
    };

    const mesesMapTexto = {
        "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
        "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
        "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12",
        "Agosto": "08", "Septiembre": "09", "Octubre": "10", "Noviembre": "11", "Diciembre": "12"
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

                            stats.unidadesTotales += parseInt(reg.unidadesAsesinadas || reg.UnidadesAsesinadas || reg["U. Ases."] || 0, 10);
                            stats.edificiosTotales += parseInt(reg.edificiosArrasados || reg.EdificiosArrasados || reg["E. Arr."] || 0, 10);
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
    
    const arrayNombresUnicos = Array.from(listaGlobalJugadores).sort();
    const optionsDatalist = arrayNombresUnicos.map(j => `<option value="${j}">`).join("");

    function buscarJugadorFlexible(nombreBusqueda) {
        if (!nombreBusqueda) return null;
        const query = nombreBusqueda.toLowerCase().trim();
        
        let encontrado = listaJugadores.find(j => {
            const n = j.nombre.toLowerCase();
            return n === query || n.includes(query) || query.includes(n);
        });
        if (encontrado) return encontrado;

        return listaJugadores.find(j => {
            const limpio = j.nombre.toLowerCase().replace(/\[.*?\]|\{.*?\}|\*|_/g, "").trim();
            return limpio === query || limpio.includes(query) || query.includes(limpio);
        });
    }

    // ==========================================
    // 1. SUBPESTAÑA TIEMPOS
    // ==========================================
    secTiempos.innerHTML = `
        <h3>⏱️ Consulta Interactiva de Tiempos (2 a 4 Jugadores)</h3>
        <p style="color: #6c757d; font-size: 0.85em; margin-bottom: 12px;">Ingresa de 2 a 4 jugadores para comparar sus estadísticas en pantalla completa.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 12px;">
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 1:</label>
                    <input type="text" id="input-tiempo-1" list="lista-jugadores-global" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 2:</label>
                    <input type="text" id="input-tiempo-2" list="lista-jugadores-global" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 3 (Opc.):</label>
                    <input type="text" id="input-tiempo-3" list="lista-jugadores-global" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 4 (Opc.):</label>
                    <input type="text" id="input-tiempo-4" list="lista-jugadores-global" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
            </div>
            <button id="btn-consultar-tiempos" style="background: #0d6efd; color: white; border: none; padding: 10px 24px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.95em; width: 100%;">Consultar Tiempos</button>
        </div>
        
        <div id="modal-tiempos-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; overflow-y: auto; padding: 10px; box-sizing: border-box;">
            <div id="modal-tiempos-card" style="background: white; max-width: 100%; margin: 10px auto; border-radius: 8px; padding: 12px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 6px;">
                    <button id="btn-descargar-tiempos" title="Descargar como Imagen" style="background: #198754; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; cursor: pointer; font-size: 0.9em; display: flex; align-items: center; justify-content: center;">📥</button>
                    <button id="cerrar-modal-tiempos" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; cursor: pointer; font-size: 1em;">×</button>
                </div>
                <div id="resultado-tiempos-container"></div>
            </div>
        </div>
    `;

    // ==========================================
    // 2. SUBPESTAÑA CIVILIZACIONES
    // ==========================================
    secCivilizaciones.innerHTML = `
        <h3>🏛️ Consulta Interactiva de Civilizaciones (2 a 4 Jugadores)</h3>
        <p style="color: #6c757d; font-size: 0.85em; margin-bottom: 12px;">Ingresa de 2 a 4 jugadores para comparar sus civilizaciones en pantalla completa.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 12px;">
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 1:</label>
                    <input type="text" id="input-civ-1" list="lista-jugadores-global" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 2:</label>
                    <input type="text" id="input-civ-2" list="lista-jugadores-global" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 3 (Opc.):</label>
                    <input type="text" id="input-civ-3" list="lista-jugadores-global" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 4 (Opc.):</label>
                    <input type="text" id="input-civ-4" list="lista-jugadores-global" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
            </div>
            <button id="btn-consultar-civs" style="background: #0d6efd; color: white; border: none; padding: 10px 24px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.95em; width: 100%;">Consultar Civilizaciones</button>
        </div>
        
        <div id="modal-civs-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; overflow-y: auto; padding: 10px; box-sizing: border-box;">
            <div id="modal-civs-card" style="background: white; max-width: 100%; margin: 10px auto; border-radius: 8px; padding: 12px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 6px;">
                    <button id="btn-descargar-civs" title="Descargar como Imagen" style="background: #198754; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; cursor: pointer; font-size: 0.9em; display: flex; align-items: center; justify-content: center;">📥</button>
                    <button id="cerrar-modal-civs" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; cursor: pointer; font-size: 1em;">×</button>
                </div>
                <div id="resultado-civs-container"></div>
            </div>
        </div>
    `;

    // ==========================================
    // 3. SUBPESTAÑA SINERGIA
    // ==========================================
    secEnfrentamientos.innerHTML = `
        <h3>🔍 Consulta Interactiva de Sinergia de Grupo (2 a 4 Jugadores)</h3>
        <p style="color: #6c757d; font-size: 0.85em; margin-bottom: 12px;">Ingresa de 2 a 4 jugadores para conocer sus estadísticas conjuntas en pantalla completa.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 12px;">
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 1:</label>
                    <input type="text" id="input-sinergia-1" list="lista-jugadores-global" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 2:</label>
                    <input type="text" id="input-sinergia-2" list="lista-jugadores-global" placeholder="Selecciona..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 3 (Opc.):</label>
                    <input type="text" id="input-sinergia-3" list="lista-jugadores-global" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #343a40; font-size: 0.85em;">Jugador 4 (Opc.):</label>
                    <input type="text" id="input-sinergia-4" list="lista-jugadores-global" placeholder="Opcional..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box;">
                </div>
            </div>
            <button id="btn-consultar-sinergia" style="background: #0d6efd; color: white; border: none; padding: 10px 24px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.95em; width: 100%;">Consultar Sinergia</button>
        </div>

        <div id="modal-sinergia-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; overflow-y: auto; padding: 10px; box-sizing: border-box;">
            <div id="modal-sinergia-card" style="background: white; max-width: 100%; margin: 10px auto; border-radius: 8px; padding: 12px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 6px;">
                    <button id="btn-descargar-sinergia" title="Descargar como Imagen" style="background: #198754; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; cursor: pointer; font-size: 0.9em; display: flex; align-items: center; justify-content: center;">📥</button>
                    <button id="cerrar-modal-sinergia" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; cursor: pointer; font-size: 1em;">×</button>
                </div>
                <div id="resultado-sinergia-container"></div>
            </div>
        </div>
    `;

    let contenedorDatalistGlobal = document.getElementById("lista-jugadores-global");
    if (!contenedorDatalistGlobal) {
        contenedorDatalistGlobal = document.createElement("datalist");
        contenedorDatalistGlobal.id = "lista-jugadores-global";
        document.body.appendChild(contenedorDatalistGlobal);
    }
    contenedorDatalistGlobal.innerHTML = optionsDatalist;

    // ==========================================
    // EVENTOS Y MODALES
    // ==========================================

    // 1. Tiempos
    const btnConsultarTiempos = document.getElementById("btn-consultar-tiempos");
    const modalTiemposOverlay = document.getElementById("modal-tiempos-overlay");
    const cerrarModalTiempos = document.getElementById("cerrar-modal-tiempos");
    const btnDescargarTiempos = document.getElementById("btn-descargar-tiempos");

    if (btnConsultarTiempos) {
        btnConsultarTiempos.addEventListener("click", () => {
            const val1 = document.getElementById("input-tiempo-1").value;
            const val2 = document.getElementById("input-tiempo-2").value;
            const val3 = document.getElementById("input-tiempo-3").value;
            const val4 = document.getElementById("input-tiempo-4").value;
            const contenedorResultado = document.getElementById("resultado-tiempos-container");

            let inputsRaw = [val1, val2, val3, val4].filter(v => v.trim() !== "");
            if (inputsRaw.length < 2) {
                alert("Debes ingresar al menos 2 jugadores para comparar.");
                return;
            }

            let seleccionadosNombres = [];
            inputsRaw.forEach(inp => {
                const encontrado = buscarJugadorFlexible(inp);
                if (encontrado) {
                    seleccionadosNombres.push(encontrado.nombre);
                } else {
                    seleccionadosNombres.push(inp.trim());
                }
            });
            seleccionadosNombres = [...new Set(seleccionadosNombres)];

            // Cálculo acumulado de unidades y edificios desde partidasDetalleGlobal
            let estadisticasPartidasJugadores = {};
            seleccionadosNombres.forEach(nombre => {
                estadisticasPartidasJugadores[nombre] = { units: 0, edificios: 0 };
            });

            if (typeof partidasDetalleGlobal !== 'undefined' && Array.isArray(partidasDetalleGlobal)) {
                partidasDetalleGlobal.forEach(partida => {
                    partida.forEach(p => {
                        seleccionadosNombres.forEach(sel => {
                            if (p.nombre && p.nombre.toLowerCase() === sel.toLowerCase()) {
                                estadisticasPartidasJugadores[sel].units += Number(p.unidades || p.unidadesAsesinadas || p.kills || 0);
                                estadisticasPartidasJugadores[sel].edificios += Number(p.edificios || p.edificiosArrasados || p.buildings || 0);
                            }
                        });
                    });
                });
            }

            let htmlTablaComparativa = `
                <h3 style="color: #343a40; margin-top: 0; margin-bottom: 6px; font-size: 0.9em; border-bottom: 2px solid #0d6efd; padding-bottom: 4px; padding-right: 65px;">📊 Comparativa de Tiempos y Estadísticas</h3>
                
                <div style="background: #f8f9fa; padding: 5px 6px; border-radius: 4px; margin-bottom: 6px; font-size: 0.62em; color: #495057; border-left: 3px solid #0d6efd; line-height: 1.2;">
                    <strong>Leyenda:</strong> <strong>P.</strong>: Partidas | <strong>T.A.</strong>: Tiempo Acumulado | <strong>P.T.A.</strong>: Promedio Tiempo Acumulado | <strong>U.Ases.</strong>: Unidades Asesinadas | <strong>P.U.Ases.</strong>: Promedio Unidades | <strong>E.Arr.</strong>: Edificios Arrasados | <strong>P.E.Arr.</strong>: Promedio Edificios
                </div>

                <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                    <table style="width: 100%; min-width: ${seleccionadosNombres.length * 95 + 50}px; border-collapse: collapse; background: #fff; font-size: 0.7em;">
                        <thead>
                            <tr style="background-color: #343a40; color: #fff;">
                                <th style="padding: 5px 3px; text-align: left; font-size: 0.85em;">Métrica</th>
            `;
            seleccionadosNombres.forEach(sel => {
                htmlTablaComparativa += `<th style="padding: 5px 3px; text-align: center; white-space: nowrap; font-size: 0.85em;">${sel}</th>`;
            });
            htmlTablaComparativa += `</tr></thead><tbody>`;

            const metricasT = [
                { label: "P.", fn: j => j.totalPartidas || 0 },
                { label: "T.A.", fn: j => convertirSegundosADuracionCorto(j.segundosTotales || 0) },
                { label: "P.T.A.", fn: j => convertirSegundosADuracionCorto(j.totalPartidas > 0 ? Math.round(j.segundosTotales / j.totalPartidas) : 0) },
                { label: "U.Ases.", fn: j => {
                    const calc = estadisticasPartidasJugadores[j.nombre]?.units;
                    return (calc !== undefined && calc > 0) ? calc : (j.unidadesTotales ?? j.unidades ?? j.unidadesAsesinadas ?? 0);
                }},
                { label: "P.U.Ases.", fn: j => {
                    const calc = estadisticasPartidasJugadores[j.nombre]?.units ?? (j.unidadesTotales ?? j.unidades ?? j.unidadesAsesinadas ?? 0);
                    return j.totalPartidas > 0 ? (calc / j.totalPartidas).toFixed(1) : "0.0";
                }},
                { label: "E.Arr.", fn: j => {
                    const calc = estadisticasPartidasJugadores[j.nombre]?.edificios;
                    return (calc !== undefined && calc > 0) ? calc : (j.edificiosTotales ?? j.edificios ?? j.edificiosArrasados ?? 0);
                }},
                { label: "P.E.Arr.", fn: j => {
                    const calc = estadisticasPartidasJugadores[j.nombre]?.edificios ?? (j.edificiosTotales ?? j.edificios ?? j.edificiosArrasados ?? 0);
                    return j.totalPartidas > 0 ? (calc / j.totalPartidas).toFixed(1) : "0.0";
                }}
            ];

            metricasT.forEach((metrica, idx) => {
                const bgRow = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
                htmlTablaComparativa += `<tr style="border-bottom: 1px solid #dee2e6; background-color: ${bgRow};">`;
                htmlTablaComparativa += `<td style="padding: 5px 3px; font-weight: bold; color: #343a40; white-space: nowrap;">${metrica.label}</td>`;
                
                seleccionadosNombres.forEach(sel => {
                    const jData = listaJugadores.find(j => j.nombre.toLowerCase() === sel.toLowerCase() || j.nombre.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(j.nombre.toLowerCase()));
                    const valor = jData ? metrica.fn(jData) : "-";
                    htmlTablaComparativa += `<td style="padding: 5px 3px; text-align: center; white-space: nowrap;">${valor}</td>`;
                });
                htmlTablaComparativa += `</tr>`;
            });

            htmlTablaComparativa += `</tbody></table></div>`;
            contenedorResultado.innerHTML = htmlTablaComparativa;
            modalTiemposOverlay.style.display = "block";
        });
    }

            let seleccionadosNombres = [];
            inputsRaw.forEach(inp => {
                const encontrado = buscarJugadorFlexible(inp);
                if (encontrado) {
                    seleccionadosNombres.push(encontrado.nombre);
                } else {
                    seleccionadosNombres.push(inp.trim());
                }
            });
            seleccionadosNombres = [...new Set(seleccionadosNombres)];

            let htmlTablaComparativa = `
                <h3 style="color: #343a40; margin-top: 0; margin-bottom: 6px; font-size: 0.9em; border-bottom: 2px solid #0d6efd; padding-bottom: 4px; padding-right: 65px;">📊 Comparativa de Tiempos y Estadísticas</h3>
                
                <div style="background: #f8f9fa; padding: 5px 6px; border-radius: 4px; margin-bottom: 6px; font-size: 0.62em; color: #495057; border-left: 3px solid #0d6efd; line-height: 1.2;">
                    <strong>Leyenda:</strong> <strong>P.</strong>: Partidas | <strong>T.A.</strong>: Tiempo Acumulado | <strong>P.T.A.</strong>: Promedio Tiempo Acumulado | <strong>U.Ases.</strong>: Unidades Asesinadas | <strong>P.U.Ases.</strong>: Promedio Unidades | <strong>E.Arr.</strong>: Edificios Arrasados | <strong>P.E.Arr.</strong>: Promedio Edificios
                </div>

                <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                    <table style="width: 100%; min-width: ${seleccionadosNombres.length * 95 + 50}px; border-collapse: collapse; background: #fff; font-size: 0.7em;">
                        <thead>
                            <tr style="background-color: #343a40; color: #fff;">
                                <th style="padding: 5px 3px; text-align: left; font-size: 0.85em;">Métrica</th>
            `;
            seleccionadosNombres.forEach(sel => {
                htmlTablaComparativa += `<th style="padding: 5px 3px; text-align: center; white-space: nowrap; font-size: 0.85em;">${sel}</th>`;
            });
            htmlTablaComparativa += `</tr></thead><tbody>`;

            const metricasT = [
    { label: "P.", fn: j => j.totalPartidas || 0 },
    { label: "T.A.", fn: j => convertirSegundosADuracionCorto(j.segundosTotales || 0) },
    { label: "P.T.A.", fn: j => convertirSegundosADuracionCorto(j.totalPartidas > 0 ? Math.round(j.segundosTotales / j.totalPartidas) : 0) },
    { label: "U.Ases.", fn: j => j.unidadesTotales ?? j.unidades ?? j.unidadesAsesinadas ?? 0 },
    { label: "P.U.Ases.", fn: j => {
        const u = j.unidadesTotales ?? j.unidades ?? j.unidadesAsesinadas ?? 0;
        return j.totalPartidas > 0 ? (u / j.totalPartidas).toFixed(1) : "0.0";
    }},
    { label: "E.Arr.", fn: j => j.edificiosTotales ?? j.edificios ?? j.edificiosArrasados ?? 0 },
    { label: "P.E.Arr.", fn: j => {
        const e = j.edificiosTotales ?? j.edificios ?? j.edificiosArrasados ?? 0;
        return j.totalPartidas > 0 ? (e / j.totalPartidas).toFixed(1) : "0.0";
    }}
];
            metricasT.forEach((metrica, idx) => {
                const bgRow = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
                htmlTablaComparativa += `<tr style="border-bottom: 1px solid #dee2e6; background-color: ${bgRow};">`;
                htmlTablaComparativa += `<td style="padding: 5px 3px; font-weight: bold; color: #343a40; white-space: nowrap;">${metrica.label}</td>`;
                
                seleccionadosNombres.forEach(sel => {
                    const jData = listaJugadores.find(j => j.nombre.toLowerCase() === sel.toLowerCase() || j.nombre.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(j.nombre.toLowerCase()));
                    const valor = jData ? metrica.fn(jData) : "-";
                    htmlTablaComparativa += `<td style="padding: 5px 3px; text-align: center; white-space: nowrap;">${valor}</td>`;
                });
                htmlTablaComparativa += `</tr>`;
            });

            htmlTablaComparativa += `</tbody></table></div>`;
            contenedorResultado.innerHTML = htmlTablaComparativa;
            modalTiemposOverlay.style.display = "block";
        });
    }

    if (cerrarModalTiempos) {
        cerrarModalTiempos.addEventListener("click", () => { modalTiemposOverlay.style.display = "none"; });
    }

    if (btnDescargarTiempos) {
        btnDescargarTiempos.addEventListener("click", () => {
            ejecutarCapturaHtml2Canvas(document.getElementById("modal-tiempos-card"), 'comparativa_tiempos_michi.png');
        });
    }

    // 2. Civilizaciones
    const btnConsultarCivs = document.getElementById("btn-consultar-civs");
    const modalCivsOverlay = document.getElementById("modal-civs-overlay");
    const cerrarModalCivs = document.getElementById("cerrar-modal-civs");
    const btnDescargarCivs = document.getElementById("btn-descargar-civs");

    if (btnConsultarCivs) {
        btnConsultarCivs.addEventListener("click", () => {
            const val1 = document.getElementById("input-civ-1").value;
            const val2 = document.getElementById("input-civ-2").value;
            const val3 = document.getElementById("input-civ-3").value;
            const val4 = document.getElementById("input-civ-4").value;
            const contenedorResultado = document.getElementById("resultado-civs-container");

            let inputsRaw = [val1, val2, val3, val4].filter(v => v.trim() !== "");
            if (inputsRaw.length < 2) {
                alert("Debes ingresar al menos 2 jugadores para comparar civilizaciones.");
                return;
            }

            let seleccionadosNombres = [];
            inputsRaw.forEach(inp => {
                const encontrado = buscarJugadorFlexible(inp);
                if (encontrado) {
                    seleccionadosNombres.push(encontrado.nombre);
                } else {
                    seleccionadosNombres.push(inp.trim());
                }
            });
            seleccionadosNombres = [...new Set(seleccionadosNombres)];

            let civsSet = new Set();
            seleccionadosNombres.forEach(sel => {
                const realKey = Object.keys(estadisticasJugadorCiv).find(k => k.toLowerCase() === sel.toLowerCase() || k.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(k.toLowerCase()));
                if (realKey && estadisticasJugadorCiv[realKey]) {
                    Object.keys(estadisticasJugadorCiv[realKey]).forEach(c => civsSet.add(c));
                }
            });

            let listaCivsComparativa = Array.from(civsSet);

            let htmlTablaCivs = `
                <h3 style="color: #343a40; margin-top: 0; margin-bottom: 6px; font-size: 0.9em; border-bottom: 2px solid #0d6efd; padding-bottom: 4px; padding-right: 65px;">📊 Comparativa de Civilizaciones</h3>
            `;

            if (listaCivsComparativa.length === 0) {
                htmlTablaCivs += `<p style="color: #dc3545; font-weight: bold; font-size: 0.8em;">⚠️ No se encontraron civilizaciones registradas para los jugadores seleccionados.</p>`;
            } else {
                htmlTablaCivs += `
                    <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                        <table style="width: 100%; min-width: ${seleccionadosNombres.length * 100 + 70}px; border-collapse: collapse; background: #fff; font-size: 0.7em;">
                            <thead>
                                <tr style="background-color: #343a40; color: #fff;">
                                    <th style="padding: 5px 3px; text-align: left; font-size: 0.85em;">Civ</th>
                `;
                seleccionadosNombres.forEach(sel => {
                    htmlTablaCivs += `<th style="padding: 5px 3px; text-align: center; white-space: nowrap; font-size: 0.85em;">${sel}</th>`;
                });
                htmlTablaCivs += `</tr></thead><tbody>`;

                listaCivsComparativa.forEach((civ, idx) => {
                    const bgRow = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
                    htmlTablaCivs += `<tr style="border-bottom: 1px solid #dee2e6; background-color: ${bgRow};">`;
                    htmlTablaCivs += `<td style="padding: 5px 3px; font-weight: bold; color: #343a40; white-space: nowrap;">${civ}</td>`;

                    seleccionadosNombres.forEach(sel => {
                        const realKey = Object.keys(estadisticasJugadorCiv).find(k => k.toLowerCase() === sel.toLowerCase() || k.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(k.toLowerCase()));
                        let textoCelda = "-";
                        if (realKey && estadisticasJugadorCiv[realKey] && estadisticasJugadorCiv[realKey][civ]) {
                            const datosCiv = estadisticasJugadorCiv[realKey][civ];
                            const winRate = datosCiv.jugadas > 0 ? Math.round((datosCiv.victorias / datosCiv.jugadas) * 100) : 0;
                            textoCelda = `${datosCiv.jugadas}p (${winRate}%)`;
                        }
                        htmlTablaCivs += `<td style="padding: 5px 3px; text-align: center; white-space: nowrap;">${textoCelda}</td>`;
                    });
                    htmlTablaCivs += `</tr>`;
                });
                htmlTablaCivs += `</tbody></table></div>`;
            }

            contenedorResultado.innerHTML = htmlTablaCivs;
            modalCivsOverlay.style.display = "block";
        });
    }

    if (cerrarModalCivs) {
        cerrarModalCivs.addEventListener("click", () => { modalCivsOverlay.style.display = "none"; });
    }

    if (btnDescargarCivs) {
        btnDescargarCivs.addEventListener("click", () => {
            ejecutarCapturaHtml2Canvas(document.getElementById("modal-civs-card"), 'comparativa_civilizaciones_michi.png');
        });
    }

    // 3. Sinergia
    const btnConsultarSinergia = document.getElementById("btn-consultar-sinergia");
    const modalSinergiaOverlay = document.getElementById("modal-sinergia-overlay");
    const cerrarModalSinergia = document.getElementById("cerrar-modal-sinergia");
    const btnDescargarSinergia = document.getElementById("btn-descargar-sinergia");

    if (btnConsultarSinergia) {
        btnConsultarSinergia.addEventListener("click", () => {
            const val1 = document.getElementById("input-sinergia-1").value;
            const val2 = document.getElementById("input-sinergia-2").value;
            const val3 = document.getElementById("input-sinergia-3").value;
            const val4 = document.getElementById("input-sinergia-4").value;
            const contenedorResultado = document.getElementById("resultado-sinergia-container");

            let inputsRaw = [val1, val2, val3, val4].filter(v => v.trim() !== "");
            if (inputsRaw.length < 2) {
                alert("Debes ingresar al menos 2 jugadores para calcular la sinergia.");
                return;
            }

            let seleccionadosNombres = [];
            inputsRaw.forEach(inp => {
                const encontrado = buscarJugadorFlexible(inp);
                if (encontrado) {
                    seleccionadosNombres.push(encontrado.nombre);
                } else {
                    seleccionadosNombres.push(inp.trim());
                }
            });
            seleccionadosNombres = [...new Set(seleccionadosNombres)];

            // Cálculo de partidas conjuntas
            let partidasJuntos = 0;
            let victoriasConjuntas = 0;
            let derrotasConjuntas = 0;

            partidasDetalleGlobal.forEach(partida => {
                const nombresEnPartida = partida.map(p => p.nombre.toLowerCase());
                const todosEstan = seleccionadosNombres.every(sel => nombresEnPartida.includes(sel.toLowerCase()));

                if (todosEstan) {
                    const registrosSeleccionados = partida.filter(p => seleccionadosNombres.some(sel => sel.toLowerCase() === p.nombre.toLowerCase()));
                    
                    const primerEquipo = registrosSeleccionados[0] ? registrosSeleccionados[0].equipo : null;
                    const mismoEquipo = primerEquipo && primerEquipo !== "Sin Equipo" && registrosSeleccionados.every(p => p.equipo === primerEquipo);
                    
                    const todosGanaron = registrosSeleccionados.every(p => p.pg === 1);
                    const todosPerdieron = registrosSeleccionados.every(p => p.pp === 1);

                    if (mismoEquipo || todosGanaron) {
                        partidasJuntos++;
                        victoriasConjuntas++;
                    } else if (todosPerdieron) {
                        partidasJuntos++;
                        derrotasConjuntas++;
                    }
                }
            });

            const efectividad = partidasJuntos > 0 ? Math.round((victoriasConjuntas / partidasJuntos) * 100) : 0;
            let textoEfectividad = `${efectividad}%`;
            if (partidasJuntos > 0 && victoriasConjuntas === partidasJuntos) {
                textoEfectividad = `🔥 Invictos (100%)`;
            } else if (partidasJuntos > 0 && derrotasConjuntas === partidasJuntos) {
                textoEfectividad = `❌ 0%`;
            }

            const listaNombresStr = seleccionadosNombres.join(", ");

            let htmlTablaSinergia = `
                <h3 style="color: #343a40; margin-top: 0; margin-bottom: 6px; font-size: 0.9em; border-bottom: 2px solid #0d6efd; padding-bottom: 4px; padding-right: 65px;">🤝 Sinergia Grupal</h3>
                
                <div style="background: #f8f9fa; padding: 5px 6px; border-radius: 4px; margin-bottom: 8px; font-size: 0.62em; color: #495057; border-left: 3px solid #0d6efd; line-height: 1.2;">
                    <strong>Leyenda:</strong> <strong>P.</strong>: Partidas Juntos | <strong>V.</strong>: Victorias | <strong>D.</strong>: Derrotas | <strong>Efec. Conjunta</strong>: Efectividad Conjunta
                </div>

                <div style="font-weight: bold; color: #343a40; font-size: 0.78em; margin-bottom: 12px; line-height: 1.3;">
                    ${listaNombresStr}
                </div>
            `;

            if (partidasJuntos === 0) {
                htmlTablaSinergia += `
                    <div style="width: 100%; text-align: center; padding: 15px 10px; background: #fff5f5; border: 1px dashed #dc3545; border-radius: 6px; margin-top: 10px;">
                        <span style="color: #dc3545; font-weight: bold; font-size: 0.75em; line-height: 1.4; display: inline-block;">
                            ⚠️ Estos jugadores nunca jugaron en conjunto, nunca formaron un equipo como para tener estadísticas.
                        </span>
                    </div>
                `;
            } else {
                htmlTablaSinergia += `
                    <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin-top: 6px;">
                        <table style="width: 100%; border-collapse: collapse; background: #fff; font-size: 0.7em;">
                            <thead>
                                <tr style="background-color: #343a40; color: #fff;">
                                    <th style="padding: 6px 4px; text-align: center; font-size: 0.85em;">P.</th>
                                    <th style="padding: 6px 4px; text-align: center; font-size: 0.85em;">V.</th>
                                    <th style="padding: 6px 4px; text-align: center; font-size: 0.85em;">D.</th>
                                    <th style="padding: 6px 4px; text-align: center; font-size: 0.85em;">Efec. Conjunta</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid #dee2e6; background-color: #f8f9fa;">
                                    <td style="padding: 8px 4px; text-align: center; font-weight: bold;">${partidasJuntos}</td>
                                    <td style="padding: 8px 4px; text-align: center; font-weight: bold; color: #198754;">${victoriasConjuntas}</td>
                                    <td style="padding: 8px 4px; text-align: center; font-weight: bold; color: #dc3545;">${derrotasConjuntas}</td>
                                    <td style="padding: 8px 4px; text-align: center; font-weight: bold;">${textoEfectividad}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }

            contenedorResultado.innerHTML = htmlTablaSinergia;
            modalSinergiaOverlay.style.display = "block";
        });
    }

    if (cerrarModalSinergia) {
        cerrarModalSinergia.addEventListener("click", () => { modalSinergiaOverlay.style.display = "none"; });
    }

    if (btnDescargarSinergia) {
        btnDescargarSinergia.addEventListener("click", () => {
            ejecutarCapturaHtml2Canvas(document.getElementById("modal-sinergia-card"), 'sinergia_grupal_michi.png');
        });
    }
}
