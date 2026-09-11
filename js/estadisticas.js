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
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
            position: relative;
            gap: 10px;
        }
        .header-top h1 {
            margin: 0;
            font-size: 1.4rem;
            line-height: 1.2;
            max-width: 65%;
            color: #222222;
        }
        .header-info-container {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
        }
        .header-top .fecha-actualizacion {
            font-size: 0.85rem;
            font-weight: bold;
            color: #555555;
            text-align: right;
        }

        /* --- BOTÓN ADMIN FLOTANTE SEGURO --- */
        .admin-toggle-btn {
            background: #b8860b;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 0.85rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        /* --- PESTAÑAS LLAMATIVAS Y ENMARCADAS (Escritorio) --- */
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

        /* --- PANEL LATERAL CORREGIDO PARA MÓVILES Y PC --- */
        #sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 260px;
            height: 100%;
            background: #fff;
            box-shadow: 2px 0 15px rgba(0,0,0,0.1);
            z-index: 999;
            padding: 20px;
            box-sizing: border-box;
            transition: transform 0.3s ease;
            transform: translateX(-100%);
        }
        #sidebar.open {
            transform: translateX(0);
        }
        #main-content {
            margin-left: 280px;
            padding: 20px;
        }

        @media (max-width: 768px) {
            /* Ocultar elementos superiores innecesarios en celular para ganar espacio */
            .header-top, .tabs {
                display: none !important;
            }
            #sidebar {
                transform: translateX(-100%);
            }
            #sidebar.open {
                transform: translateX(0);
            }
            #main-content {
                margin-left: 0 !important;
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

    <div id="sidebar">
        <h3>🔐 Panel de Control</h3>
        <label>Contraseña de Admin:</label>
        <input type="password" id="admin-pass" placeholder="Ingresa contraseña">
        <div id="status-mode" class="status-badge status-espectador">Modo Espectador</div>
    </div>

    <div id="main-content">
        <!-- Encabezado superior (Visible en PC) -->
        <div class="header-top">
            <h1>Ranking Maratón Michi DM</h1>
            <div class="header-info-container">
                <button class="admin-toggle-btn" onclick="toggleSidebar()">🔐 Admin</button>
                <div id="ultima-actualizacion" class="fecha-actualizacion">--/--/---- --:--:-- p. m.</div>
            </div>
        </div>

        <!-- Pestañas Principales (Visible en PC) -->
        <div class="tabs">
            <a href="index.html" class="tab-btn">📊 Clasificación general</a>
            <a href="estadisticas.html" class="tab-btn active">📈 Estadísticas y Tiempos</a>
            <a href="candidatos.html" class="tab-btn">⭐ Candidatos</a>
            <a href="historial.html" class="tab-btn">📜 Historial de Partidas</a>
            <a href="galeria.html" class="tab-btn admin-only">🖼️ Galería</a>
            <a href="correccion.html" class="tab-btn admin-only">📝 Corrección</a>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 20px; margin-bottom: 10px;">
            <h2 style="margin: 0; color: #222;">📈 Estadísticas Generales del Torneo</h2>
            <!-- Selectores limpios con los IDs que el JS lee exactamente -->
            <div style="display: flex; gap: 10px; align-items: center;">
                <label for="select-anio-filtro" style="font-weight: bold;">Año:</label>
                <select id="select-anio-filtro" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #ced4da; background:#fff; color:#333;">
                    <option value="2026" selected>2026</option>
                </select>
                <label for="select-mes-filtro" style="font-weight: bold; margin-left: 10px;">Mes:</label>
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

        <!-- Subpestañas Secundarias Originales -->
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
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }

        function cambiarSubtab(seccion) {
            document.querySelectorAll('.subtab-content').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));

            document.getElementById('sec-' + seccion).style.display = 'block';
            event.currentTarget.classList.add('active');
        }

        document.addEventListener("DOMContentLoaded", function() {
            const elFecha = document.getElementById('ultima-actualizacion');
            if (elFecha) {
                const ahora = new Date();
                const opcionesFecha = { day: 'numeric', month: 'numeric', year: 'numeric' };
                const opcionesHora = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
                const fechaStr = ahora.toLocaleDateString('es-ES', opcionesFecha);
                const horaStr = ahora.toLocaleTimeString('es-ES', opcionesHora).toLowerCase();
                elFecha.textContent = `${fechaStr}, ${horaStr}`;
            }
        });
    </script>
</body>
</html>
