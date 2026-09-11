<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estadísticas y Tiempos - Ranking Maratón Michi DM</title>
    <link rel="stylesheet" href="css/estilos.css">
    <style>
        body {
            box-sizing: border-box;
            background-color: #ffffff;
            color: #333333;
            margin: 0;
            padding-bottom: 70px; /* Espacio para la barra inferior móvil */
            font-family: Arial, sans-serif;
        }

        /* --- CABECERA OCULTA EN MÓVIL PARA GANAR ESPACIO --- */
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
        }
        .header-top h1 {
            margin: 0;
            font-size: 1.4rem;
            color: #222222;
        }
        @media (max-width: 768px) {
            .header-top {
                display: none !important; /* Elimina por completo el título grande, hora y admin superior en celulares */
            }
        }

        /* --- PESTAÑAS SUPERIORES (SOLO PC) --- */
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
        @media (max-width: 768px) {
            .tabs {
                display: none;
            }
        }

        .tab-btn {
            background: #ffffff;
            color: #333333;
            padding: 8px 12px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            font-size: 0.9rem;
            border: 1px solid #ccc;
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

        /* --- BARRA DE NAVEGACIÓN INFERIOR MÓVIL --- */
        .mobile-bottom-nav {
            display: none;
        }
        @media (max-width: 768px) {
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
            .mobile-nav-item:hover, .mobile-nav-item.active {
                color: #b8860b;
            }
        }

        /* Filtros y contenido */
        .bar-jornada-filtro {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0 15px 0;
            flex-wrap: wrap;
            gap: 15px;
        }
        .filtro-historico {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: bold;
            font-size: 0.9rem;
            color: #555555;
        }
        .filtro-historico select {
            padding: 6px 10px;
            font-size: 0.9rem;
            border-radius: 6px;
            border: 1px solid #ccc;
            background-color: #fff;
            color: #333;
        }

        #sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 260px;
            height: 100vh;
            background: #ffffff;
            color: #333333;
            box-shadow: 2px 0 10px rgba(0,0,0,0.15);
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
            margin-left: 0;
            padding: 15px;
        }
    </style>
</head>
<body>

    <!-- Panel Lateral Oculto para Admin -->
    <div id="sidebar">
        <h3>🔐 Panel de Control</h3>
        <label class="form-label mt-2">Contraseña de Admin:</label>
        <input type="password" id="admin-pass" class="form-control form-control-sm border-secondary" placeholder="Ingresa contraseña">
        <div id="status-mode" class="badge bg-secondary mt-3 mb-3">Modo Espectador</div>
        <button class="btn btn-sm btn-secondary w-100 mt-3" onclick="toggleSidebar()">Cerrar</button>
    </div>

    <div id="main-content">
        <!-- Cabecera para PC -->
        <div class="header-top">
            <h1>Estadísticas y Tiempos - Maratón Michi DM</h1>
            <div class="header-info-container">
                <button class="admin-toggle-btn" onclick="toggleSidebar()" style="background:#b8860b; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">🔐 Admin</button>
            </div>
        </div>

        <!-- Pestañas Superiores PC -->
        <div class="tabs">
            <a href="index.html" class="tab-btn">📊 Clasificación general</a>
            <a href="estadisticas.html" class="tab-btn active">📈 Estadísticas y Tiempos</a>
            <a href="candidatos.html" class="tab-btn">⭐ Candidatos</a>
            <a href="historial.html" class="tab-btn">📜 Historial de Partidas</a>
        </div>
        
        <!-- Barra de Filtros de Periodo -->
        <div class="bar-jornada-filtro">
            <div style="font-weight: bold; color: #b8860b; font-size: 1.05rem;">
                📈 Analítica General
            </div>
            
            <div class="filtro-historico">
                <label for="select-anio-filtro">Año:</label>
                <select id="select-anio-filtro">
                    <option value="2026" selected>2026</option>
                </select>

                <label for="select-mes-filtro" style="margin-left: 5px;">Mes:</label>
                <select id="select-mes-filtro">
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

        <!-- Contenedores clave donde tu script `estadisticas.js` carga los datos reales -->
        <div id="sec-tiempos" style="margin-bottom: 25px;"></div>
        <div id="sec-civilizaciones" style="margin-bottom: 25px;"></div>
        <div id="sec-enfrentamientos" style="margin-bottom: 25px;"></div>
    </div>

    <!-- BARRA DE NAVEGACIÓN INFERIOR MÓVIL -->
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
            if (sidebar) sidebar.classList.toggle('open');
        }
    </script>
</body>
</html>
