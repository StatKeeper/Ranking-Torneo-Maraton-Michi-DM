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
    let duplasPartidas = {};
    let listaGlobalJugadores = new Set();

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave && clave.startsWith("registros_")) {
            try {
                const registros = JSON.parse(localStorage.getItem(clave));
                if (Array.isArray(registros) && registros.length > 0) {
                    let jugadoresEnPartida = [];

                    registros.forEach(reg => {
                        const nombreRaw = reg.jugador || reg.Jugador;
                        if (!nombreRaw) return;
                        const nombre = obtenerNickOficialEstadisticas(nombreRaw);
                        listaGlobalJugadores.add(nombre);

                        jugadoresEnPartida.push({
                            nombre: nombre,
                            pg: (reg.pg === 1 || reg.PG === 1) ? 1 : 0,
                            pp: (reg.pp === 1 || reg.PP === 1) ? 1 : 0
                        });

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
                        
                        if (reg.pg === 1 || reg.PG === 1) stats.victorias++;
                        if (reg.pp === 1 || reg.PP === 1) stats.derrotas++;

                        stats.unidadesTotales += parseInt(reg.unidadesAsesinadas || 0, 10);
                        stats.edificiosTotales += parseInt(reg.edificiosArrasados || 0, 10);
                        stats.segundosTotales += convertirDuracionASegundos(reg.duracion);

                        // 2. Estadísticas de Civilizaciones
                        const civ = (reg.civ || "Desconocida").trim();
                        if (civ && civ !== "-") {
                            if (!estadisticasCivilizaciones[civ]) {
                                estadisticasCivilizaciones[civ] = { civ: civ, jugadas: 0, victorias: 0, derrotas: 0 };
                            }
                            estadisticasCivilizaciones[civ].jugadas++;
                            if (reg.pg === 1 || reg.PG === 1) estadisticasCivilizaciones[civ].victorias++;
                            if (reg.pp === 1 || reg.PP === 1) estadisticasCivilizaciones[civ].derrotas++;
                        }

                        // 3. Estadísticas por Equipo
                        const equipo = (reg.equipo || "Sin Equipo").trim();
                        if (equipo && equipo !== "-") {
                            const claveEquipo = `${clave} - ${equipo}`;
                            if (!estadisticasEquipos[claveEquipo]) {
                                estadisticasEquipos[claveEquipo] = {
                                    nombreEquipo: equipo,
                                    partidaKey: clave,
                                    victorias: 0,
                                    derrotas: 0,
                                    miembros: new Set()
                                };
                            }
                            estadisticasEquipos[claveEquipo].miembros.add(nombre);
                            if (reg.pg === 1 || reg.PG === 1) estadisticasEquipos[claveEquipo].victorias = 1;
                            if (reg.pp === 1 || reg.PP === 1) estadisticasEquipos[claveEquipo].derrotas = 1;
                        }
                    });

                    // Generar combinaciones de duplas por partida
                    for (let a = 0; a < jugadoresEnPartida.length; a++) {
                        for (let b = a + 1; b < jugadoresEnPartida.length; b++) {
                            let p1 = jugadoresEnPartida[a].nombre;
                            let p2 = jugadoresEnPartida[b].nombre;
                            if (p1 === p2) continue;
                            let keyDupla = [p1, p2].sort().join(" & ");

                            if (!duplasPartidas[keyDupla]) {
                                duplasPartidas[keyDupla] = { jugador1: [p1, p2].sort()[0], jugador2: [p1, p2].sort()[1], juntas: 0, victorias: 0, derrotas: 0 };
                            }
                            duplasPartidas[keyDupla].juntas++;
                            if (jugadoresEnPartida[a].pg === 1 && jugadoresEnPartida[b].pg === 1) {
                                duplasPartidas[keyDupla].victorias++;
                            } else if (jugadoresEnPartida[a].pp === 1 || jugadoresEnPartida[b].pp === 1) {
                                duplasPartidas[keyDupla].derrotas++;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Error al procesar registros para estadísticas:", e);
            }
        }
    }

    // ==========================================
    // RENDERIZAR VISTA 1: TIEMPOS DE PARTIDA Y TOTALES
    // ==========================================
    const listaJugadores = Object.values(estadisticasJugadores);
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
                        <th style="padding: 12px;" title="Partidas Registradas">Part.</th>
                        <th style="padding: 12px;" title="Duración Total Acumulada">Dur. Acum.</th>
                        <th style="padding: 12px;" title="Promedio de Duración por Partida">Prom. Dur.</th>
                        <th style="padding: 12px;" title="Total de Unidades Asesinadas">Tot. Unid.</th>
                        <th style="padding: 12px;" title="Promedio de Unidades Asesinadas por Partida">Prom. Unid.</th>
                        <th style="padding: 12px;" title="Total de Edificios Arrasados">Tot. Edif.</th>
                        <th style="padding: 12px;" title="Promedio de Edificios Arrasados por Partida">Prom. Edif.</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (listaJugadores.length === 0) {
        htmlTiempos += `<tr><td colspan="8" style="text-align: center; padding: 25px; color: #6c757d;">No hay registros de tiempos disponibles.</td></tr>`;
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
    // RENDERIZAR VISTA 3: EQUIPOS Y BUSCADOR DE DUPLAS
    // ==========================================
    const listaEquipos = Object.values(estadisticasEquipos);
    let htmlEnfrentamientos = `
        <h3>🤝 Rendimiento por Equipos (3v3 / 4v4)</h3>
        <div style="overflow-x: auto; margin-top: 15px; margin-bottom: 35px;">
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

    htmlEnfrentamientos += `
                </tbody>
            </table>
        </div>

        <h3>🔍 Consulta Interactiva de Sinergia de Duplas</h3>
        <p style="color: #6c757d; font-size: 0.9em; margin-bottom: 15px;">Selecciona o escribe el nombre de dos jugadores para consultar sus estadísticas conjuntas en equipo.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px; color: #343a40;">Jugador 1:</label>
                    <input type="text" id="input-dupla-1" list="lista-jugadores-sug" placeholder="Escribe o selecciona..." style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-size: 1em;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px; color: #343a40;">Jugador 2:</label>
                    <input type="text" id="input-dupla-2" list="lista-jugadores-sug" placeholder="Escribe o selecciona..." style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-size: 1em;">
                </div>
            </div>
            
            <datalist id="lista-jugadores-sug">
                ${Array.from(listaGlobalJugadores).map(j => `<option value="${j}">`).join("")}
            </datalist>

            <button id="btn-consultar-dupla" style="background: #0d6efd; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">Consultar Sinergia</button>
        </div>

        <div id="resultado-dupla-container" style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: none;">
            <!-- El resultado se inyectará aquí -->
        </div>
    `;

    secEnfrentamientos.innerHTML = htmlEnfrentamientos;

    // Lógica del buscador interactivo de duplas
    const btnConsultar = document.getElementById("btn-consultar-dupla");
    if (btnConsultar) {
        btnConsultar.addEventListener("click", () => {
            const j1Val = document.getElementById("input-dupla-1").value.trim();
            const j2Val = document.getElementById("input-dupla-2").value.trim();
            const contenedorResultado = document.getElementById("resultado-dupla-container");

            if (!j1Val || !j2Val) {
                alert("Por favor selecciona o escribe el nombre de ambos jugadores.");
                return;
            }

            if (j1Val.toLowerCase() === j2Val.toLowerCase()) {
                alert("Debes seleccionar dos jugadores distintos.");
                return;
            }

            const claveDuplaBusqueda = [j1Val, j2Val].sort().join(" & ");
            const datosDupla = duplasPartidas[claveDuplaBusqueda];

            contenedorResultado.style.display = "block";

            if (!datosDupla || datosDupla.juntas === 0) {
                contenedorResultado.innerHTML = `
                    <h4 style="color: #6c757d; margin-bottom: 10px;">📊 Resultado para: ${j1Val} & ${j2Val}</h4>
                    <p style="color: #dc3545; margin: 0;">⚠️ Estos jugadores aún no han registrado partidas juntos en el torneo.</p>
                `;
            } else {
                const efDupla = ((datosDupla.victorias / datosDupla.juntas) * 100).toFixed(0);
                let badgeEstado = `<span style="color: #0d6efd; font-weight: bold;">${efDupla}% Efectividad</span>`;
                if (datosDupla.victorias > 0 && datosDupla.derrotas === 0) {
                    badgeEstado = `<span style="color: #198754; font-weight: bold;">🔥 ¡Dupla Invicta!</span>`;
                } else if (datosDupla.derrotas > 0 && datosDupla.victorias === 0) {
                    badgeEstado = `<span style="color: #dc3545; font-weight: bold;">⚠️ Sin victorias conjuntas</span>`;
                }

                contenedorResultado.innerHTML = `
                    <h4 style="color: #343a40; margin-bottom: 15px; border-bottom: 2px solid #0d6efd; padding-bottom: 5px;">📊 Estadística Conjunta: ${datosDupla.jugador1} y ${datosDupla.jugador2}</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; text-align: center;">
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                            <div style="font-size: 0.85em; color: #6c757d;">Partidas Juntos</div>
                            <div style="font-size: 1.4em; font-weight: bold; color: #343a40;">${datosDupla.juntas}</div>
                        </div>
                        <div style="background: #e8f5e9; padding: 10px; border-radius: 6px;">
                            <div style="font-size: 0.85em; color: #198754;">Victorias</div>
                            <div style="font-size: 1.4em; font-weight: bold; color: #198754;">${datosDupla.victorias}</div>
                        </div>
                        <div style="background: #ffebee; padding: 10px; border-radius: 6px;">
                            <div style="font-size: 0.85em; color: #dc3545;">Derrotas</div>
                            <div style="font-size: 1.4em; font-weight: bold; color: #dc3545;">${datosDupla.derrotas}</div>
                        </div>
                        <div style="background: #e7f1ff; padding: 10px; border-radius: 6px;">
                            <div style="font-size: 0.85em; color: #0d6efd;">Estado Sinergia</div>
                            <div style="font-size: 1.1em; margin-top: 4px;">${badgeEstado}</div>
                        </div>
                    </div>
                `;
            }
        });
    }
}
