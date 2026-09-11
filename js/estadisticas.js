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

// Formato HH:MM sin segundos para ahorrar espacio horizontal
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
    // 3. SUBPESTAÑA SINERGIA / EQUIPOS (CON MODAL Y DESCARGA)
    // ==========================================
    const listaEquipos = Object.values(estadisticasEquipos);
    secEnfrentamientos.innerHTML = `
        <h3>🔍 Consulta Interactiva de Sinergia de Grupo (2 a 4 Jugadores)</h3>
        <p style="color: #6c757d; font-size: 0.85em; margin-bottom: 12px;">Ingresa de 2 a 4 jugadores para conocer sus estadísticas conjuntas en pantalla completa.</p>
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

    // ==========================================
    // EVENTOS Y MODALES (CON DESCARGA 📥)
    // ==========================================

    // 1. Evento Tiempos
    const btnConsultarTiempos = document.getElementById("btn-consultar-tiempos");
    const modalTiemposOverlay = document.getElementById("modal-tiempos-overlay");
    const cerrarModalTiempos = document.getElementById("cerrar-modal-tiempos");
    const btnDescargarTiempos = document.getElementById("btn-descargar-tiempos");

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
                <h3 style="color: #343a40; margin-top: 0; margin-bottom: 6px; font-size: 0.9em; border-bottom: 2px solid #0d6efd; padding-bottom: 4px; padding-right: 65px;">📊 Comparativa de Tiempos</h3>
                
                <div style="background: #f8f9fa; padding: 5px 6px; border-radius: 4px; margin-bottom: 6px; font-size: 0.62em; color: #495057; border-left: 3px solid #0d6efd; line-height: 1.2;">
                    <strong>Leyenda:</strong> <strong>P.</strong>: Partidas | <strong>Dur.A.</strong>: Duración Acumulada | <strong>P.Dur.</strong>: Promedio Duración | <strong>T.Un.</strong>: Total Unidades | <strong>P.Un.</strong>: Promedio Unidades | <strong>T.Ed.</strong>: Total Edificios | <strong>P.Ed.</strong>: Promedio Edificios
                </div>

                <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                    <table style="width: 100%; min-width: ${seleccionados.length * 95 + 50}px; border-collapse: collapse; background: #fff; font-size: 0.7em;">
                        <thead>
                            <tr style="background-color: #343a40; color: #fff;">
                                <th style="padding: 5px 3px; text-align: left; font-size: 0.85em;">Métrica</th>
            `;
            seleccionados.forEach(sel => {
                htmlTablaComparativa += `<th style="padding: 5px 3px; text-align: center; white-space: nowrap; font-size: 0.85em;">${sel}</th>`;
            });
            htmlTablaComparativa += `</tr></thead><tbody>`;

            const metricasT = [
                { label: "P.", fn: j => j.totalPartidas },
                { label: "Dur.A.", fn: j => convertirSegundosADuracionCorto(j.segundosTotales) },
                { label: "P.Dur.", fn: j => convertirSegundosADuracionCorto(j.totalPartidas > 0 ? Math.round(j.segundosTotales / j.totalPartidas) : 0) },
                { label: "T.Un.", fn: j => j.unidadesTotales },
                { label: "P.Un.", fn: j => j.totalPartidas > 0 ? (j.unidadesTotales / j.totalPartidas).toFixed(1) : 0 },
                { label: "T.Ed.", fn: j => j.edificiosTotales },
                { label: "P.Ed.", fn: j => j.totalPartidas > 0 ? (j.edificiosTotales / j.totalPartidas).toFixed(1) : 0 }
            ];

            metricasT.forEach((metrica, idx) => {
                const bgRow = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
                htmlTablaComparativa += `<tr style="border-bottom: 1px solid #dee2e6; background-color: ${bgRow};">`;
                htmlTablaComparativa += `<td style="padding: 5px 3px; font-weight: bold; color: #343a40; white-space: nowrap;">${metrica.label}</td>`;
                
                seleccionados.forEach(sel => {
                    const jData = listaJugadores.find(j => j.nombre.toLowerCase() === sel.toLowerCase());
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
            const card = document.getElementById("modal-tiempos-card");
            ejecutarCapturaHtml2Canvas(card, 'comparativa_tiempos_michi.png');
        });
    }

    // 2. Evento Civilizaciones
    const btnConsultarCivs = document.getElementById("btn-consultar-civs");
    const modalCivsOverlay = document.getElementById("modal-civs-overlay");
    const cerrarModalCivs = document.getElementById("cerrar-modal-civs");
    const btnDescargarCivs = document.getElementById("btn-descargar-civs");

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
                <h3 style="color: #343a40; margin-top: 0; margin-bottom: 6px; font-size: 0.9em; border-bottom: 2px solid #0d6efd; padding-bottom: 4px; padding-right: 65px;">📊 Comparativa de Civilizaciones</h3>
            `;

            if (listaCivsComparativa.length === 0) {
                htmlTablaCivs += `<p style="color: #dc3545; font-weight: bold; font-size: 0.8em;">⚠️ No se encontraron civilizaciones registradas para los jugadores seleccionados.</p>`;
            } else {
                htmlTablaCivs += `
                    <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                        <table style="width: 100%; min-width: ${seleccionados.length * 100 + 70}px; border-collapse: collapse; background: #fff; font-size: 0.7em;">
                            <thead>
                                <tr style="background-color: #343a40; color: #fff;">
                                    <th style="padding: 5px 3px; text-align: left; font-size: 0.85em;">Civ</th>
                `;
                seleccionados.forEach(sel => {
                    htmlTablaCivs += `<th style="padding: 5px 3px; text-align: center; white-space: nowrap; font-size: 0.85em;">${sel} (Part/WR)</th>`;
                });
                htmlTablaCivs += `</tr></thead><tbody>`;

                listaCivsComparativa.forEach((civ, idx) => {
                    const bgRow = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
                    htmlTablaCivs += `<tr style="border-bottom: 1px solid #dee2e6; background-color: ${bgRow};">`;
                    htmlTablaCivs += `<td style="padding: 5px 3px; font-weight: bold; color: #343a40; white-space: nowrap;">🏛️ ${civ}</td>`;

                    seleccionados.forEach(sel => {
                        const datosJugCiv = estadisticasJugadorCiv[sel] && estadisticasJugadorCiv[sel][civ];
                        if (datosJugCiv && datosJugCiv.jugadas > 0) {
                            const wr = ((datosJugCiv.victorias / datosJugCiv.jugadas) * 100).toFixed(0);
                            htmlTablaCivs += `<td style="padding: 5px 3px; text-align: center; white-space: nowrap;">${datosJugCiv.jugadas}p (${wr}%)</td>`;
                        } else {
                            htmlTablaCivs += `<td style="padding: 5px 3px; text-align: center; color: #adb5bd; white-space: nowrap;">-</td>`;
                        }
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
            const card = document.getElementById("modal-civs-card");
            ejecutarCapturaHtml2Canvas(card, 'comparativa_civs_michi.png');
        });
    }

    // 3. Evento Sinergia
    const btnConsultarSinergia = document.getElementById("btn-consultar-sinergia");
    const modalSinergiaOverlay = document.getElementById("modal-sinergia-overlay");
    const cerrarModalSinergia = document.getElementById("cerrar-modal-sinergia");
    const btnDescargarSinergia = document.getElementById("btn-descargar-sinergia");

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

            if (partidasJuntos === 0) {
                contenedorResultado.innerHTML = `
                    <h3 style="color: #343a40; margin-top: 0; font-size: 0.95em; border-bottom: 2px solid #0d6efd; padding-bottom: 4px; padding-right: 65px;">🤝 Sinergia Grupal</h3>
                    <p style="color: #dc3545; margin: 10px 0; font-weight: bold; font-size: 0.85em;">⚠️ Partida no existente: Estos jugadores no han participado juntos en el mismo equipo/bando en ninguna partida registrada.</p>
                `;
            } else {
                const efSinergia = ((victoriasJuntos / partidasJuntos) * 100).toFixed(0);
                let badgeEstado = `<span style="color: #0d6efd; font-weight: bold;">${efSinergia}% Efectividad</span>`;
                if (victoriasJuntos > 0 && derrotasJuntos === 0) badgeEstado = `<span style="color: #198754; font-weight: bold;">🔥 ¡Grupo Invicto!</span>`;
                else if (derrotasJuntos > 0 && victoriasJuntos === 0) badgeEstado = `<span style="color: #dc3545; font-weight: bold;">⚠️ Sin victorias conjuntas</span>`;

                contenedorResultado.innerHTML = `
                    <h3 style="color: #343a40; margin-top: 0; margin-bottom: 8px; font-size: 0.95em; border-bottom: 2px solid #0d6efd; padding-bottom: 4px; padding-right: 65px;">🤝 Sinergia: ${seleccionados.join(" , ")}</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; text-align: center; font-size: 0.8em;">
                        <div style="background: #f8f9fa; padding: 6px; border-radius: 6px;"><div style="color: #6c757d;">Partidas Juntos</div><div style="font-size: 1.2em; font-weight: bold; color: #343a40;">${partidasJuntos}</div></div>
                        <div style="background: #e8f5e9; padding: 6px; border-radius: 6px;"><div style="color: #198754;">Victorias</div><div style="font-size: 1.2em; font-weight: bold; color: #198754;">${victoriasJuntos}</div></div>
                        <div style="background: #ffebee; padding: 6px; border-radius: 6px;"><div style="color: #dc3545;">Derrotas</div><div style="font-size: 1.2em; font-weight: bold; color: #dc3545;">${derrotasJuntos}</div></div>
                        <div style="background: #e7f1ff; padding: 6px; border-radius: 6px;"><div style="color: #0d6efd;">Estado</div><div style="font-size: 0.9em; margin-top: 2px;">${badgeEstado}</div></div>
                    </div>
                `;
            }
            modalSinergiaOverlay.style.display = "block";
        });
    }

    if (cerrarModalSinergia) {
        cerrarModalSinergia.addEventListener("click", () => { modalSinergiaOverlay.style.display = "none"; });
    }

    if (btnDescargarSinergia) {
        btnDescargarSinergia.addEventListener("click", () => {
            const card = document.getElementById("modal-sinergia-card");
            ejecutarCapturaHtml2Canvas(card, 'comparativa_sinergia_michi.png');
        });
    }
}

function ejecutarCapturaHtml2Canvas(elementoCard, nombreArchivo) {
    if (typeof html2canvas !== 'undefined') {
        html2canvas(elementoCard, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = nombreArchivo;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => {
            html2canvas(elementoCard, { scale: 2 }).then(canvas => {
                const link = document.createElement('a');
                link.download = nombreArchivo;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        };
        document.head.appendChild(script);
    }
}
