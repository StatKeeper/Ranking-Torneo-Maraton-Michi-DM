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
    return { equivalencias: [], civEquivalencias: [], partidas: [], jugadoresInfo: {}, jornadasImagenes: [], cuadroHonor: [] };
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

  partidas.forEach(p => {
    (p.jugadores || []).forEach(j => {
      const nombre = resolverNombreOficial(j.nombre, equivalencias);
      if (!stats[nombre]) {
        stats[nombre] = {
          nombre, puntos: 0, partidas: 0, victorias: 0, derrotas: 0,
          segundosTotales: 0, unidadesAsesinadas: 0, edificiosArrasados: 0,
          civs: {}
        };
      }

      const st = stats[nombre];
      st.partidas++;
      if (j.resultado === "victoria") {
        st.victorias++;
        st.puntos += 3;
      } else {
        st.derrotas++;
      }

      (j.bonos || []).forEach(() => { st.puntos += 1; });

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

  const ultimasVictorias = {};
  const mapFilas = {};

  acumuladas.forEach((p) => {
    const participantesEstaPartida = new Set();

    (p.jugadores || []).forEach(j => {
      const nombre = resolverNombreOficial(j.nombre, equivalencias);
      participantesEstaPartida.add(nombre);

      if (!mapFilas[nombre]) {
        mapFilas[nombre] = {
          nombre, puntos: 0, partidas: 0, victorias: 0,
          ultimoSuceso: "Sin participación", vd: "0",
          bonos: { E:0, R:0, M:0, O:0, S:0, Rch:0, MG:0, RLP:0 },
          tb: 0, variacion: 0
        };
      }

      const f = mapFilas[nombre];
      f.partidas++;
      let gano = j.resultado === "victoria";

      if (gano) {
        f.puntos += 3;
        f.victorias++;
        f.vd = "1";
      } else {
        f.vd = "0";
      }

      const listaSucesos = [gano ? "Victoria" : "Derrota"];

      (j.bonos || []).forEach(b => {
        if (f.bonos[b] !== undefined) {
          f.bonos[b]++;
          f.tb++;
          f.puntos++;
          listaSucesos.push(b);
        }
      });

      if (gano && ultimasVictorias[nombre]) {
        f.bonos.Rch++;
        f.tb++;
        f.puntos++;
        listaSucesos.push("Rch");
      }

      if (gano && p.duracionSeg && p.duracionSeg < 3600) {
        f.bonos.RLP++;
        f.tb++;
        f.puntos++;
        listaSucesos.push("RLP");
      }

      ultimasVictorias[nombre] = gano;
      f.ultimoSuceso = listaSucesos.join(" + ");
    });
  });

  const filas = Object.values(mapFilas).sort((a, b) => b.puntos - a.puntos || b.victorias - a.victorias);
  const ultimaPartida = acumuladas[acumuladas.length - 1];

  return { filas, jornadaMostrada: ultimaPartida ? ultimaPartida.jornada : "", ultimaPartida };
}

function calcularVarPorPartida(partidas, equivalencias) {
  const vars = {};
  return vars;
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
