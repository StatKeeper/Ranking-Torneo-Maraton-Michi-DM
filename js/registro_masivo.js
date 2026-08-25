// Poblado dinámico de Años (2026-2035), Meses, Jornadas (1-31) y Partidas (1-10)
function cargarSelectoresFechaDinamicos() {
    const anioInicio = 2026;
    const anioFin = 2035;
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // 1. Llenar selectores de Año
    const selectsAnio = document.querySelectorAll("#select-anio, #gestion-anio");
    selectsAnio.forEach(sel => {
        if (!sel) return;
        sel.innerHTML = "";
        for (let a = anioInicio; a <= anioFin; a++) {
            const opt = document.createElement("option");
            opt.value = a;
            opt.textContent = a;
            sel.appendChild(opt);
        }
    });

    // 2. Llenar selectores de Mes
    const selectsMes = document.querySelectorAll("#select-mes, #gestion-mes");
    selectsMes.forEach(sel => {
        if (!sel) return;
        sel.innerHTML = "";
        meses.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = m;
            if (m === "Agosto") opt.selected = true;
            sel.appendChild(opt);
        });
    });

    // 3. Llenar selectores de Jornada
    const selectsJornada = document.querySelectorAll("#jornada-select, #gestion-jornada");
    selectsJornada.forEach(sel => {
        if (!sel) return;
        sel.innerHTML = "";
        for (let i = 1; i <= 31; i++) {
            const num = i < 10 ? `0${i}` : i;
            const opt = document.createElement("option");
            opt.value = `Fecha ${num}`;
            opt.textContent = `Fecha ${num}`;
            sel.appendChild(opt);
        }
    });

    // 4. Llenar selectores de Partida
    const selectsPartida = document.querySelectorAll("#partida-select, #gestion-partida");
    selectsPartida.forEach(sel => {
        if (!sel) return;
        sel.innerHTML = "";
        for (let p = 1; p <= 10; p++) {
            const opt = document.createElement("option");
            opt.value = `Partida ${p}`;
            opt.textContent = `Partida ${p}`;
            sel.appendChild(opt);
        }
    });
}

// Obtener el nick oficial mediante la lista de equivalencias.js
function obtenerNickOficialLocal(nombreIngresado) {
    if (typeof equivalencias !== 'undefined') {
        const guardadas = localStorage.getItem("equivalencias_michi_dm");
        const lista = guardadas ? JSON.parse(guardadas) : equivalencias;
        const buscado = lista.find(e => e.antiguo.toLowerCase() === nombreIngresado.toLowerCase().trim());
        if (buscado) return buscado.oficial;
    }
    return nombreIngresado.trim();
}

// Limpia el texto de una celda y lo convierte a entero de forma segura
function parsearNumeroSeguro(texto) {
    if (!texto) return 0;
    const limpio = texto.toString().replace(/[^0-9]/g, '');
    return limpio ? parseInt(limpio, 10) : 0;
}

function procesarRegistroMasivo() {
    const anio = document.getElementById("select-anio") ? document.getElementById("select-anio").value : "2026";
    const mes = document.getElementById("select-mes") ? document.getElementById("select-mes").value : "Agosto";
    const periodo = `${mes} ${anio}`;
    
    const jornada = document.getElementById("jornada-select") ? document.getElementById("jornada-select").value : "Fecha 01";
    const partidaSelect = document.getElementById("partida-select") ? document.getElementById("partida-select").value : "Partida 1";
    const textoBloque = document.getElementById("bloque-datos") ? document.getElementById("bloque-datos").value : "";

    if (!textoBloque.trim()) {
        alert("Por favor ingresa el bloque de texto plano.");
        return;
    }

    const lineas = textoBloque.split("\n");
    let duracionExtraida = "";

    // Extraer duración del encabezado (ej. "Partida 1 01:07:08")
    for (let i = 0; i < lineas.length; i++) {
        const lineaLimpia = lineas[i].trim();
        if (lineaLimpia.toLowerCase().startsWith("partida")) {
            const partesHeader = lineaLimpia.split(" ");
            if (partesHeader.length >= 2) {
                duracionExtraida = partesHeader[partesHeader.length - 1];
                const inputDuracion = document.getElementById("duracion-partida");
                if (inputDuracion) inputDuracion.value = duracionExtraida;
            }
            break;
        }
    }

    if (!duracionExtraida) {
        duracionExtraida = document.getElementById("duracion-partida") ? document.getElementById("duracion-partida").value : "00:00:00";
    }

    const registrosProcesados = [];
    let contadorId = 1;

    // Control de Bonos Desactivados (Rcha y MG desactivados hasta nuevo aviso)
    const BONO_RACHA_ACTIVO = false;
    const BONO_MG_ACTIVO = false;

    lineas.forEach((linea) => {
        if (!linea.includes("|")) return;

        const partes = linea.split("|").map(p => p.trim());
        if (partes.length < 10) return;

        const nombreBruto = partes[0];
        if (nombreBruto.toLowerCase().startsWith("partida") || nombreBruto.toLowerCase().startsWith("bloque")) return;

        const jugadorOficial = obtenerNickOficialLocal(nombreBruto);

        // Mapeo seguro utilizando parsearNumeroSeguro
        // partes[1] es la columna V/D (1 para victoria, 0 para derrota)
        const valVictoriaCol = parsearNumeroSeguro(partes[1]);
        
        const ptsVictoria = valVictoriaCol > 0 ? 3 : 0;
        const vic = ptsVictoria > 0 ? 1 : 0;
        const der = vic === 1 ? 0 : 1;

        // Lectura de los 8 bonos en orden estándar:
        // 1. Excelencia (E), 2. Resistencia (R), 3. Militar (M), 4. Oro (O), 5. Sociedad (S)
        const e = parsearNumeroSeguro(partes[2]);
        const r = parsearNumeroSeguro(partes[3]);
        const m = parsearNumeroSeguro(partes[4]);
        const o = parsearNumeroSeguro(partes[5]);
        const s = parsearNumeroSeguro(partes[6]);
        
        // Racha y Matagigantes solo si están activos por reglamento
        const rch = BONO_RACHA_ACTIVO ? parsearNumeroSeguro(partes[7]) : 0;
        const mg = BONO_MG_ACTIVO ? parsearNumeroSeguro(partes[8]) : 0;
        const rlp = parsearNumeroSeguro(partes[9]);
        
        const equipo = partes.length >= 11 ? partes[10] : "";
        const civ = partes.length >= 12 ? partes[11] : "";

        // Puntuación Total = Puntos de Victoria (3) + Suma de Bonos
        const totalPuntosPartida = ptsVictoria + e + r + m + o + s + rch + mg + rlp;

        // Diminutivos estandarizados para notas de último suceso
        let sucesos = [];
        if (vic === 1) sucesos.push("Victoria");
        if (e === 1) sucesos.push("E");
        if (r === 1) sucesos.push("R");
        if (m === 1) sucesos.push("M");
        if (o === 1) sucesos.push("O");
        if (s === 1) sucesos.push("S");
        if (rch === 1) sucesos.push("Rch");
        if (mg === 1) sucesos.push("MG");
        if (rlp === 1) sucesos.push("RLP");

        registrosProcesados.push({
            id: contadorId++,
            periodo: periodo,
            jornada: jornada,
            partida: partidaSelect,
            duracion: duracionExtraida,
            jugador: jugadorOficial,
            pts: totalPuntosPartida,
            pg: vic,
            pp: der,
            equipo: equipo,
            civ: civ,
            bonos: { e, r, m, o, s, rch, mg, rlp },
            sucesoNota: sucesos.length > 0 ? sucesos.join(" + ") : "Sin participación"
        });
    });

    if (registrosProcesados.length === 0) {
        alert("No se pudieron extraer datos válidos del texto plano.");
        return;
    }

    // Limpiar BD local previa para esta partida específica antes de guardar la nueva
    const claveBD = `registros_${periodo}_${jornada}_${partidaSelect}`;
    localStorage.removeItem(claveBD);
    localStorage.setItem(claveBD, JSON.stringify(registrosProcesados));

    actualizarAcumuladosRanking();

    if (document.getElementById("gestion-anio")) document.getElementById("gestion-anio").value = anio;
    if (document.getElementById("gestion-mes")) document.getElementById("gestion-mes").value = mes;
    if (document.getElementById("gestion-jornada")) document.getElementById("gestion-jornada").value = jornada;
    if (document.getElementById("gestion-partida")) document.getElementById("gestion-partida").value = partidaSelect;

    alert(`✅ ¡Se registraron ${registrosProcesados.length} jugadores correctamente!`);
    renderTablaGestionRegistros();
}

function actualizarAcumuladosRanking() {
    let acumuladoGlobal = {};

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave.startsWith("registros_")) {
            const partidaDatos = JSON.parse(localStorage.getItem(clave));
            partidaDatos.forEach(reg => {
                if (!acumuladoGlobal[reg.jugador]) {
                    acumuladoGlobal[reg.jugador] = {
                        jugador: reg.jugador,
                        pts: 0,
                        pg: 0,
                        pp: 0,
                        e: 0, r: 0, m: 0, o: 0, s: 0, rch: 0, mg: 0, rlp: 0,
                        ultimoSuceso: reg.sucesoNota
                    };
                }
                
                // Sumatoria directa de todos los registros enviados
                acumuladoGlobal[reg.jugador].pts += reg.pts;
                acumuladoGlobal[reg.jugador].pg += reg.pg;
                acumuladoGlobal[reg.jugador].pp += reg.pp;
                acumuladoGlobal[reg.jugador].e += reg.bonos.e;
                acumuladoGlobal[reg.jugador].r += reg.bonos.r;
                acumuladoGlobal[reg.jugador].m += reg.bonos.m;
                acumuladoGlobal[reg.jugador].o += reg.bonos.o;
                acumuladoGlobal[reg.jugador].s += reg.bonos.s;
                acumuladoGlobal[reg.jugador].rch += reg.bonos.rch;
                acumuladoGlobal[reg.jugador].mg += reg.bonos.mg;
                acumuladoGlobal[reg.jugador].rlp += reg.bonos.rlp;
                acumuladoGlobal[reg.jugador].ultimoSuceso = reg.sucesoNota;
            });
        }
    }

    localStorage.setItem("ranking_acumulado_general", JSON.stringify(acumuladoGlobal));
}

function renderTablaGestionRegistros() {
    const anio = document.getElementById("gestion-anio") ? document.getElementById("gestion-anio").value : "2026";
    const mes = document.getElementById("gestion-mes") ? document.getElementById("gestion-mes").value : "Agosto";
    const periodo = `${mes} ${anio}`;
    const jornada = document.getElementById("gestion-jornada") ? document.getElementById("gestion-jornada").value : "Fecha 01";
    const partida = document.getElementById("gestion-partida") ? document.getElementById("gestion-partida").value : "Partida 1";

    const claveBD = `registros_${periodo}_${jornada}_${partida}`;
    const datosGuardados = localStorage.getItem(claveBD);
    const tbody = document.getElementById("tabla-registros-guardados");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!datosGuardados) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #6c757d; padding: 15px;">
                    No hay registros cargados aún para esta fecha/partida.
                </td>
            </tr>
        `;
        return;
    }

    const registros = JSON.parse(datosGuardados);

    registros.forEach(reg => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${reg.id}</strong></td>
            <td><strong>${reg.jugador}</strong></td>
            <td><span style="color: #0d6efd; font-weight: bold;">${reg.pts}</span></td>
            <td>${reg.pg}</td>
            <td>${reg.pp}</td>
            <td>${reg.equipo}</td>
            <td>${reg.civ}</td>
            <td>${reg.duracion}</td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarPartidaCompleta() {
    const anio = document.getElementById("gestion-anio").value;
    const mes = document.getElementById("gestion-mes").value;
    const periodo = `${mes} ${anio}`;
    const jornada = document.getElementById("gestion-jornada").value;
    const partida = document.getElementById("gestion-partida").value;

    const claveBD = `registros_${periodo}_${jornada}_${partida}`;
    if (confirm(`¿Deseas eliminar todos los registros de ${periodo} - ${jornada} - ${partida}?`)) {
        localStorage.removeItem(claveBD);
        actualizarAcumuladosRanking();
        renderTablaGestionRegistros();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarSelectoresFechaDinamicos();
    renderTablaGestionRegistros();
});
Paso 2: Reemplazar el contenido de js/ranking.js
Copia y reemplaza por completo el código de js/ranking.js:

JavaScript
function renderTablaRankingGeneral() {
    const tbody = document.getElementById("tabla-clasificacion");
    const tituloHeader = document.querySelector("#main-content h1");

    // Recalcular el acumulado global de todas las partidas guardadas en localStorage
    let acumuladoGlobal = {};
    let ultimaJornada = "Fecha 01";
    let ultimaPartida = "Partida 1";

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave.startsWith("registros_")) {
            const partesClave = clave.split("_");
            if (partesClave.length >= 4) {
                ultimaJornada = partesClave[2];
                ultimaPartida = partesClave[3];
            }

            try {
                const registros = JSON.parse(localStorage.getItem(clave));
                if (Array.isArray(registros)) {
                    registros.forEach(reg => {
                        if (!acumuladoGlobal[reg.jugador]) {
                            acumuladoGlobal[reg.jugador] = {
                                jugador: reg.jugador,
                                pts: 0,
                                pg: 0,
                                pp: 0,
                                ultimoSuceso: reg.sucesoNota
                            };
                        }
                        acumuladoGlobal[reg.jugador].pts += (reg.pts || 0);
                        acumuladoGlobal[reg.jugador].pg += (reg.pg || 0);
                        acumuladoGlobal[reg.jugador].pp += (reg.pp || 0);
                        acumuladoGlobal[reg.jugador].ultimoSuceso = reg.sucesoNota;
                    });
                }
            } catch (e) {
                console.error("Error al leer registro", e);
            }
        }
    }

    // Título dinámico: Ranking Michi DM Dinámico [Jornada] [Partida] [Fecha y Hora]
    const ahora = new Date();
    const fechaHoraStr = ahora.toLocaleString('es-PE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    if (tituloHeader) {
        tituloHeader.textContent = `Ranking Michi DM Dinámico ${ultimaJornada} ${ultimaPartida} ${fechaHoraStr}`;
    }

    let jugadores = Object.values(acumuladoGlobal);

    if (jugadores.length === 0) {
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; color: #6c757d; padding: 15px;">
                        No hay partidas registradas aún en el ranking acumulado.
                    </td>
                </tr>
            `;
        }
        return;
    }

    // Ordenar de mayor a menor puntaje acumulado
    jugadores.sort((a, b) => b.pts - a.pts);

    if (!tbody) return;
    tbody.innerHTML = "";

    jugadores.forEach((jug, index) => {
        const pos = index + 1;
        const pj = jug.pg + jug.pp;
        const pctVictoria = pj > 0 ? ((jug.pg / pj) * 100).toFixed(1) + "%" : "0.0%";

        // Colores por zona (1-5 Verde, 6-10 Amarillo, 11-15 Naranja, 16+ Gris)
        let colorCirculo = "#6c757d";
        if (pos <= 5) colorCirculo = "#198754";
        else if (pos <= 10) colorCirculo = "#ffc107";
        else if (pos <= 15) colorCirculo = "#fd7e14";

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${colorCirculo}; margin-right:5px;"></span>
                <strong>${pos}</strong>
            </td>
            <td>0</td>
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

// Ejecutar automáticamente al cargar la página o cambiar de pestaña
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderTablaRankingGeneral);
} else {
    renderTablaRankingGeneral();
}
