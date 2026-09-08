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
    let estadisticasEquipos = {};
    let listaGlobalJugadores = new Set();
    let partidasDetalleGlobal = [];

    const selectAnio = document.getElementById("select-anio") || document.getElementById("anio");
    const selectMes = document.getElementById("select-mes") || document.getElementById("mes");
    const anioSeleccionado = selectAnio ? selectAnio.value : "2026";
    const mesSeleccionado = selectMes ? selectMes.value : "Agosto";

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        
        if (clave && clave.startsWith("registros_")) {
            if (clave.includes(mesSeleccionado) && clave.includes(anioSeleccionado)) {
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

                            // 1. Estadísticas Individuales
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

                            // 2. Estadísticas de Civilizaciones corregidas de forma robusta
                            const civRaw = reg.civ || reg.Civ || reg.civilizacion || reg.Civilizacion || "Desconocida";
                            const civ = String(civRaw).trim();
                            if (civ && civ !== "-" && civ !== "Desconocida") {
                                if (!estadisticasCivilizaciones[civ]) {
                                    estadisticasCivilizaciones[civ] = { civ: civ, jugadas: 0, victorias: 0, derrotas: 0 };
                                }
                                estadisticasCivilizaciones[civ].jugadas++;
                                if (pg === 1) estadisticasCivilizaciones[civ].victorias++;
                                if (pp === 1) estadisticasCivilizaciones[civ].derrotas++;
                            }

                            // 3. Estadísticas por Equipo
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
                    console.error("Error al procesar registros para estadísticas:", e);
                }
            }
        }
    }

    // ==========================================
    // RENDERIZAR VISTA 1: TIEMPOS DE PARTIDA Y TOTALES
    // ==========================================
    const listaJugadores = Object.values(estadisticasJugadores).filter(j => j.totalPartidas > 0);
    let htmlTiempos = `
        <h3>⏱️ Tiempos de Partida, Totales y Promedios por Jugador</h3>
        <div style="background: #f8f9fa; padding: 12px 15px; border-radius: 6px; margin-top: 10px; margin-bottom: 15px; font-size: 0.9em; border-left: 4px solid #0d6efd;">
            <strong>Leyenda de Diminutivos:</strong>
            <ul style="margin: 5px 0 0 20px; padding: 0; color: #495057;">
                <li><strong>Part.</strong>: Partidas Registradas</li>
                <li><strong>Dur. Acum.</strong>: Duración Total Acumulada</li>
                <li><strong>Prom. Dur.</strong>: Promedio de Duración por Partida</li>
                <li><strong>Tot. Unid.</strong>: Total de Unidades Asesinadas</li>
                <li><strong>Prom. Unid.</strong>: Promedio de Unidades Asesinadas por Partida</li>
                <li><strong>Tot. Edif.</strong>: Total de Edificios Arrasados</li>
                <li><strong>Prom. Edif.</strong>: Promedio de Edificios Arrasados por Partida</li>
            </ul>
        </div>
        <div style="overflow-x: auto; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background-color: #343a40; color: #fff; text-align: left;">
                        <th style="padding: 12px;">Jugador</th>
                        <th style="padding: 12px;">Part.</th>
                        <th style="padding: 12px;">Dur. Acum.</th>
                        <th style="padding: 12px;">Prom. Dur.</th>
                        <th style="padding: 12px;">Tot. Unid.</th>
                        <th style="padding: 12px;">Prom. Unid.</th>
                        <th style="padding: 12px;">Tot. Edif.</th>
                        <th style="padding: 12px;">Prom. Edif.</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (listaJugadores.length === 0) {
        htmlTiempos += `<tr><td colspan="8" style="text-align: center; padding: 25px; color: #6c757d;">No hay registros de tiempos disponibles para este periodo.</td></tr>`;
    } else {
        listaJugadores.sort((a, b) => b.totalPartidas - a.totalPartidas);
        listaJugadores.forEach(j => {
            const promedioSeg = j.totalPartidas > 0 ? Math.round(j.segundosTotales / j.totalPartidas) : 0;
            const promedioUnidades = j.totalPartidas > 0 ? (j.unidadesTotales / j.totalPartidas).toFixed(1) : 0;
            const promedioEdificios = j.totalPartidas > 0 ? (j.edificiosTotales / j.totalPartidas).toFixed(1) : 0;

            htmlTiempos += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px;"><strong>${j.nombre}</strong></td>
                    <td style="padding: 12px;">${j.totalPartidas}</td>
                    <td style="padding: 12px;">${convertirSegundosADuracion(j.segundosTotales)}</td>
                    <td style="padding: 12px; font-weight: bold; color: #0d6efd;">${convertirSegundosADuracion(promedioSeg)}</td>
                    <td style="padding: 12px;">${j.unidadesTotales}</td>
                    <td style="padding: 12px;">${promedioUnidades}</td>
                    <td style="padding: 12px;">${j.edificiosTotales}</td>
                    <td style="padding: 12px;">${promedioEdificios}</td>
                </tr>
            `;
        });
    }
    htmlTiempos += `</tbody></table></div>`;
    secTiempos.innerHTML = htmlTiempos;


    // ==========================================
    // RENDERIZAR VISTA 2: CIVILIZACIONES Y WIN RATE
    // ==========================================
    const listaCivs = Object.values(estadisticasCivilizaciones);
    let htmlCivs = `
        <h3>🏛️ Rendimiento y Win Rate por Civilización</h3>
        <div style="overflow-x: auto; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background-color: #343a40; color: #fff; text-align: left;">
                        <th style="padding: 12px;">Civilización</th>
                        <th style="padding: 12px;">Veces Jugada</th>
                        <th style="padding: 12px;">Victorias</th>
                        <th style="padding: 12px;">Derrotas</th>
                        <th style="padding: 12px;">Win Rate (%)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (listaCivs.length === 0) {
        htmlCivs += `<tr><td colspan="5" style="text-align: center; padding: 25px; color: #6c757d;">No hay civilizaciones registradas aún.</td></tr>`;
    } else {
        listaCivs.sort((a, b) => b.jugadas - a.jugadas);
        listaCivs.forEach(c => {
            const winRate = c.jugadas > 0 ? ((c.victorias / c.jugadas) * 100).toFixed(1) : 0;
            htmlCivs += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px;"><strong>${c.civ}</strong></td>
                    <td style="padding: 12px;">${c.jugadas}</td>
                    <td style="padding: 12px; color: #198754; font-weight: bold;">${c.victorias}</td>
                    <td style="padding: 12px; color: #dc3545; font-weight: bold;">${c.derrotas}</td>
                    <td style="padding: 12px; font-weight: bold; color: ${winRate >= 50 ? '#198754' : '#dc3545'};">${winRate}%</td>
                </tr>
            `;
        });
    }
    htmlCivs += `</tbody></table></div>`;
    secCivilizaciones.innerHTML = htmlCivs;


    // ==========================================
    // RENDERIZAR VISTA 3: CONSULTA GRUPAL Y EQUIPOS
    // ==========================================
    const listaEquipos = Object.values(estadisticasEquipos);
    let htmlEnfrentamientos = `
        <h3>🔍 Consulta Interactiva de Sinergia de Grupo (2 a 4 Jugadores)</h3>
        <p style="color: #6c757d; font-size: 0.9em; margin-bottom: 15px;">Ingresa de 2 a 4 jugadores para conocer sus estadísticas conjuntas en el mismo equipo.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px; color: #343a40;">Jugador 1:</label>
                    <input type="text" id="input-sinergia-1" list="lista-jugadores-sug" placeholder="Selecciona o escribe..." style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-size: 1em;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px; color: #343a40;">Jugador 2:</label>
                    <input type="text" id="input-sinergia-2" list="lista-jugadores-sug" placeholder="Selecciona o escribe..." style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-size: 1em;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px; color: #343a40;">Jugador 3 (Opcional):</label>
                    <input type="text" id="input-sinergia-3" list="lista-jugadores-sug" placeholder="Opcional..." style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-size: 1em;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px; color: #343a40;">Jugador 4 (Opcional):</label>
                    <input type="text" id="input-sinergia-4" list="lista-jugadores-sug" placeholder="Opcional..." style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-size: 1em;">
                </div>
            </div>
            
            <datalist id="lista-jugadores-sug">
                ${Array.from(listaGlobalJugadores).map(j => `<option value="${j}">`).join("")}
            </datalist>

            <button id="btn-consultar-sinergia" style="background: #0d6efd; color: white; border: none; padding: 10px 25px; border-radius: 4px; font-weight: bold; cursor: pointer;">Consultar Sinergia Grupal</button>
        </div>

        <div id="resultado-sinergia-container" style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 35px; display: none;"></div>

        <h3 style="margin-top: 25px;">🤝 Rendimiento por Equipos (3v3 / 4v4)</h3>
        <div style="overflow-x: auto; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background-color: #343a40; color: #fff; text-align: left;">
                        <th style="padding: 12px;">Equipo / Bando</th>
                        <th style="padding: 12px;">Miembros Integrantes</th>
                        <th style="padding: 12px;">Partidas</th>
                        <th style="padding: 12px;">Victorias</th>
                        <th style="padding: 12px;">Derrotas</th>
                        <th style="padding: 12px;">Efectividad</th>
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
                    <td style="padding: 12px;"><strong>${eq.nombreEquipo}</strong></td>
                    <td style="padding: 12px; font-size: 0.9em; color: #495057;">${miembrosArr}</td>
                    <td style="padding: 12px;">${totalP}</td>
                    <td style="padding: 12px; color: #198754; font-weight: bold;">${eq.victorias}</td>
                    <td style="padding: 12px; color: #dc3545; font-weight: bold;">${eq.derrotas}</td>
                    <td style="padding: 12px; font-weight: bold; color: ${eq.victorias > 0 && eq.derrotas === 0 ? '#198754' : '#0d6efd'};">${eq.victorias > 0 && eq.derrotas === 0 ? '🏆 Invictos' : ef + '%'}</td>
                </tr>
            `;
        });
    }

    htmlEnfrentamientos += `</tbody></table></div>`;
    secEnfrentamientos.innerHTML = htmlEnfrentamientos;

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
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; text-align: center;">
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;"><div style="font-size: 0.85em; color: #6c757d;">Partidas Juntos</div><div style="font-size: 1.4em; font-weight: bold; color: #343a40;">${partidasJuntos}</div></div>
                        <div style="background: #e8f5e9; padding: 10px; border-radius: 6px;"><div style="font-size: 0.85em; color: #198754;">Victorias</div><div style="font-size: 1.4em; font-weight: bold; color: #198754;">${victoriasJuntos}</div></div>
                        <div style="background: #ffebee; padding: 10px; border-radius: 6px;"><div style="font-size: 0.85em; color: #dc3545;">Derrotas</div><div style="font-size: 1.4em; font-weight: bold; color: #dc3545;">${derrotasJuntos}</div></div>
                        <div style="background: #e7f1ff; padding: 10px; border-radius: 6px;"><div style="font-size: 0.85em; color: #0d6efd;">Estado Sinergia</div><div style="font-size: 1.1em; margin-top: 4px;">${badgeEstado}</div></div>
                    </div>
                `;
            }
        });
    }
}
