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

    const btnProcesar = document.getElementById("btn-procesar-texto") || document.querySelector("button[onclick*='Procesar']");
    if (btnProcesar && !btnProcesar.hasAttribute('data-listener')) {
        btnProcesar.setAttribute('data-listener', 'true');
        btnProcesar.addEventListener("click", procesarTextoPlanoRegistroMasivo);
    }
}

// Función principal de procesamiento de texto plano con la sumatoria correcta de bonos en Pts
function procesarTextoPlanoRegistroMasivo() {
    const textarea = document.getElementById("texto-plano-input") || document.querySelector("textarea");
    if (!textarea || !textarea.value.trim()) {
        alert("Por favor ingresa o pega el texto plano con los registros de la partida.");
        return;
    }

    const lineas = textarea.value.split("\n");
    let registrosPartida = [];

    const selectAnio = document.getElementById("select-anio-registro") ? document.getElementById("select-anio-registro").value : "2026";
    const selectMes = document.getElementById("select-mes-registro") ? document.getElementById("select-mes-registro").value : "08";
    const selectFecha = document.getElementById("select-jornada-registro") || document.getElementById("select-fecha-registro");
    const selectPartida = document.getElementById("select-partida-registro");
    const inputDuracion = document.getElementById("input-duracion") || document.querySelector("input[placeholder*='01:07:08']");

    let fechaStr = selectFecha ? selectFecha.value : "Fecha 01";
    let partidaStr = selectPartida ? selectPartida.value : "Partida 1";
    let duracionPartida = inputDuracion ? inputDuracion.value.trim() : "01:07:08";

    let duracionDetectada = "01:07:08";

    lineas.forEach(linea => {
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

        let partes = lineaTrim.split('|').map(p => p.trim());
        if (partes.length < 12) {
            partes = lineaTrim.split(/\s*\|\s*/);
        }

        if (partes.length >= 12) {
            let jugador = partes[0].replace(/^\[.*?\]\s*/, '').trim();
            if (partes[0].startsWith("[")) {
                let matchClan = partes[0].match(/^(\[.*?\])\s*(.*)$/);
                if (matchClan) {
                    jugador = `${matchClan[1]} ${matchClan[2]}`.trim();
                }
            }

            let vd = parseInt(partes[1]) || 0;  // Victoria (1) / Derrota (0)
            let e = parseInt(partes[2]) || 0;   // Excelencia
            let r = parseInt(partes[3]) || 0;   // Resistencia
            let m = parseInt(partes[4]) || 0;   // Militar
            let o = parseInt(partes[5]) || 0;   // Oro
            let s = parseInt(partes[6]) || 0;   // Sociedad
            let rch = parseInt(partes[7]) || 0; // Racha
            let mg = parseInt(partes[8]) || 0;  // Matagigantes
            let rlp = parseInt(partes[9]) || 0; // Relámpago

            let uAses = parseInt(partes[10]) || 0; // Unidades Asesinadas
            let eArr = parseInt(partes[11]) || 0;  // Edificios Arrasados
            let equipo = partes[12] || "Equipo 1";
            let civ = partes[13] || "-";

            // REGLA CLAVE: Pts suma la victoria (3 puntos si vd === 1) más todos los bonos obtenidos
            let puntosBaseVictoria = (vd === 1) ? 3 : 0;
            let totalBonos = e + r + m + o + s + rch + mg + rlp;
            let ptsTotales = puntosBaseVictoria + totalBonos;

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
                jugador: jugador,
                pts: ptsTotales,
                pg: vd,
                pp: vd === 0 ? 1 : 0,
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
        alert("No se pudo interpretar el formato del texto plano. Verifica que siga la estructura de columnas establecida.");
        return;
    }

    let claveStorage = `registros_${selectAnio}-${selectMes}_${fechaStr}_${partidaStr}`.replace(/\s+/g, '_');
    localStorage.setItem(claveStorage, JSON.stringify(registrosPartida));

    alert("¡Partida procesada y registrada exitosamente con la sumatoria de puntos y bonos!");
    cargarDatosGestionRegistros();
}

function cargarDatosGestionRegistros() {
    const tbody = document.getElementById("tabla-gestion-registros") || document.querySelector("table tbody");
    if (!tbody) return;

    const selectAnio = document.getElementById("select-anio-registro") ? document.getElementById("select-anio-registro").value : "2026";
    const selectMes = document.getElementById("select-mes-registro") ? document.getElementById("select-mes-registro").value : "08";
    const selectFecha = document.getElementById("select-jornada-registro") || document.getElementById("select-fecha-registro");
    const selectPartida = document.getElementById("select-partida-registro");

    let fechaStr = selectFecha ? selectFecha.value : "Fecha 01";
    let partidaStr = selectPartida ? selectPartida.value : "Partida 1";

    let claveStorage = `registros_${selectAnio}-${selectMes}_${fechaStr}_${partidaStr}`.replace(/\s+/g, '_');
    let datosGuardados = localStorage.getItem(claveStorage);

    tbody.innerHTML = "";

    if (!datosGuardados) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #888; padding: 15px;">No hay registros guardados para esta combinación de fecha y partida.</td></tr>`;
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
                <td>${index + 1}</td>
                <td><strong>${reg.jugador || "-"}</strong></td>
                <td><span style="color: #0d6efd; font-weight: bold;">${reg.pts !== undefined ? reg.pts : 0}</span></td>
                <td>${reg.pg !== undefined ? reg.pg : 0}</td>
                <td>${reg.pp !== undefined ? reg.pp : 0}</td>
                <td>${reg.uAses !== undefined ? reg.uAses : 0}</td>
                <td>${reg.eArr !== undefined ? reg.eArr : 0}</td>
                <td>${reg.equipo || "-"}</td>
                <td>${reg.civ || "-"}</td>
                <td>${reg.duracion || "01:07:08"}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error al cargar registros de gestión:", e);
    }
}

function eliminarRegistroPartida(idIndividual = null) {
    const selectAnio = document.getElementById("select-anio-registro") ? document.getElementById("select-anio-registro").value : "2026";
    const selectMes = document.getElementById("select-mes-registro") ? document.getElementById("select-mes-registro").value : "08";
    const selectFecha = document.getElementById("select-jornada-registro") || document.getElementById("select-fecha-registro");
    const selectPartida = document.getElementById("select-partida-registro");

    let fechaStr = selectFecha ? selectFecha.value : "Fecha 01";
    let partidaStr = selectPartida ? selectPartida.value : "Partida 1";
    let claveStorage = `registros_${selectAnio}-${selectMes}_${fechaStr}_${partidaStr}`.replace(/\s+/g, '_');

    if (idIndividual !== null) {
        let registros = JSON.parse(localStorage.getItem(claveStorage) || "[]");
        registros.splice(idIndividual, 1);
        localStorage.setItem(claveStorage, JSON.stringify(registros));
    } else {
        localStorage.removeItem(claveStorage);
    }
    cargarDatosGestionRegistros();
}
