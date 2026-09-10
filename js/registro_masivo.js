document.addEventListener("DOMContentLoaded", function() {
    inicializarSelectoresRegistroMasivo();
    configurarEventosRegistroMasivo();
    cargarDatosGestionRegistros();
});

function inicializarSelectoresRegistroMasivo() {
    const selectAnio = document.getElementById("select-anio-registro") || document.getElementById("filtro-anio");
    if (selectAnio && selectAnio.options.length <= 1) {
        selectAnio.innerHTML = "";
        for (let a = 2026; a <= 2035; a++) {
            const opt = document.createElement("option");
            opt.value = a;
            opt.textContent = a;
            if (a === 2026) opt.selected = true;
            selectAnio.appendChild(opt);
        }
    }
}

function configurarEventosRegistroMasivo() {
    const selectAnio = document.getElementById("select-anio-registro") || document.getElementById("filtro-anio");
    const selectMes = document.getElementById("select-mes-registro") || document.getElementById("filtro-mes");
    const selectFecha = document.getElementById("select-jornada-registro") || document.getElementById("select-fecha-registro") || document.getElementById("filtro-fecha");
    const selectPartida = document.getElementById("select-partida-registro");

    [selectAnio, selectMes, selectFecha, selectPartida].forEach(el => {
        if (el) {
            el.addEventListener("change", cargarDatosGestionRegistros);
        }
    });

    const btnProcesar = document.getElementById("btn-procesar-texto") || document.querySelector("button[onclick*='Procesar']") || document.querySelector("button[onclick*='procesar']");
    if (btnProcesar && !btnProcesar.hasAttribute('data-listener')) {
        btnProcesar.setAttribute('data-listener', 'true');
        btnProcesar.addEventListener("click", procesarTextoPlanoRegistroMasivo);
    }
}

// Función auxiliar para subir el localStorage completo a la nube automáticamente
async function sincronizarLocalStorageConNube() {
    try {
        let datosCompletos = {};
        for (let i = 0; i < localStorage.length; i++) {
            let k = localStorage.key(i);
            datosCompletos[k] = localStorage.getItem(k);
        }
        if (typeof guardarDatosNube === 'function') {
            await guardarDatosNube(datosCompletos);
        }
    } catch (e) {
        console.error("Error sincronizando con la nube:", e);
    }
}

async function procesarTextoPlanoRegistroMasivo() {
    const textarea = document.getElementById("texto-plano-input") || document.getElementById("bloque-datos") || document.querySelector("textarea");
    if (!textarea || !textarea.value.trim()) {
        alert("Por favor ingresa o pega el texto plano con los registros de la partida.");
        return;
    }

    const lineas = textarea.value.split("\n");
    let registrosPartida = [];

    const selectAnio = document.getElementById("select-anio-registro") || document.getElementById("select-anio");
    const selectMes = document.getElementById("select-mes-registro") || document.getElementById("select-mes");
    const selectFecha = document.getElementById("select-jornada-registro") || document.getElementById("select-fecha-registro") || document.getElementById("jornada-select");
    const selectPartida = document.getElementById("select-partida-registro") || document.getElementById("partida-select");
    const inputDuracion = document.getElementById("input-duracion") || document.getElementById("duracion-partida") || document.querySelector("input[placeholder*='01:07:08']");

    let anioVal = selectAnio ? selectAnio.value : "2026";
    let mesVal = selectMes ? selectMes.value : "agosto";
    let fechaStr = selectFecha ? selectFecha.value : "Fecha 01";
    let partidaStr = selectPartida ? selectPartida.value : "Partida 1";
    let duracionPartida = inputDuracion ? inputDuracion.value.trim() : "01:07:08";
    let duracionDetectada = "01:07:08";

    const mesesMap = {enero:"01", febrero:"02", marzo:"03", abril:"04", mayo:"05", junio:"06", julio:"07", agosto:"08", septiembre:"09", octubre:"10", noviembre:"11", diciembre:"12"};
    let mesNum = mesesMap[mesVal.toLowerCase()] || "08";

    lineas.forEach((linea, index) => {
        let lineaTrim = linea.trim();
        if (!lineaTrim) return;

        if (lineaTrim.toLowerCase().includes("partida") && lineaTrim.includes(":")) {
            let partesDuracion = lineaTrim.split(/\s+/);
            let ultimaParte = partesDuracion[partesDuracion.length - 1];
            if (ultimaParte.includes(":")) {
                duracionDetectada = ultimaParte;
            }
            return;
        }

        let partes = lineaTrim.split('|').map(p => p.trim()).filter(p => p !== "");
        if (partes.length < 3) {
            partes = lineaTrim.split(/\s{2,}|\t+/).map(p => p.trim()).filter(p => p !== "");
        }

        if (partes.length >= 2) {
            let jugador = partes[0].replace(/^\[.*?\]\s*/, '').trim();
            if (partes[0].startsWith("[")) {
                let matchClan = partes[0].match(/^(\[.*?\])\s*(.*)$/);
                if (matchClan) {
                    jugador = `${matchClan[1]} ${matchClan[2]}`.trim();
                }
            }

            let ptsTotales = 0;
            let vd = 0;
            let e = 0, r = 0, m = 0, o = 0, s = 0, rch = 0, mg = 0, rlp = 0;
            let uAses = "0", eArr = "0", equipo = "Sin Equipo", civ = "-";

            let numerosEnLinea = partes.slice(1).map(p => parseInt(p)).filter(n => !isNaN(n));
            
            if (numerosEnLinea.length > 0) {
                if (numerosEnLinea[0] === 0 || numerosEnLinea[0] === 1) {
                    vd = numerosEnLinea[0];
                }
                
                let posiblePts = numerosEnLinea[1] !== undefined ? numerosEnLinea[1] : (vd === 1 ? 3 : 0);
                
                e = parseInt(partes[2]) || 0;
                r = parseInt(partes[3]) || 0;
                m = parseInt(partes[4]) || 0;
                o = parseInt(partes[5]) || 0;
                s = parseInt(partes[6]) || 0;
                rch = parseInt(partes[7]) || 0;
                mg = parseInt(partes[8]) || 0;
                rlp = parseInt(partes[9]) || 0;

                let sumaBonos = e + r + m + o + s + rch + mg + rlp;
                let baseWin = (vd === 1) ? 3 : 0;
                
                ptsTotales = Math.max(posiblePts, baseWin + sumaBonos);
                if (ptsTotales === 0 && vd === 1) ptsTotales = 3 + sumaBonos;

                uAses = partes[10] || numerosEnLinea[9] || "0";
                eArr = partes[11] || numerosEnLinea[10] || "0";
                equipo = partes[12] || "Equipo 1";
                civ = partes[13] || "-";
            } else {
                vd = partes[1] === "1" || partes[1]?.toLowerCase() === "true" ? 1 : 0;
                ptsTotales = vd === 1 ? 3 : 0;
            }

            let sucesoNotas = [];
            if (vd === 1) sucesoNotas.push("Victoria");
            if (e > 0) sucesoNotas.push("E");
            if (r > 0) sucesoNotas.push("R");
            if (m > 0) sucesoNotas.push("M");
            if (o > 0) sucesoNotas.push("O");
            if (s > 0) sucesoNotas.push("S");
            if (rch > 0) sucesoNotas.push("Rch");
            if (mg > 0) sucesoNotas.push("MG");
            if (rlp > 0) sucesoNotas.push("RLP");

            let sucesoNotaStr = sucesoNotas.length > 0 ? sucesoNotas.join(" + ") : (vd === 1 ? "Victoria" : "Derrota");

            registrosPartida.push({
                id: index + 1,
                jugador: jugador,
                pts: ptsTotales,
                pg: vd,
                pp: vd === 0 ? 1 : 0,
                e: e, r: r, m: m, o: o, s: s,
                rch: rch, mg: mg, rlp: rlp,
                uAses: uAses,
                eArr: eArr,
                equipo: equipo,
                civ: civ,
                duracion: duracionPartida !== "01:07:08" ? duracionPartida : duracionDetectada,
                sucesoNota: sucesoNotaStr,
                fechaHora: new Date().toLocaleString("es-PE")
            });
        }
    });

    if (registrosPartida.length === 0) {
        alert("No se pudo interpretar el formato del texto plano.");
        return;
    }

    let claveStorage = `registros_${anioVal}-${mesNum}_${fechaStr}_${partidaStr}`.replace(/\s+/g, '_');
    localStorage.setItem(claveStorage, JSON.stringify(registrosPartida));

    // Sincronizar automáticamente con la nube para que los celulares y otras PCs se actualicen
    await sincronizarLocalStorageConNube();

    alert("¡Partida procesada, registrada y sincronizada en la nube con éxito para toda la comunidad!");
    cargarDatosGestionRegistros();
}

function cargarDatosGestionRegistros() {
    const tbody = document.getElementById("tabla-gestion-registros") || document.getElementById("tabla-registros-guardados") || document.querySelector("table tbody");
    if (!tbody) return;

    const selectAnio = document.getElementById("gestion-anio") || document.getElementById("select-anio");
    const selectMes = document.getElementById("gestion-mes") || document.getElementById("select-mes");
    const selectFecha = document.getElementById("gestion-jornada") || document.getElementById("jornada-select");
    const selectPartida = document.getElementById("gestion-partida") || document.getElementById("partida-select");

    let anioVal = selectAnio ? selectAnio.value : "2026";
    let mesVal = selectMes ? selectMes.value : "agosto";
    let fechaStr = selectFecha ? selectFecha.value : "Fecha 01";
    let partidaStr = selectPartida ? selectPartida.value : "Partida 1";

    const mesesMap = {enero:"01", febrero:"02", marzo:"03", abril:"04", mayo:"05", junio:"06", julio:"07", agosto:"08", septiembre:"09", octubre:"10", noviembre:"11", diciembre:"12"};
    let mesNum = mesesMap[mesVal.toLowerCase()] || "08";

    let claveStorage = `registros_${anioVal}-${mesNum}_${fechaStr}_${partidaStr}`.replace(/\s+/g, '_');
    let datosGuardados = localStorage.getItem(claveStorage);

    tbody.innerHTML = "";

    if (!datosGuardados) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #888; padding: 15px;">No hay registros guardados para esta combinación.</td></tr>`;
        return;
    }

    try {
        let registros = JSON.parse(datosGuardados);
        if (!Array.isArray(registros) || registros.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #888; padding: 15px;">No hay registros disponibles.</td></tr>`;
            return;
        }

        registros.forEach((reg, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="padding: 6px; border: 1px solid #444; text-align: center;">${reg.id || (index + 1)}</td>
                <td style="padding: 6px; border: 1px solid #444;"><strong>${reg.jugador || "-"}</strong></td>
                <td style="padding: 6px; border: 1px solid #444; text-align: center;"><span style="color: #0d6efd; font-weight: bold;">${reg.pts !== undefined ? reg.pts : 0}</span></td>
                <td style="padding: 6px; border: 1px solid #444; text-align: center;">${reg.pg !== undefined ? reg.pg : 0}</td>
                <td style="padding: 6px; border: 1px solid #444; text-align: center;">${reg.pp !== undefined ? reg.pp : 0}</td>
                <td style="padding: 6px; border: 1px solid #444; text-align: center;">${reg.uAses !== undefined ? reg.uAses : 0}</td>
                <td style="padding: 6px; border: 1px solid #444; text-align: center;">${reg.eArr !== undefined ? reg.eArr : 0}</td>
                <td style="padding: 6px; border: 1px solid #444; text-align: center;">${reg.equipo || "-"}</td>
                <td style="padding: 6px; border: 1px solid #444;">${reg.civ || "-"}</td>
                <td style="padding: 6px; border: 1px solid #444; text-align: center;">${reg.duracion || "01:07:08"}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error al cargar registros de gestión:", e);
    }
}
