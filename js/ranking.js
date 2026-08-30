// 1. Llenar selectores de Fecha dinámicos
function cargarSelectoresFechaDinamicos() {
    const anioInicio = 2026;
    const anioFin = 2035;
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    // Selectores de año
    document.querySelectorAll("#select-anio, #gestion-anio").forEach(sel => {
        if (!sel) return;
        sel.innerHTML = "";
        for (let a = anioInicio; a <= anioFin; a++) {
            const opt = document.createElement("option");
            opt.value = a;
            opt.textContent = a;
            if (a === 2026) opt.selected = true;
            sel.appendChild(opt);
        }
    });

    // Selectores de mes
    document.querySelectorAll("#select-mes, #gestion-mes").forEach(sel => {
        if (!sel) return;
        sel.innerHTML = "";
        meses.forEach((m, idx) => {
            const opt = document.createElement("option");
            const numMes = (idx + 1).toString().padStart(2, '0');
            opt.value = numMes;
            opt.textContent = m;
            if (numMes === "08") opt.selected = true;
            sel.appendChild(opt);
        });
    });

    // Selectores de jornada
    document.querySelectorAll("#jornada-select, #gestion-jornada").forEach(sel => {
        if (!sel) return;
        sel.innerHTML = "";
        for (let i = 1; i <= 31; i++) {
            const opt = document.createElement("option");
            opt.value = `Fecha ${i}`;
            opt.textContent = `Fecha ${i}`;
            sel.appendChild(opt);
        }
    });

    // Selectores de partida
    document.querySelectorAll("#partida-select, #gestion-partida").forEach(sel => {
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

// Obtener el nick oficial mediante la lista de equivalencias
function obtenerNickOficial(nombreIngresado) {
    if (typeof equivalencias === 'undefined') return nombreIngresado.trim();
    let mapaGuardadas = {};
    const correccionesGuardadas = localStorage.getItem("mapa_correccion_nombres") || localStorage.getItem("correcciones_nombres");
    if (correccionesGuardadas) {
        try {
            mapaGuardadas = JSON.parse(correccionesGuardadas);
        } catch (e) {
            console.error("Error parseando equivalencias:", e);
        }
    }
    return mapaGuardadas[nombreIngresado] || nombreIngresado.trim();
}

// Limpia el texto de una celda y lo convierte a entero de forma segura
function pancarNumeroSeguro(texto) {
    if (!texto) return 0;
    const limpio = texto.toString().replace(/[^0-9-]/g, '');
    return parseInt(limpio, 10) || 0;
}

// Procesar Registro Masivo
function procesarRegistroMasivo() {
    const anio = document.getElementById("select-anio").value;
    const mes = document.getElementById("select-mes").value;
    const mesFormatted = mes.length === 1 ? `0${mes}` : mes;
    const periodo = `${anio}-${mesFormatted}`;
    
    const jornada = document.getElementById("jornada-select").value;
    const partidaSelect = document.getElementById("partida-select").value;
    const bloqueDatos = document.getElementById("bloque-datos");

    if (!bloqueDatos || !bloqueDatos.value.trim()) {
        alert("Por favor ingresa el bloque de texto plano.");
        return;
    }

    const lineas = bloqueDatos.value.trim().split("\n");
    let duracionExtraida = "";

    // Extraer duración del encabezado (ej. "Partida 1 01:07:08")
    for (let i = 0; i < lineas.length; i++) {
        const lineaLimpia = lineas[i].trim().toLowerCase();
        if (lineaLimpia.startsWith("partida")) {
            const partesHeader = lineaLimpia.split(" ");
            if (partesHeader.length >= 2) {
                duracionExtraida = partesHeader[partesHeader.length - 1];
                const inputDuracion = document.getElementById("duracion-partida");
                if (inputDuracion) inputDuracion.value = duracionExtraida;
                break;
            }
        }
    }

    if (!duracionExtraida) {
        const inputDuracion = document.getElementById("duracion-partida");
        if (inputDuracion) inputDuracion.value = "00:00:00";
    }

    const fechaHoraActual = new Date().toLocaleString("es-PE", { year: 'numeric', month: '2-digit', day: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const registrosProcesados = [];
    let contadorId = 1;

    // Control de Bonos Desactivados según directrices previas
    const BONO_RACHA_ACTIVO = false;
    const BONO_MG_ACTIVO = false;

    lineas.forEach((linea) => {
        if (!linea.includes("\t")) return;
        const partes = linea.split("\t").map(p => p.trim());
        if (partes.length < 10) return;

        const nombreBruto = partes[0];
        if (!nombreBruto || nombreBruto.toLowerCase().startsWith("partida") || nombreBruto.toLowerCase().startsWith("bloque")) return;

        const jugadorOficial = obtenerNickOficial(nombreBruto);
        const valVictoria = pancarNumeroSeguro(partes[1]);
        const pts = pancarNumeroSeguro(partes[2]);
        const valVictoriaCol = valVictoria > 0 ? 3 : 0;
        
        const vic = valVictoria > 0 ? 1 : 0;
        const der = valVictoria === 0 ? 1 : 0;
        const r = pancarNumeroSeguro(partes[3]);
        const c = pancarNumeroSeguro(partes[4]);
        const m = pancarNumeroSeguro(partes[5]);
        const o = pancarNumeroSeguro(partes[6]);
        const s = pancarNumeroSeguro(partes[7]);
        
        const rch = BONO_RACHA_ACTIVO ? pancarNumeroSeguro(partes[8]) : 0;
        const mg = BONO_MG_ACTIVO ? pancarNumeroSeguro(partes[9]) : 0;
        const rlp = partes.length > 10 ? pancarNumeroSeguro(partes[10]) : 0;
        
        const unidadesAsesinadas = partes.length > 11 ? pancarNumeroSeguro(partes[11]) : 0;
        const edificiosArrasados = partes.length > 12 ? pancarNumeroSeguro(partes[12]) : 0;
        const equipo = partes.length > 13 ? partes[13] : "";
        const civ = partes.length > 14 ? partes[14] : "";

        let sucesos = [];
        if (r === 1) sucesos.push("R");
        if (c === 1) sucesos.push("C");
        if (m === 1) sucesos.push("M");
        if (o === 1) sucesos.push("O");
        if (s === 1) sucesos.push("S");
        if (rch === 1) sucesos.push("Rch");
        if (mg === 1) sucesos.push("MG");
        if (rlp === 1) sucesos.push("RLP");

        const sucesoNota = sucesos.length > 0 ? sucesos.join(" + ") : "Sin participación";

        registrosProcesados.push({
            id: contadorId++,
            periodo: periodo,
            jornada: jornada,
            partida: partidaSelect,
            jugador: jugadorOficial,
            pts: pts,
            pg: vic,
            pp: der,
            e: r,
            r: c,
            m: m,
            o: o,
            s: s,
            rch: rch,
            mg: mg,
            rlp: rlp,
            unidadesAsesinadas: unidadesAsesinadas,
            edificiosArrasados: edificiosArrasados,
            equipo: equipo,
            civ: civ,
            sucesoNota: sucesoNota,
            fechaHora: fechaHoraActual
        });
    });

    if (registrosProcesados.length === 0) {
        alert("No se pudieron extraer datos válidos del texto plano.");
        return;
    }

    const claveBD = `registros_${periodo}_${jornada}_${partidaSelect}`;
    localStorage.setItem(claveBD, JSON.stringify(registrosProcesados));

    const gestionAnio = document.getElementById("gestion-anio");
    const gestionMes = document.getElementById("gestion-mes");
    const gestionJornada = document.getElementById("gestion-jornada");
    const gestionPartida = document.getElementById("gestion-partida");

    if (gestionAnio) gestionAnio.value = anio;
    if (gestionMes) gestionMes.value = mesFormatted;
    if (gestionJornada) gestionJornada.value = jornada;
    if (gestionPartida) gestionPartida.value = partidaSelect;

    alert(`¡Se registraron ${registrosProcesados.length} jugadores correctamente!`);
    
    if (typeof renderTablaGestionRegistros === 'function') {
        renderTablaGestionRegistros();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarSelectoresFechaDinamicos();
    if (typeof renderTablaGestionRegistros === 'function') {
        renderTablaGestionRegistros();
    }
});
