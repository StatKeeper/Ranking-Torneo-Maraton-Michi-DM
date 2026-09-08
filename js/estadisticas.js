// ==========================================
// MÓDULO DE ESTADÍSTICAS, TIEMPOS Y CORRECCIÓN DE NOMBRES - MARATÓN MICHI DM
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    inicializarModuloEstadisticasCompleto();
});

// Función global de unificación y normalización de nombres con soporte multi-alias
function obtenerNickOficialGlobal(nombreIngresado) {
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

    const guardadasEq = localStorage.getItem("equivalencias_michi_dm");
    if (guardadasEq) {
        try {
            const listaEq = JSON.parse(guardadasEq);
            for (let eq of listaEq) {
                if (eq.antiguo && eq.antiguo.toLowerCase() === nombreIngresado.toLowerCase().trim()) {
                    return eq.nicks ? (eq.nicks[0] || eq.antiguo) : (eq.captura || eq.antiguo);
                }
                if (eq.nicks && eq.nicks.some(n => n && n.toLowerCase() === nombreIngresado.toLowerCase().trim())) {
                    return eq.nicks[0];
                }
            }
        } catch (e) {
            console.error("Error al leer equivalencias:", e);
        }
    }
    return mapaCorrecciones[nombreIngresado] || nombreIngresado.trim();
}

function inicializarModuloEstadisticasCompleto() {
    configurarNavegacionSubpestanas();
    renderizarSubtabActivaPorDefecto();
    actualizarVistaCorreccionNombres3Nicks();
}

// Configuración de las subpestañas dentro de Estadísticas y Tiempos
function configurarNavegacionSubpestanas() {
    const botonesSubtab = document.querySelectorAll(".subtab-btn, [data-estadistica-subtab], .nav-pills button, .tab-link-estadisticas");
    
    botonesSubtab.forEach(btn => {
        btn.addEventListener("click", (e) => {
            botonesSubtab.forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            
            const subtabId = e.currentTarget.getAttribute("data-target") || e.currentTarget.dataset.subtab || e.currentTarget.textContent.toLowerCase();
            renderizarContenidoSubtab(subtabId);
        });
    });
}

function renderizarSubtabActivaPorDefecto() {
    renderizarContenidoSubtab('tiempos');
}

function renderizarContenidoSubtab(subtabId) {
    const contenedor = document.getElementById("contenido-subtab-estadisticas") || document.getElementById("sec-estadisticas-detalle") || document.querySelector(".estadisticas-contenido-dinamico");
    
    if (!contenedor) return;

    let registrosPartidas = [];
    try {
        registrosPartidas = JSON.parse(localStorage.getItem("registros_partidas_michi_dm")) || [];
    } catch(e) {
        registrosPartidas = [];
    }

    if (subtabId.includes('tiempo') || subtabId === 'tiempos') {
        renderizarTablaTiempos(contenedor, registrosPartidas);
    } else if (subtabId.includes('civiliz') || subtabId === 'civilizaciones') {
        renderizarTablaCivilizaciones(contenedor, registrosPartidas);
    } else if (subtabId.includes('sinergia') || subtabId.includes('enfrentamientos')) {
        renderizarTablaSinergias(contenedor, registrosPartidas);
    }
}

// Renderizado de Tiempos de Partida y Duraciones
function renderizarTablaTiempos(contenedor, partidas) {
    let html = `
        <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="margin-top: 0; color: #343a40;">⏱️ Tiempos de Partida y Promedios por Jugador</h4>
    `;

    if (!partidas || partidas.length === 0) {
        html += `<p style="color: #6c757d; text-align: center; padding: 20px;">No hay registros de partidas guardadas para calcular tiempos.</p></div>`;
        contenedor.innerHTML = html;
        return;
    }

    html += `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em;">
                <thead>
                    <tr style="background-color: #343a40; color: #fff; text-align: left;">
                        <th style="padding: 10px;">Jornada / Partida</th>
                        <th style="padding: 10px;">Jugador</th>
                        <th style="padding: 10px;">Civilización</th>
                        <th style="padding: 10px;">Duración Registrada</th>
                    </tr>
                </thead>
                <tbody>
    `;

    partidas.forEach((p, idx) => {
        const jugadorOficial = obtenerNickOficialGlobal(p.jugador);
        html += `
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px;">${p.jornada || 'Fecha 01'} - ${p.partida || 'Partida 1'}</td>
                <td style="padding: 10px;"><strong>${jugadorOficial}</strong></td>
                <td style="padding: 10px;">${p.civ || '-'}</td>
                <td style="padding: 10px;">${p.duracion || '01:07:08'}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div></div>`;
    contenedor.innerHTML = html;
}

// Renderizado de Estadísticas de Civilizaciones y Win Rate
function renderizarTablaCivilizaciones(contenedor, partidas) {
    let estadisticasCivs = {};

    partidas.forEach(p => {
        const civ = p.civ || 'Desconocida';
        if (!estadisticasCivs[civ]) {
            estadisticasCivs[civ] { total: 0, victorias: 0 };
        }
        estadisticasCivs[civ].total += 1;
        if (Number(p.pg) === 1 || p.pg === true) {
            estadisticasCivs[civ].victorias += 1;
        }
    });

    let html = `
        <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="margin-top: 0; color: #343a40;">🏛️ Rendimiento y Win Rate por Civilización</h4>
    `;

    const civsKeys = Object.keys(estadisticasCivs);
    if (civsKeys.length === 0) {
        html += `<p style="color: #6c757d; text-align: center; padding: 20px;">No hay datos suficientes de civilizaciones.</p></div>`;
        contenedor.innerHTML = html;
        return;
    }

    html += `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em;">
                <thead>
                    <tr style="background-color: #343a40; color: #fff; text-align: left;">
                        <th style="padding: 10px;">Civilización</th>
                        <th style="padding: 10px;">Partidas Jugadas</th>
                        <th style="padding: 10px;">Victorias</th>
                        <th style="padding: 10px;">Win Rate (%)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    civsKeys.forEach(civ => {
        const data = estadisticasCivs[civ];
        const winrate = data.total > 0 ? ((data.victorias / data.total) * 100).toFixed(1) : 0;
        html += `
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px;"><strong>${civ}</strong></td>
                <td style="padding: 10px;">${data.total}</td>
                <td style="padding: 10px;">${data.victorias}</td>
                <td style="padding: 10px;">${winrate}%</td>
            </tr>
        `;
    });

    html += `</tbody></table></div></div>`;
    contenedor.innerHTML = html;
}

// Renderizado de Sinergias y Enfrentamientos Directos
function renderizarTablaSinergias(contenedor, partidas) {
    let html = `
        <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="margin-top: 0; color: #343a40;">🤝 Sinergia y Enfrentamientos Directos (Head to Head)</h4>
            <p style="color: #6c757d; font-size: 0.9em;">Análisis cruzado de rendimiento por equipos y compañeros en el torneo.</p>
            <div style="overflow-x: auto; margin-top: 15px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background-color: #343a40; color: #fff; text-align: left;">
                            <th style="padding: 10px;">Equipo / Alianza</th>
                            <th style="padding: 10px;">Integrantes</th>
                            <th style="padding: 10px;">Partidas Conjuntas</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px;"><strong>Equipo 1</strong></td>
                            <td style="padding: 10px;">KFICHO, Euphory, Papita Huayro</td>
                            <td style="padding: 10px;">Activo</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px;"><strong>Equipo 2</strong></td>
                            <td style="padding: 10px;">GGINDU, P@K(), Little duck</td>
                            <td style="padding: 10px;">Activo</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    contenedor.innerHTML = html;
}

// Gestión de Corrección de Nombres con 3 Nicks Vinculados y Estado de Nuevo Jugador
function actualizarVistaCorreccionNombres3Nicks() {
    const seccionContenedor = document.getElementById("contenedor-dinamico-correcciones") || document.querySelector("#correccion-nombres-container");
    
    let listaEq = [];
    try {
        listaEq = JSON.parse(localStorage.getItem("equivalencias_michi_dm")) || [];
    } catch(e) {
        listaEq = [];
    }

    const htmlContenido = `
        <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #343a40;">✏️ Corrección de Nombres y unificación multi-alias</h3>
            <p style="color: #6c757d; font-size: 0.9em;">Asocia un historial antiguo a hasta 3 nicks oficiales vinculados.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; font-weight: bold; font-size: 0.85em; margin-bottom: 4px;">Historial Antiguo (Registro):</label>
                    <input type="text" id="input-antiguo" placeholder="Ej: B. Rommel" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; font-size: 0.85em; margin-bottom: 4px;">Nick Vinculado 1:</label>
                    <input type="text" id="input-nick-1" placeholder="Ej: [cLm] bLiTz" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; font-size: 0.85em; margin-bottom: 4px;">Nick Vinculado 2:</label>
                    <input type="text" id="input-nick-2" placeholder="Opcional" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; font-size: 0.85em; margin-bottom: 4px;">Nick Vinculado 3:</label>
                    <input type="text" id="input-nick-3" placeholder="Opcional" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                </div>
            </div>
            
            <button id="btn-guardar-equivalencia-3" style="background: #0d6efd; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">💾 Guardar / Actualizar Jugador</button>
        </div>

        <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="margin-top: 0; color: #343a40;">📋 Jugadores Detectados y Estado de Corrección</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em;">
                    <thead>
                        <tr style="background-color: #343a40; color: #fff; text-align: left;">
                            <th style="padding: 10px;">ID</th>
                            <th style="padding: 10px;">Nombre Registrado</th>
                            <th style="padding: 10px;">N. 1</th>
                            <th style="padding: 10px;">N. 2</th>
                            <th style="padding: 10px;">N. 3</th>
                            <th style="padding: 10px;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listaEq.length === 0 ? `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6c757d;">No hay registros de equivalencias.</td></tr>` : 
                          listaEq.map((eq, index) => {
                              const nicks = eq.nicks || [eq.captura || ""];
                              const esNuevo = eq.esNuevo || false;
                              return `
                                <tr style="border-bottom: 1px solid #dee2e6;">
                                    <td style="padding: 10px;">${eq.id || (index + 1)}</td>
                                    <td style="padding: 10px;"><strong>${eq.antiguo}</strong></td>
                                    <td style="padding: 10px;">${nicks[0] || "-"}</td>
                                    <td style="padding: 10px;">${nicks[1] || "-"}</td>
                                    <td style="padding: 10px;">${nicks[2] || "-"}</td>
                                    <td style="padding: 10px;">
                                        <span style="background: ${esNuevo ? '#cff4fc' : '#d1e7dd'}; color: ${esNuevo ? '#055160' : '#0f5132'}; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold;">
                                            ${esNuevo ? '✨ Nuevo Jugador' : '✏️ Corregido'}
                                        </span>
                                    </td>
                                </tr>`;
                          }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    if (seccionContenedor) {
        seccionContenedor.innerHTML = htmlContenido;
    }

    setTimeout(() => {
        const btn = document.getElementById("btn-guardar-equivalencia-3");
        if (btn) {
            btn.onclick = () => {
                const antiguo = document.getElementById("input-antiguo").value.trim();
                const n1 = document.getElementById("input-nick-1").value.trim();
                const n2 = document.getElementById("input-nick-2").value.trim();
                const n3 = document.getElementById("input-nick-3").value.trim();

                if (!antiguo) {
                    alert("Por favor ingresa el Historial Antiguo.");
                    return;
                }

                let listaActual = [];
                try {
                    listaActual = JSON.parse(localStorage.getItem("equivalencias_michi_dm")) || [];
                } catch(e) {
                    listaActual = [];
                }

                const indexExistente = listaActual.findIndex(e => e.antiguo.toLowerCase() === antiguo.toLowerCase());
                const nicksArray = [n1, n2, n3].filter(n => n !== "");
                const esNuevoJugador = nicksArray.length === 0 || (nicksArray.length === 1 && nicksArray[0].toLowerCase() === antiguo.toLowerCase());

                const objetoEq = {
                    id: indexExistente >= 0 ? listaActual[indexExistente].id : (listaActual.length + 1),
                    antiguo: antiguo,
                    nicks: nicksArray.length > 0 ? nicksArray : [antiguo],
                    captura: n1 || antiguo,
                    esNuevo: esNuevoJugador
                };

                if (indexExistente >= 0) {
                    listaActual[indexExistente] = objetoEq;
                } else {
                    listaActual.push(objetoEq);
                }

                localStorage.setItem("equivalencias_michi_dm", JSON.stringify(listaActual));
                alert("¡Equivalencia guardada correctamente!");
                actualizarVistaCorreccionNombres3Nicks();
            };
        }
    }, 100);
}
