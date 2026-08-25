// Obtener el nombre oficial corregido desde localStorage
function obtenerNombreOficial(nombreOriginal) {
    if (!nombreOriginal) return "";
    let mapaCorrecciones = {};
    
    // Intentar leer el diccionario de correcciones guardado en la pestaña correccion.html
    const correccionesGuardadas = localStorage.getItem("mapa_correccion_nombres") || localStorage.getItem("correcciones_nombres");
    if (correccionesGuardadas) {
        try {
            mapaCorrecciones = JSON.parse(correccionesGuardadas);
        } catch (e) {
            console.error("Error parseando mapa de corrección de nombres:", e);
        }
    }
    
    // Si existe una equivalencia registrada, devuelve el nombre oficial; de lo contrario, el original
    return mapaCorrecciones[nombreOriginal] || nombreOriginal;
}

// Renderiza el Ranking Acumulado General en Clasificación General (index.html)
function renderTablaRankingGeneral() {
    const tbody = document.getElementById("tabla-clasificacion");
    const tituloHeader = document.querySelector("#main-content h1");

    if (!tbody) return;

    let acumuladoMap = {};
    let ultimaJornada = "Fecha 01";
    let ultimaPartida = "Partida 1";

    // 1. Leer directamente si existe el acumulado global consolidado
    const datosGuardados = localStorage.getItem("ranking_acumulado_general");
    if (datosGuardados) {
        try {
            acumuladoMap = JSON.parse(datosGuardados);
        } catch (e) {
            console.error("Error parseando ranking_acumulado_general:", e);
        }
    }

    // 2. Si acumuladoMap está vacío, recorrer todas las claves de registros masivos
    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave && clave.startsWith("registros_")) {
            const partesClave = clave.split("_");
            if (partesClave.length >= 2) {
                ultimaJornada = partesClave[partesClave.length - 2] || ultimaJornada;
                ultimaPartida = partesClave[partesClave.length - 1] || ultimaPartida;
            }

            // Consolidar al vuelo si no existía el acumulado general
            if (Object.keys(acumuladoMap).length === 0) {
                try {
                    const registros = JSON.parse(localStorage.getItem(clave));
                    if (Array.isArray(registros)) {
                        registros.forEach(reg => {
                            const nombreRaw = reg.jugador || reg.Jugador;
                            if (!nombreRaw) return;

                            // HOMOLOGACIÓN DE NOMBRE: Se obtiene el nombre oficial corregido
                            const nombre = obtenerNombreOficial(nombreRaw);

                            if (!acumuladoMap[nombre]) {
                                acumuladoMap[nombre] = {
                                    jugador: nombre,
                                    pts: 0,
                                    pg: 0,
                                    pp: 0,
                                    var: 0,
                                    ultimoSuceso: reg.sucesoNota || reg.suceso || reg.ultimoSuceso || 'Victoria'
                                };
                            }

                            const puntos = parseInt(reg.pts || reg.Pts || 0);
                            const ganados = parseInt(reg.pg || reg.PG || 0);
                            const perdidos = parseInt(reg.pp || reg.PP || 0);

                            acumuladoMap[nombre].pts += puntos;
                            acumuladoMap[nombre].pg += ganados;
                            acumuladoMap[nombre].pp += perdidos;
                            acumuladoMap[nombre].ultimoSuceso = reg.sucesoNota || reg.suceso || acumuladoMap[nombre].ultimoSuceso;
                        });
                    }
                } catch (e) {
                    console.error("Error procesando registro:", e);
                }
            }
        }
    }

    // 3. Título dinámico en el encabezado
    const ahora = new Date();
    const fechaHoraStr = ahora.toLocaleString('es-PE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    if (tituloHeader) {
        tituloHeader.textContent = `Ranking Michi DM Dinámico ${ultimaJornada} ${ultimaPartida} ${fechaHoraStr}`;
    }

    // 4. Si no hay registros guardados en la base de datos local
    let jugadores = Object.values(acumuladoMap);
    if (jugadores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: #6c757d; padding: 20px;">
                    No hay partidas registradas aún en el ranking acumulado.
                </td>
            </tr>
        `;
        return;
    }

    // 5. Ordenar por Puntos descendente
    jugadores.sort((a, b) => b.pts - a.pts);

    // 6. Dibujar las filas de la tabla
    tbody.innerHTML = "";
    jugadores.forEach((jug, index) => {
        const pos = index + 1;
        const pj = jug.pg + jug.pp;
        const pctVictoria = pj > 0 ? ((jug.pg / pj) * 100).toFixed(1) + "%" : "0.0%";

        // Indicadores visuales por zona (1-5 Verde, 6-10 Amarillo, 11-15 Naranja, 16+ Gris)
        let colorCirculo = "#6c757d";
        if (pos <= 5) colorCirculo = "#198754";
        else if (pos <= 10) colorCirculo = "#ffc107";
        else if (pos <= 15) colorCirculo = "#fd7e14";

        const variacion = jug.var !== undefined ? jug.var : 0;
        const varTexto = variacion > 0 ? `+${variacion}` : `${variacion}`;

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
            <td><em>${jug.ultimoSuceso || 'Sin participación'}</em></td>
        `;
        tbody.appendChild(tr);
    });
}

// Forzar ejecución al cargar la página
if (document.readyState === "complete" || document.readyState === "interactive") {
    renderTablaRankingGeneral();
} else {
    document.addEventListener("DOMContentLoaded", renderTablaRankingGeneral);
}
