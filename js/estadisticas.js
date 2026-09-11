<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ranking Maratón Michi DM - Estadísticas y Tiempos</title>
    <link rel="stylesheet" href="css/estilos.css">
    <style>
        body {
            box-sizing: border-box;
            background-color: #ffffff;
            color: #333333;
            margin: 0;
            padding-bottom: 70px; /* Espacio para la barra inferior en móviles */
            font-family: Arial, sans-serif;
        }

        /* --- PESTAÑAS SUPERIORES (Escritorio) --- */
        .tabs {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            background: #f4f1ea;
            padding: 10px;
            border-radius: 8px;
            border: 2px solid #d4af37;
            margin-bottom: 20px;
        }
        .tab-btn {
            background: #fff;
            color: #333;
            padding: 8px 12px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            font-size: 0.9rem;
            border: 1px solid #ccc;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
        }
        .tab-btn:hover {
            background: #fdf8ed;
            color: #b8860b;
            border-color: #b8860b;
        }
        .tab-btn.active {
            background: #b8860b;
            color: white;
            border-color: #996e05;
        }

        /* --- SUBPESTAÑAS --- */
        .subtabs {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        .subtab-btn {
            background: #f8f9fa;
            color: #333;
            padding: 8px 14px;
            border-radius: 6px;
            border: 1px solid #ccc;
            font-weight: bold;
            cursor: pointer;
        }
        .subtab-btn.active {
            background: #0d6efd;
            color: white;
            border-color: #0b5ed7;
        }

        /* --- BARRA DE NAVEGACIÓN INFERIOR MÓVIL --- */
        .mobile-bottom-nav {
            display: none;
        }

        #main-content {
            margin-left: 0;
            padding: 15px;
        }

        @media (max-width: 768px) {
            /* Ocultar pestañas superiores en celulares */
            .tabs {
                display: none !important;
            }
            #main-content {
                padding: 10px !important;
            }
            /* Mostrar la barra inferior en celulares */
            .mobile-bottom-nav {
                display: flex;
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background: #ffffff;
                border-top: 2px solid #d4af37;
                justify-content: space-around;
                align-items: center;
                padding: 8px 0;
                z-index: 1500;
                box-shadow: 0 -4px 10px rgba(0,0,0,0.15);
            }
            .mobile-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                color: #666666;
                text-decoration: none;
                font-size: 0.7rem;
                font-weight: bold;
            }
            .mobile-nav-item span.icon {
                font-size: 1.2rem;
                margin-bottom: 2px;
            }
            .mobile-nav-item.active {
                color: #b8860b;
            }
        }
    </style>
</head>
<body>

    <div id="main-content">
        <!-- Pestañas Principales (Solo PC) -->
        <div class="tabs">
            <a href="index.html" class="tab-btn">📊 Clasificación general</a>
            <a href="estadisticas.html" class="tab-btn active">📈 Estadísticas y Tiempos</a>
            <a href="candidatos.html" class="tab-btn">⭐ Candidatos</a>
            <a href="historial.html" class="tab-btn">📜 Historial de Partidas</a>
            <a href="galeria.html" class="tab-btn admin-only">🖼️ Galería</a>
            <a href="correccion.html" class="tab-btn admin-only">📝 Corrección</a>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 5px; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #222; font-size: 1.3rem;">📈 Estadísticas Generales del Torneo</h2>
            <!-- Selectores de Año y Mes -->
            <div style="display: flex; gap: 10px; align-items: center;">
                <label for="select-anio-filtro" style="font-weight: bold; font-size: 0.9rem;">Año:</label>
                <select id="select-anio-filtro" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #ced4da; background:#fff; color:#333;">
                    <option value="2026" selected>2026</option>
                </select>
                <label for="select-mes-filtro" style="font-weight: bold; margin-left: 5px; font-size: 0.9rem;">Mes:</label>
                <select id="select-mes-filtro" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #ced4da; background:#fff; color:#333;">
                    <option value="01">Enero</option>
                    <option value="02">Febrero</option>
                    <option value="03">Marzo</option>
                    <option value="04">Abril</option>
                    <option value="05">Mayo</option>
                    <option value="06">Junio</option>
                    <option value="07">Julio</option>
                    <option value="08">Agosto</option>
                    <option value="09" selected>Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                </select>
            </div>
        </div>

        <!-- Subpestañas Secundarias -->
        <div class="subtabs">
            <button class="subtab-btn active" onclick="cambiarSubtab('tiempos')">⏱️ Tiempos de partida</button>
            <button class="subtab-btn" onclick="cambiarSubtab('civilizaciones')">🏛️ Civilizaciones y Win Rate</button>
            <button class="subtab-btn" onclick="cambiarSubtab('enfrentamientos')">🤝 Sinergia y Enfrentamientos</button>
        </div>

        <!-- Vista 1: Tiempos de partida -->
        <div id="sec-tiempos" class="card subtab-content">
            <h3>⏱️ Tiempos de Partida</h3>
            <div class="info-box">Aquí se mostrarán los registros de duración de partidas y promedios por jugador.</div>
        </div>

        <!-- Vista 2: Civilizaciones y Win Rate -->
        <div id="sec-civilizaciones" class="card subtab-content" style="display: none;">
            <h3>🏛️ Civilizaciones y Win Rate</h3>
            <div class="info-box">Aquí se desplegará el porcentaje de victorias por civilización y elecciones más frecuentes.</div>
        </div>

        <!-- Vista 3: Sinergia y Enfrentamientos -->
        <div id="sec-enfrentamientos" class="card subtab-content" style="display: none;">
            <h3>🤝 Sinergia y Enfrentamientos Directos</h3>
            <div class="info-box">Aquí podrás revisar el historial cara a cara (Head to Head) entre jugadores.</div>
        </div>

    </div>

    <!-- BARRA DE NAVEGACIÓN INFERIOR PARA MÓVILES -->
    <nav class="mobile-bottom-nav">
        <a href="index.html" class="mobile-nav-item">
            <span class="icon">📊</span>
            <span>Clasificación</span>
        </a>
        <a href="estadisticas.html" class="mobile-nav-item active">
            <span class="icon">📈</span>
            <span>Estadísticas</span>
        </a>
        <a href="candidatos.html" class="mobile-nav-item">
            <span class="icon">⭐</span>
            <span>Candidatos</span>
        </a>
        <a href="historial.html" class="mobile-nav-item">
            <span class="icon">📜</span>
            <span>Historial</span>
        </a>
    </nav>

    <script src="js/auth.js"></script>
    <script src="js/estadisticas.js"></script>
    <script>
        function cambiarSubtab(seccion) {
            document.querySelectorAll('.subtab-content').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));

            document.getElementById('sec-' + seccion).style.display = 'block';
            event.currentTarget.classList.add('active');
        }
    </script>
</body>
</html>
