const NOMBRES_MES = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
};

async function cargarDatos() {
  try {
    const resp = await fetch(`data/data.json?t=${Date.now()}`, { cache: "no-store" });
    if (!resp.ok) throw new Error("Error al cargar data.json");
    return await resp.json();
  } catch (e) {
    console.error(e);
    return { equivalencias: [], civEquivalencias: [], partidas: [], jugadoresInfo: [], jornadasImagenes: [], cuadroHonor: [] };
  }
}

function resolverNombreOficial(nombre, equivalencias = []) {
  if (!nombre) return "";
  const match = equivalencias.find(e => e.antiguo.toLowerCase() === nombre.trim().toLowerCase());
  return match ? match.oficial : nombre.trim();
}

function resolverCivOficial(civ, civEquivalencias = []) {
  if (!civ) return "";
  const match = civEquivalencias.find(e => e.antiguo.toLowerCase() === civ.trim().toLowerCase());
  return match ? match.oficial : civ.trim();
}

function numeroDeJornada(str) {
  if (!str) return 0;
  const m = str.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function claveOrden(p) {
  const anio = parseInt(p.anio, 10) || 0;
  const mes = parseInt(p.mes, 10) || 0;
  const jor = numeroDeJornada(p.jornada);
  const part = parseInt(p.numeroPartida, 10) || 0;
  return anio * 1000000 + mes * 10000 + jor * 100 + part;
}

function etiquetaPartida(p) {
  return `${p.jornada} · Partida ${p.numeroPartida}`;
}

function formatearDuracion(seg) {
  if (!seg) return "00:00:00";
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function claveJornada(anio, mes, jornada) {
  return `${anio}-${String(mes).padStart(2, "0")}-${(jornada || "").replace(/\s+/g, "").toLowerCase()}`;
}

function sugerirNombresImagenes(anio, mes, jornada) {
  const numJor = numeroDeJornada(jornada);
  const jorFormatted = numJor > 0 ? `fecha${String(numJor).padStart(2, "0")}` : (jornada || "").replace(/\s+/g, "").toLowerCase();
  const mesFormatted = String(mes).padStart(2, "0");
  return {
    evaluacion: `imagenes/candidatos_${anio}-${mesFormatted}_${jorFormatted}.png`,
    galardon: `imagenes/galardon_${anio}-${mesFormatted}_${jorFormatted}.png`
  };
}

function listaDeNombresOficiales(partidas, equivalencias) {
  const nombres = new Set();
  partidas.forEach(p => {
    (p.jugadores || []).forEach(j => {
      nombres.add(resolverNombreOficial(j.nombre, equivalencias));
    });
  });
  return [...nombres].sort();
}

function calcularEstadisticasJugadores(partidas, equivalencias) {
  const stats = {};
  const conteoPorJornada = {};
  const ordenadas = [...partidas].sort((a, b) => claveOrden(a) - claveOrden(b));

  ordenadas.forEach(p => {
    const claveJor = claveJornada(p.anio, p.mes, p.jornada);
    if (!conteoPorJornada[claveJor]) conteoPorJornada[claveJor] = {};

    (p.jugadores || []).forEach(j => {
      const nombre = resolverNombreOficial(j.nombre, equivalencias);
      if (!stats[nombre]) {
        stats[nombre] = {
          nombre, puntos: 0, partidas: 0, victorias: 0, derrotas: 0,
          segundosTotales: 0, unidadesAsesinadas: 0, edificiosArrasados: 0, civs: {}
        };
      }

      conteoPorJornada[claveJor][nombre] = (conteoPorJornada[claveJor][nombre] || 0) + 1;
      if (conteoPorJornada[claveJor][nombre] > 3) return;

      const st = stats[nombre];
      st.partidas++;
      let ptsPartida = 0;

      if (j.resultado === "victoria") {
        st.victorias++;
        ptsPartida += 3;
      } else {
        st.derrotas++;
      }

      (j.bonos || []).forEach(() => { ptsPartida += 1; });
      st.puntos += ptsPartida;
      st.segundosTotales += p.duracionSeg || 0;
      st.unidadesAsesinadas += j.unidadesAsesinadas || 0;
      st.edificiosArrasados += j.edificiosArrasados || 0;

      if (j.civ) {
        if (!st.civs[j.civ]) st.civs[j.civ] = { jugadas: 0, victorias: 0 };
        st.civs[j.civ].jugadas++;
        if (j.resultado === "victoria") st.civs[j.civ].victorias++;
      }
    });
  });

  return stats;
}

// Motor unificado y seguro para calcular variaciones y estados por partida (para Historial y Clasificación)
function calcularVarPorPartida(partidas, equivalencias) {
  const varsPorPartida = {};
  const mapJugadores = {};
  const ultimasVictorias = {};
  const conteoPorJornada = {};
  let mesActualId = null;

  const ordenadas = [...partidas].sort((a, b) => claveOrden(a) - claveOrden(b));

  ordenadas.forEach((p, idxPartidaGlobal) => {
    const claveMes = `${p.anio}-${String(p.mes).padStart(2, "0")}`;
    if (claveMes !== mesActualId) {
      mesActualId = claveMes;
      Object.keys(mapJugadores).forEach(k => delete mapJugadores[k]);
      Object.keys(ultimasVictorias).forEach(k => delete ultimasVictorias[k]);
    }

    const claveJor = claveJornada(p.anio, p.mes, p.jornada);
    if (!conteoPorJornada[claveJor]) conteoPorJornada[claveJor] = {};
    const numJor = numeroDeJornada(p.jornada);

    const listaPrevia = Object.values(mapJugadores).sort((a, b) => b.puntos - a.puntos || b.victorias - a.victorias);
    const posPreviaMap = {};
    listaPrevia.forEach((item, index) => {
      posPreviaMap[item.nombre] = index + 1;
    });

    varsPorPartida[p.id] = {};
    const jugadoresEnPartida = (p.jugadores || []).map(j => {
      const nombre = resolverNombreOficial(j.nombre, equivalencias);
      conteoPorJornada[claveJor][nombre] = (conteoPorJornada[claveJor][nombre] || 0) + 1;
      return { j, nombre, numPartidaEnJornada: conteoPorJornada[claveJor][nombre] };
    });

    const esPrimeraPartidaMes = idxPartidaGlobal === 0 || !ordenadas.slice(0, idxPartidaGlobal].some(prev => `${prev.anio}-${String(prev.mes).padStart(2, "0")}` === claveMes);

    let totalJugadoresPrevios = Object.keys(mapJugadores).length;

    jugadoresEnPartida.forEach(({ j, nombre, numPartidaEnJornada }) => {
      const esNuevoEnMes = !mapJugadores[nombre];
      if (esNuevoEnMes) {
        totalJugadoresPrevios++;
        mapJugadores[nombre] = { 
          nombre, 
          puntos: 0, 
          partidas: 0, 
          victorias: 0,
          posicionReferenciaAnterior: totalJugadoresPrevios
        };
      }
      const f = mapJugadores[nombre];
      
      let posPrevia;
      if (esNuevoEnMes) {
        posPrevia = f.posicionReferenciaAnterior;
      } else {
        posPrevia = posPreviaMap[nombre] || 1;
      }

      if (numPartidaEnJornada <= 3) {
        f.partidas++;
        let gano = j.resultado === "victoria";
        let pts = gano ? 3 : 0;
        (j.bonos || []).forEach(() => pts += 1);
        if (gano && ultimasVictorias[nombre]) pts += 1;
        if (gano && numJor >= 6 && posPrevia >= 6) pts += 1;
        if (gano && p.duracionSeg && p.duracionSeg < 3600) pts += 1;
        f.puntos += pts;
        if (gano) { f.victorias++; ultimasVictorias[nombre] = true; }
        else { ultimasVictorias[nombre] = false; }
      }

      const listaActual = Object.values(mapJugadores).sort((a, b) => b.puntos - a.puntos || b.victorias - a.victorias);
      const posActual = listaActual.findIndex(item => item.nombre === nombre) + 1;
      
      const varCalculada = esPrimeraPartidaMes ? 0 : (posPrevia - posActual);

      varsPorPartida[p.id][nombre] = varCalculada;
    });
  });

  return varsPorPartida;
}

function calcularTablaClasificacion(partidas, equivalencias, anio, mes, hastaJornada = null) {
  const filtradas = partidas.filter(p => p.anio == anio && String(p.mes).padStart(2, "0") === mes);
  if (filtradas.length === 0) return { filas: [], jornadaMostrada: "", ultimaPartida: null };

  const ordenadas = [...filtradas].sort((a, b) => claveOrden(a) - claveOrden(b));
  
  let limiteIdx = ordenadas.length;
  if (hastaJornada) {
    const numHasta = numeroDeJornada(hastaJornada);
    limiteIdx = ordenadas.findIndex(p => numeroDeJornada(p.jornada) > numHasta);
    if (limiteIdx === -1) limiteIdx = ordenadas.length;
  }

  const acumuladas = ordenadas.slice(0, limiteIdx);
  if (acumuladas.length === 0) return { filas: [], jornadaMostrada: "", ultimaPartida: null };

  const mapJugadores = {};
  const ultimasVictorias = {};
  const conteoPorJornada = {};

  acumuladas.forEach((p, idxAcumulada) => {
    const claveJor = claveJornada(p.anio, p.mes, p.jornada);
    if (!conteoPorJornada[claveJor]) conteoPorJornada[claveJor] = {};
    const numJor = numeroDeJornada(p.jornada);

    const listaPrevia = Object.values(mapJugadores).sort((a, b) => b.puntos - a.puntos || b.victorias - a.victorias);
    const posPreviaMap = {};
    listaPrevia.forEach((item, index) => { posPreviaMap[item.nombre] = index + 1; });

    Object.keys(mapJugadores).forEach(nombre => {
      mapJugadores[nombre].ultimoSuceso = "Sin participación";
    });

    const jugadoresEnPartida = (p.jugadores || []).map(j => {
      const nombre = resolverNombreOficial(j.nombre, equivalencias);
      conteoPorJornada[claveJor][nombre] = (conteoPorJornada[claveJor][nombre] || 0) + 1;
      return { j, nombre, numPartidaEnJornada: conteoPorJornada[claveJor][nombre] };
    });

    let totalJugadoresPrevios = Object.keys(mapJugadores).length;

    jugadoresEnPartida.forEach(({ j, nombre, numPartidaEnJornada }) => {
      const esNuevoEnMes = !mapJugadores[nombre];
      if (esNuevoEnMes) {
        totalJugadoresPrevios++;
        mapJugadores[nombre] = {
          nombre, puntos: 0, partidas: 0, victorias: 0,
          ultimoSuceso: "Sin participación", vd: "0",
          bonos: { E:0, R:0, M:0, O:0, S:0, Rch:0, MG:0, RLP:0 },
          tb: 0, variacion: 0,
          posicionReferenciaAnterior: totalJugadoresPrevios
        };
      }

      const f = mapJugadores[nombre];
      let posPrevia;
      if (esNuevoEnMes) {
        posPrevia = f.posicionReferenciaAnterior;
      } else {
        posPrevia = posPreviaMap[nombre] || 1;
      }

      if (numPartidaEnJornada > 3) {
        f.ultimoSuceso = "Partida inválida (+3 en la jornada)";
        return;
      }

      f.partidas++;
      let gano = j.resultado === "victoria";
      let puntosEstaPartida = 0;
      const listaSucesos = [gano ? "Victoria" : "Derrota"];

      if (gano) { f.victorias++; f.vd = "1"; puntosEstaPartida += 3; }
      else { f.vd = "0"; }

      (j.bonos || []).forEach(b => {
        if (f.bonos[b] !== undefined) {
          f.bonos[b]++; f.tb++; puntosEstaPartida += 1; listaSucesos.push(b);
        }
      });

      if (gano && ultimasVictorias[nombre]) {
        f.bonos.Rch++; f.tb++; puntosEstaPartida += 1; listaSucesos.push("Rch");
      }

      if (gano && numJor >= 6 && posPrevia >= 6) {
        let rivalesEnTop5 = jugadoresEnPartida.filter(o => 
          o.nombre !== nombre && o.j.equipo !== j.equipo && (posPreviaMap[o.nombre] || 11) <= 5
        );
        if (rivalesEnTop5.length > 0) {
          let etiquetaMg = posPrevia <= 10 ? "MG1" : posPrevia <= 15 ? "MG2" : "MG3";
          let ptsMg = posPrevia <= 10 ? 1 : posPrevia <= 15 ? 2 : 3;
          f.bonos.MG++; f.tb++; puntosEstaPartida += ptsMg; listaSucesos.push(etiquetaMg);
        }
      }

      if (gano && p.duracionSeg && p.duracionSeg < 3600) {
        let etiquetaRlp = posPrevia <= 10 ? "RLP1" : posPrevia <= 15 ? "RLP2" : "RLP3";
        let ptsRlp = posPrevia <= 10 ? 1 : posPrevia <= 15 ? 2 : 3;
        f.bonos.RLP++; f.tb++; puntosEstaPartida += ptsRlp; listaSucesos.push(etiquetaRlp);
      }

      f.puntos += puntosEstaPartida;
      ultimasVictorias[nombre] = gano;
      f.ultimoSuceso = `${listaSucesos.join(" + ")} (+${puntosEstaPartida} pts)`;
    });

    const listaActual = Object.values(mapJugadores).sort((a, b) => b.puntos - a.puntos || b.victorias - a.victorias);
    const esPrimeraPartidaMes = idxAcumulada === 0;

    listaActual.forEach((item, index) => {
      const posActual = index + 1;
      const posAnt = posPreviaMap[item.nombre] || item.posicionReferenciaAnterior || posActual;
      item.variacion = esPrimeraPartidaMes ? 0 : (posAnt - posActual);
    });
  });

  const filas = Object.values(mapJugadores).sort((a, b) => b.puntos - a.puntos || b.victorias - a.victorias);
  const ultimaPartida = acumuladas[acumuladas.length - 1];

  return { filas, jornadaMostrada: ultimaPartida ? ultimaPartida.jornada : "", ultimaPartida };
}

function compararJugadores(nombres, partidas, equivalencias) {
  const statsG = calcularEstadisticasJugadores(partidas, equivalencias);
  return nombres.map(n => statsG[n] || {
    nombre: n, puntos: 0, partidas: 0, victorias: 0, derrotas: 0,
    segundosTotales: 0, unidadesAsesinadas: 0, edificiosArrasados: 0, civs: {}
  });
}

function calcularSinergia(nombres, partidas, equivalencias) {
  let partidasJuntos = 0, victorias = 0, derrotas = 0;

  partidas.forEach(p => {
    const jugMap = {};
    (p.jugadores || []).forEach(j => {
      const nombreOf = resolverNombreOficial(j.nombre, equivalencias);
      if (nombres.includes(nombreOf)) {
        jugMap[nombreOf] = j;
      }
    });

    if (Object.keys(jugMap).length === nombres.length) {
      const primerEquipo = jugMap[nombres[0]].equipo;
      const todosMismoEquipo = nombres.every(n => jugMap[n].equipo === primerEquipo);

      if (todosMismoEquipo) {
        partidasJuntos++;
        if (jugMap[nombres[0]].resultado === "victoria") victorias++;
        else derrotas++;
      }
    }
  });

  const efectividad = partidasJuntos > 0 ? Math.round((victorias / partidasJuntos) * 100) : 0;
  return { partidasJuntos, victorias, derrotas, efectividad };
}

function calcularCompanerosYRivales(nombreJugador, partidas, equivalencias) {
  const aliados = {};
  const adversarios = {};
  const conteoPorJornada = {};
  const ordenadas = [...partidas].sort((a, b) => claveOrden(a) - claveOrden(b));

  ordenadas.forEach(p => {
    const claveJor = claveJornada(p.anio, p.mes, p.jornada);
    if (!conteoPorJornada[claveJor]) conteoPorJornada[claveJor] = {};

    const jugadoresValidos = [];
    (p.jugadores || []).forEach(j => {
      const nombreOf = resolverNombreOficial(j.nombre, equivalencias);
      conteoPorJornada[claveJor][nombreOf] = (conteoPorJornada[claveJor][nombreOf] || 0) + 1;
      if (conteoPorJornada[claveJor][nombreOf] <= 3) {
        jugadoresValidos.push({ ...j, nombreOf });
      }
    });

    const objetivo = jugadoresValidos.find(j => j.nombreOf === nombreJugador);
    if (!objetivo) return;

    const ganoElObjetivo = objetivo.resultado === "victoria";

    jugadoresValidos.forEach(j => {
      if (j.nombreOf === nombreJugador) return;
      const esAliado = j.equipo && objetivo.equipo && j.equipo === objetivo.equipo;

      if (esAliado) {
        if (!aliados[j.nombreOf]) aliados[j.nombreOf] = { partidas: 0, victorias: 0 };
        aliados[j.nombreOf].partidas++;
        if (ganoElObjetivo) aliados[j.nombreOf].victorias++;
      } else {
        if (!adversarios[j.nombreOf]) adversarios[j.nombreOf] = { partidas: 0, victorias: 0 };
        adversarios[j.nombreOf].partidas++;
        if (ganoElObjetivo) adversarios[j.nombreOf].victorias++;
      }
    });
  });

  const listaAliados = Object.entries(aliados).map(([nombre, st]) => ({
    nombre,
    partidas: st.partidas,
    wr: st.partidas > 0 ? Math.round((st.victorias / st.partidas) * 100) : 0
  })).sort((a, b) => b.partidas - a.partidas || b.wr - a.wr);

  const listaAdversarios = Object.entries(adversarios).map(([nombre, st]) => ({
    nombre,
    partidas: st.partidas,
    wr: st.partidas > 0 ? Math.round((st.victorias / st.partidas) * 100) : 0
  })).sort((a, b) => b.partidas - a.partidas || b.wr - a.wr);

  return { aliados: listaAliados, adversarios: listaAdversarios };
}

function descargarElementoComoImagen(elemento, nombreArchivo = "captura.png", colorFondo = "#14161c") {
  if (typeof html2canvas === "undefined") {
    alert("La librería de descarga de imagen no se pudo cargar.");
    return;
  }
  html2canvas(elemento, { backgroundColor: colorFondo, scale: 2 }).then(canvas => {
    const enlace = document.createElement("a");
    enlace.download = nombreArchivo;
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
  });
}

function claveHonor(anio, mes, jornada) {
  return `${anio}-${String(mes).padStart(2, "0")}-${(jornada || "").replace(/\s+/g, "").toLowerCase()}`;
}
