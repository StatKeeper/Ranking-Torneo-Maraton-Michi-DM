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
    let registrosPartidasPorClave = {};
    let duplasPartidas = {};

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave && clave.startsWith("registros_")) {
            try {
                const registros = JSON.parse(localStorage.getItem(clave));
                if (Array.isArray(registros) && registros.length > 0) {
                    registrosPartidasPorClave[clave] = registros;

                    // Agrupar jugadores por partida para calcular sinergia de duplas
                    let jugadoresEnPartida = [];

                    registros.forEach(reg => {
                        const nombreRaw = reg.jugador || reg.Jugador;
                        if (!nombreRaw) return;
                        const nombre = obtenerNickOficialEstadisticas(nombreRaw);
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

                        // 3. Estadísticas por Equipo (ej. caficho)
                        const equipo = (reg.equipo || "Sin Equipo").trim();
                        if (equipo && equipo !== "-") {
                            const claveEquipo = `${reg.jornada || 'J'} - ${equipo}`;
                            if (!estadisticasEquipos[claveEquipo]) {
                                estadisticasEquipos[claveEquipo] = {
                                    nombreEquipo: equipo,
                                    jornada: reg.jornada || "-",
                                    partidas: 0,
                                    victorias: 0,
                                    derrotas: 0,
                                    miembros: new Set()
                                };
                            }
                            estadisticasEquipos[claveEquipo].miembros.add(nombre);
                            // Evitar duplicar conteo de partidas si hay varios miembros del mismo equipo en la misma clave
                            estadisticasEquipos[claveEquipo].partidas = 1; 
                            if (reg.pg === 1 || reg.PG === 1) estadisticasEquipos[claveEquipo].victorias = 1;
                            if (reg.pp === 1 || reg.PP === 1) estadisticasEquipos[claveEquipo].derrotas = 1;
                        }
                    });

                    // Generar combinaciones de duplas (parejas) que jugaron juntas en esta partida
                    for (let a = 0; a < jugadoresEnPartida.length; a++) {
                        for (let b = a + 1; b < jugadoresEnPartida.length; b++) {
                            let p1 = jugadoresEnPartida[a].nombre;
                            let p2 = jugadoresEnPartida[b].nombre;
                            if (p1 === p2) continue;
                            // Ordenar alfabéticamente para que la dupla [A, B] sea igual a [B, A]
                            let keyDupla = [p1, p2].sort().join(" & ");

                            if (!duplasPartidas[keyDupla]) {
                                duplasPartidas[keyDupla] = { dupla: keyDupla, juntas: 0, victorias: 0, derrotas: 0 };
                            }
                            duplasPartidas[keyDupla].juntas++;
                            // Si ambos ganaron en la partida
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
    // RENDERIZAR VISTA 1: TIEMPOS DE PARTIDA
    // ==========================================
    const listaJugadores = Object.values(estadisticasJugadores);
    let htmlTiempos = `
        <h3>⏱️ Tiempos de Partida y Promedios por Jugador</h3>
        <div style="overflow-x: auto; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background-color: #343a40; color: #fff; text-align: left;">
                        <th style="padding: 12px;">Jugador</th>
                        <th style="padding: 12px;">Partidas Registradas</th>
                        <th style="padding: 12px;">Duración Total Acumulada</th>
                        <th style="padding: 12px;">Promedio de Duración por Partida</th>
                        <th style="padding: 12px;">Unidades Asesinadas</th>
                        <th style="padding: 12px;">Edificios Arrasados</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (listaJugadores.length === 0) {
        htmlTiempos += `<tr><td colspan="6" style="text-align: center; padding: 25px; color: #6c757d;">No hay registros de tiempos disponibles.</td></tr>`;
    } else {
        listaJugadores.sort((a, b) => b.totalPartidas - a.totalPartidas);
        listaJugadores.forEach(j => {
            const promedioSeg = j.totalPartidas > 0 ? Math.round(j.segundosTotales / j.totalPartidas) : 0;
            htmlTiempos += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px;"><strong>${j.nombre}</strong></td>
                    <td style="padding: 12px;">${j.totalPartidas}</td>
                    <td style="padding: 12px;">${convertirSegundosADuracion(j.segundosTotales)}</td>
                    <td style="padding: 12px; font-weight: bold; color: #0d6efd;">${convertirSegundosADuracion(promedioSeg)}</td>
                    <td style="padding: 12px;">${j.unidadesTotales}</td>
                    <td style="padding: 12px;">${j.edificiosTotales}</td>
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
    // RENDERIZAR VISTA 3: SINERGIA Y ENFRENTAMIENTOS
    // ==========================================
    const listaEquipos = Object.values(estadisticasEquipos);
    const listaDuplas = Object.values(duplasPartidas);

    let htmlEnfrentamientos = `
        <h3>🤝 Rendimiento por Equipos (3v3 / 4v4)</h3>
        <div style="overflow-x: auto; margin-top: 15px; margin-bottom: 30px;">
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
                    <td style="padding: 12px; font-weight: bold; color: ${eq.victorias > 0 ? '#198754' : '#6c757d'};">${eq.victorias > 0 && eq.derrotas === 0 ? '🏆 Invictos' : ef + '%'}</td>
                </tr>
            `;
        });
    }

    htmlEnfrentamientos += `
                </tbody>
            </table>
        </div>

        <h3>👥 Sinergia de Duplas (Parejas en Equipo)</h3>
        <div style="overflow-x: auto; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background-color: #343a40; color: #fff; text-align: left;">
                        <th style="padding: 12px;">Dupla de Jugadores</th>
                        <th style="padding: 12px;">Partidas Juntos</th>
                        <th style="padding: 12px;">Victorias Conjuntas</th>
                        <th style="padding: 12px;">Derrotas Conjuntas</th>
                        <th style="padding: 12px;">Estado / Sinergia</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (listaDuplas.length === 0) {
        htmlEnfrentamientos += `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6c757d;">No hay suficientes datos de duplas conjuntas.</td></tr>`;
    } else {
        listaDuplas.sort((a, b) => b.juntas - a.juntas);
        listaDuplas.forEach(d => {
            const sinergiaEf = d.juntas > 0 ? ((d.victorias / d.juntas) * 100).toFixed(0) : 0;
            let estadoTexto = `${sinergiaEf}% Efectividad`;
            let colorEstado = '#0d6efd';
            if (d.victorias > 0 && d.derrotas === 0) {
                estadoTexto = '🔥 Dupla Invicta';
                colorEstado = '#198754';
            } else if (d.derrotas > 0 && d.victorias === 0) {
                estadoTexto = '⚠️ Sin victorias juntos';
                colorEstado = '#dc3545';
            }

            htmlEnfrentamientos += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px;"><strong>${d.dupla}</strong></td>
                    <td style="padding: 12px;">${d.juntas}</td>
                    <td style="padding: 12px; color: #198754; font-weight: bold;">${d.victorias}</td>
                    <td style="padding: 12px; color: #dc3545; font-weight: bold;">${d.derrotas}</td>
                    <td style="padding: 12px; font-weight: bold; color: ${colorEstado};">${estadoTexto}</td>
                </tr>
            `;
        });
    }

    htmlEnfrentamientos += `
                </tbody>
            </table>
        </div>
    `;

    secEnfrentamientos.innerHTML = htmlEnfrentamientos;
}
