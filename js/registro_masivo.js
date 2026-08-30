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
        const valorActual = sel.value;
        sel.innerHTML = "";
        for (let a = anioInicio; a <= anioFin; a++) {
            const opt = document.createElement("option");
            opt.value = a;
            opt.textContent = a;
            sel.appendChild(opt);
        }
        if (valorActual) sel.value = valorActual;
    });

    // 2. Llenar selectores de Mes
    const selectsMes = document.querySelectorAll("#select-mes, #gestion-mes");
    selectsMes.forEach(sel => {
        if (!sel) return;
        const valorActual = sel.value;
        sel.innerHTML = "";
        meses.forEach((m, idx) => {
            const opt = document.createElement("option");
            const numMes = (idx + 1).toString().padStart(2, '0');
            opt.value = numMes; 
            opt.textContent = m;
            sel.appendChild(opt);
        });
        if (valorActual) {
            sel.value = valorActual;
        } else {
            sel.value = "08"; // Por defecto Agosto
        }
    });

    // 3. Llenar selectores de Jornada
    const selectsJornada = document.querySelectorAll("#jornada-select, #gestion-jornada");
    selectsJornada.forEach(sel => {
        if (!sel) return;
        const valorActual = sel.value;
        sel.innerHTML = "";
        for (let i = 1; i <= 31; i++) {
            const num = i < 10 ? `0${i}` : i;
            const opt = document.createElement("option");
            opt.value = `Fecha ${num}`;
            opt.textContent = `Fecha ${num}`;
            sel.appendChild(opt);
        }
        if (valorActual) sel.value = valorActual;
    });

    // 4. Llenar selectores de Partida
    const selectsPartida = document.querySelectorAll("#partida-select, #gestion-partida");
    selectsPartida.forEach(sel => {
        if (!sel) return;
        const valorActual = sel.value;
        sel.innerHTML = "";
        for (let p = 1; p <= 10; p++) {
            const opt = document.createElement("option");
            opt.value = `Partida ${p}`;
            opt.textContent = `Partida ${p}`;
            sel.appendChild(opt);
        }
        if (valorActual) sel.value = valorActual;
    });
}

function obtenerNickOficialLocal(nombreIngresado) {
    if (typeof equivalencias !== 'undefined') {
        const guardadas = localStorage.getItem("equivalencias_michi_dm");
        const lista = guardadas ? JSON.parse(guardadas) : equivalencias;
        const buscado = lista.find(e => e.antiguo.toLowerCase() === nombreIngresado.toLowerCase().trim());
        if (buscado) return buscado.oficial;
    }
    return nombreIngresado.trim();
}

function parsearNumeroSeguro(texto) {
    if (!texto) return 0;
    const limpio = texto.toString().replace(/[^0-9]/g, '');
    return limpio ? parseInt(limpio, 10) : 0;
}

function procesarRegistroMasivo() {
    const anio = document.getElementById("select-anio") ? document.getElementById("select-anio").value : "2026";
    const mesVal = document.getElementById("select-mes") ? document.getElementById("select-mes").value : "08";
    
    const mesFormatted = mesVal.length === 1 ? `0${mesVal}` : mesVal;
    const periodo = `${anio}-${mesFormatted}`;
    
    const jornada = document.getElementById("jornada-select") ? document.getElementById("jornada-select").value : "Fecha 01";
    const partidaSelect = document.getElementById("partida-select") ? document.getElementById("partida-select").value : "Partida 1";
    const textoBloque = document.getElementById("bloque-datos") ? document.getElementById("bloque-datos").value : "";

    if (!textoBloque.trim()) {
        alert("Por favor ingresa el bloque de texto plano.");
        return;
    }

    const lineas = textoBloque.split("\n");
    let duracionExtraida = "";

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

    const fechaHoraActual = new Date().toLocaleString("es-PE", {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });

    const registrosProcesados = [];
    let contadorId = 1;

    const BONO_RACHA_ACTIVO = false;
    const BONO_MG_ACTIVO = false;

    lineas.forEach((linea) => {
        if (!linea.includes("|")) return;

        const partes = linea.split("|").map(p => p.trim());
        if (partes.length < 10) return;

        const nombreBruto = partes[0];
        if (nombreBruto.toLowerCase().startsWith("partida") || nombreBruto.toLowerCase().startsWith("bloque")) return;

        const jugadorOficial = obtenerNickOficialLocal(nombreBruto);

        const valVictoriaCol = parsearNumeroSeguro(partes[1]);
        const ptsVictoria = valVictoriaCol > 0 ? 3 : 0;
        const vic = ptsVictoria > 0 ? 1 : 0;
        const der = vic === 1 ? 0 : 1;

        const e = parsearNumeroSeguro(partes[2]);
        const r = parsearNumeroSeguro(partes[3]);
        const m = parsearNumeroSeguro(partes[4]);
        const o = parsearNumeroSeguro(partes[5]);
        const s = parsearNumeroSeguro(partes[6]);
        
        const rch = BONO_RACHA_ACTIVO ? parsearNumeroSeguro(partes[7]) : 0;
        const mg = BONO_MG_ACTIVO ? parsearNumeroSeguro(partes[8]) : 0;
        const rlp = parsearNumeroSeguro(partes[9]);
        
        // Orden correcto de los datos en el texto plano:
        // [10] -> Unidades Asesinadas
        // [11] -> Edificios Arrasados
        // [12] -> Equipo
        // [13] -> Civilización
        const unidadesAsesinadas = partes.length >= 11 ? parsearNumeroSeguro(partes[10]) : 0;
        const edificiosArrasados = partes.length >= 12 ? parsearNumeroSeguro(partes[11]) : 0;
        const equipo = partes.length >= 13 ? partes[12] : "-";
        const civ = partes.length >= 14 ? partes[13] : "-";

        const totalPuntosPartida = ptsVictoria + e + r + m + o + s + rch + mg + rlp;

        let sucesos = [];
        if (vic === 1) sucesos.push("Victoria");
        else if (der === 1) sucesos.push("Derrota");
        
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
            unidadesAsesinadas: unidadesAsesinadas, 
            edificiosArrasados: edificiosArrasados,
            equipo: equipo,
            civ: civ,
            bonos: { e, r, m, o, s, rch, mg, rlp },
            sucesoNota: sucesos.length > 0 ? sucesos.join(" + ") : "Sin participación",
            fechaHora: fechaHoraActual
        });
    });

    if (registrosProcesados.length === 0) {
        alert("No se pudieron extraer datos válidos del texto plano.");
        return;
    }

    const claveBD = `registros_${periodo}_${jornada}_${partidaSelect}`;
    localStorage.removeItem(claveBD);
    localStorage.setItem(claveBD, JSON.stringify(registrosProcesados));

    actualizarAcumuladosRanking();

    if (document.getElementById("gestion-anio")) document.getElementById("gestion-anio").value = anio;
    if (document.getElementById("gestion-mes")) document.getElementById("gestion-mes").value = mesFormatted;
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
                        pts: 0, pg: 0, pp: 0,
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
    const mesVal = document.getElementById("gestion-mes") ? document.getElementById("gestion-mes").value : "08";
    const mesFormatted = mesVal.length === 1 ? `0${mesVal}` : mesVal;
    const periodo = `${anio}-${mesFormatted}`;
    
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
                <td colspan="10" style="text-align: center; color: #6c757d; padding: 15px;">
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
            <td>${reg.unidadesAsesinadas || 0}</td>
            <td>${reg.edificiosArrasados || 0}</td>
            <td>${reg.equipo || "-"}</td>
            <td>${reg.civ || "-"}</td>
            <td>${reg.duracion}</td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarPartidaCompleta() {
    const anio = document.getElementById("gestion-anio").value;
    const mesVal = document.getElementById("gestion-mes").value;
    const mesFormatted = mesVal.length === 1 ? `0${mesVal}` : mesVal;
    const periodo = `${anio}-${mesFormatted}`;
    
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
