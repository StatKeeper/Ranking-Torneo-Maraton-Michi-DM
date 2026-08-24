// Poblado dinámico de Años (2026-2035), Meses, Jornadas (1-31) y Partidas (1-10)
function cargarSelectoresFechaDinamicos() {
    const anioInicio = 2026;
    const anioFin = 2035;
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // 1. Llenar selectores de Año (Sección Registro y Sección Gestión)
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
            if (m === "Agosto") opt.selected = true; // Por defecto
            sel.appendChild(opt);
        });
    });

    // 3. Llenar selectores de Jornada (Fecha 01 a Fecha 31)
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

    // 4. Llenar selectores de Partida (Partida 1 a Partida 10)
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

function procesarRegistroMasivo() {
    // 1. Obtener Periodo uniendo Mes y Año
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

    // Extraer automáticamente la duración de la primera línea (ej. "Partida 1 1:07:08")
    for (let i = 0; i < lineas.length; i++) {
        const lineaLimpia = lineas[i].trim();
        if (lineaLimpia.toLowerCase().startsWith("partida")) {
            const partesHeader = lineaLimpia.split(" ");
            if (partesHeader.length >= 3) {
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

    // Procesar jugadores
    lineas.forEach((linea) => {
        if (!linea.includes("|")) return;

        const partes = linea.split("|").map(p => p.trim());
        if (partes.length < 12) return;

        const nombreBruto = partes[0];
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

        const totalPuntosPartida = vic + e + r + m + o + s + rch + mg + rlp;

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

    // 2. Guardar en Base de Datos Local por Partida
    const claveBD = `registros_${periodo}_${jornada}_${partidaSelect}`;
    localStorage.setItem(claveBD, JSON.stringify(registrosProcesados));

    // 3. Alimentar el Ranking Acumulado General
    actualizarAcumuladosRanking();

    // 4. Sincronizar automáticamente los filtros inferiores de gestión con lo que se acaba de procesar
    if (document.getElementById("gestion-anio")) document.getElementById("gestion-anio").value = anio;
    if (document.getElementById("gestion-mes")) document.getElementById("gestion-mes").value = mes;
    if (document.getElementById("gestion-jornada")) document.getElementById("gestion-jornada").value = jornada;
    if (document.getElementById("gestion-partida")) document.getElementById("gestion-partida").value = partidaSelect;

    alert(`✅ ¡Se registraron ${registrosProcesados.length} jugadores para ${periodo} - ${jornada} - ${partidaSelect}!`);
    renderTablaGestionRegistros();
}

// Suma todos los datos guardados para alimentar la pestaña Clasificación General
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

// Inicializar selectores dinámicos y renderizar datos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    cargarSelectoresFechaDinamicos();
    renderTablaGestionRegistros();
});
