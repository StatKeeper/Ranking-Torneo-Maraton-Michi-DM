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

function procesarRegistroMasivo() {
    const periodo = document.getElementById("mes-periodo") ? document.getElementById("mes-periodo").value : "";
    const jornada = document.getElementById("jornada-select") ? document.getElementById("jornada-select").value : "";
    const partida = document.getElementById("partida-select") ? document.getElementById("partida-select").value : "";
    const duracionGeneral = document.getElementById("duracion-partida") ? document.getElementById("duracion-partida").value : "";
    const textoBloque = document.getElementById("bloque-texto") ? document.getElementById("bloque-texto").value : "";

    if (!textoBloque.trim()) {
        alert("Por favor ingresa el bloque de texto plano.");
        return;
    }

    const lineas = textoBloque.split("\n");
    const registrosProcesados = [];

    lineas.forEach((linea, index) => {
        if (!linea.includes("|")) return;

        const partes = linea.split("|").map(p => p.trim());
        if (partes.length < 12) return;

        const nombreBruto = partes[0];
        // Omitir líneas de encabezado o títulos
        if (nombreBruto.toLowerCase().startsWith("partida") || nombreBruto.toLowerCase().startsWith("bloque")) return;

        const jugadorOficial = obtenerNickOficialLocal(nombreBruto);

        const vic = parseInt(partes[2]) || 0;
        const der = parseInt(partes[3]) || 0;
        const e = parseInt(partes[4]) || 0;
        const r = parseInt(partes[5]) || 0;
        const m = parseInt(partes[6]) || 0;
        const o = parseInt(partes[7]) || 0;
        const s = parseInt(partes[8]) || 0;
        const rch = parseInt(partes[9]) || 0;
        const mg = parseInt(partes[10]) || 0;
        const rlp = parseInt(partes[11]) || 0;
        const equipo = partes[12] || "";
        const civ = partes[13] || "";

        // Sumatoria total de puntos
        const totalPuntosPartida = vic + e + r + m + o + s + rch + mg + rlp;

        registrosProcesados.push({
            id: index + 1,
            periodo: periodo,
            jornada: jornada,
            partida: partida,
            duracion: duracionGeneral,
            jugador: jugadorOficial,
            pts: totalPuntosPartida,
            pg: vic,
            pp: der,
            equipo: equipo,
            civ: civ,
            bonos: { e, r, m, o, s, rch, mg, rlp }
        });
    });

    if (registrosProcesados.length === 0) {
        alert("No se pudieron extraer datos válidos del texto plano.");
        return;
    }

    // Guardar en la base de datos local
    const claveBD = `registros_${periodo}_${jornada}_${partida}`;
    localStorage.setItem(claveBD, JSON.stringify(registrosProcesados));

    alert("¡Datos procesados y registrados correctamente!");
    renderTablaGestionRegistros();
}

function renderTablaGestionRegistros() {
    const periodo = document.getElementById("gestion-periodo") ? document.getElementById("gestion-periodo").value : "";
    const jornada = document.getElementById("gestion-jornada") ? document.getElementById("gestion-jornada").value : "";
    const partida = document.getElementById("gestion-partida") ? document.getElementById("gestion-partida").value : "";

    const claveBD = `registros_${periodo}_${jornada}_${partida}`;
    const datosGuardados = localStorage.getItem(claveBD);
    const tbody = document.getElementById("tabla-registros-guardados");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!datosGuardados) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #6c757d; padding: 15px;">
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
            <td>${reg.jugador}</td>
            <td><strong>${reg.pts}</strong></td>
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
    const periodo = document.getElementById("gestion-periodo").value;
    const jornada = document.getElementById("gestion-jornada").value;
    const partida = document.getElementById("gestion-partida").value;

    const claveBD = `registros_${periodo}_${jornada}_${partida}`;
    localStorage.removeItem(claveBD);
    renderTablaGestionRegistros();
}
