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
            padding-bottom: 70px;
            font-family: Arial, sans-serif;
        }

        /* --- CABECERA SUPERIOR (Visible solo en PC) --- */
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding: 15px 20px 10px 20px;
            border-bottom: 1px solid #ddd;
        }
        .header-top h1 {
            margin: 0;
            font-size: 1.4rem;
            color: #222222;
        }
        .header-info-container {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
        }
        .admin-toggle-btn {
            background: #b8860b;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 0.85rem;
        }
        .fecha-actualizacion {
            font-size: 0.85rem;
            font-weight: bold;
            color: #555555;
        }

        /* --- PESTAÑAS SUPERIORES (Visible solo en PC) --- */
        .tabs {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            background: #f4f1ea;
            padding: 10px 20px;
            border-radius: 8px;
            border: 2px solid #d4af37;
            margin: 0 20px 20px 20px;
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

        /* --- EN MÓVILES: OCULTAR CABECERA Y PESTAÑAS SUPERIORES --- */
        @media (max-width: 768px) {
            .header-top, .tabs {
                display: none !important;
            }
        }

        /* --- BARRA DE NAVEGACIÓN INFERIOR (Visible solo en Móviles) --- */
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
            .mobile-nav-item.active {
                color: #b8860b;
            }
        }

        /* Estilos para subpestañas y filtros originales */
        .subtabs {
            display: flex;
            gap: 10px;
            margin: 15px 20px;
            flex-wrap: wrap;
        }
        .subtab-btn {
            background: #e9ecef;
            border: 1px solid #ced4da;
            padding: 8px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 0.9rem;
            color: #495057;
            transition: all 0.2s;
        }
        .subtab-btn.active {
            background: #b8860b;
            color: white;
            border-color: #996e05;
        }
        .card {
            background: #ffffff;
            border: 1px solid #dddddd;
            border-radius: 10px;
            padding: 20px;
            margin: 15px 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
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
    </style>
</head>
<body>

    <!-- Panel Lateral de Admin -->
    <div id="sidebar">
        <h3>🔐 Panel de Control</h3>
        <label class="form-label mt-2">Contraseña de Admin:</label>
        <input type="password" id="admin-pass" class="form-control form-control-sm border-secondary" placeholder="Ingresa contraseña">
        <div id="status-mode" class="badge bg-secondary mt-3 mb-3">Modo Espectador</div>
        <button class="btn btn-sm btn-secondary w-100 mt-3" onclick="toggleSidebar()">Cerrar</button>
    </div>

    <div id="main-content">
        <!-- Cabecera Superior (Visible en PC, oculta en móviles) -->
        <div class="header-top">
            <h1>Ranking Maratón Michi DM</h1>
            <div class="header-info-container">
                <button class="admin-toggle-btn" onclick="toggleSidebar()">🔐 Admin</button>
                <div id="fecha-actualizacion" class="fecha-actualizacion">--/--/---- --:--:--</div>
            </div>
        </div>

        <!-- Pestañas Superiores (Visible en PC, oculta en móviles) -->
        <div class="tabs">
            <a href="index.html" class="tab-btn">📊 Clasificación general</a>
            <a href="estadisticas.html" class="tab-btn active">📈 Estadísticas y Tiempos</a>
            <a href="candidatos.html" class="tab-btn">⭐ Candidatos</a>
            <a href="historial.html" class="tab-btn">📜 Historial de Partidas</a>
            <a href="galeria.html" class="tab-btn admin-only">🖼️ Galería</a>
            <a href="correccion.html" class="tab-btn admin-only">📝 Corrección</a>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin: 15px 20px 10px 20px;">
            <h2 style="margin: 0; color: #222;">📈 Estadísticas Generales del Torneo</h2>
            
            <!-- Selectores de Año y Mes con los IDs originales que el script lee -->
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

        <!-- Vistas que `estadisticas.js` llena con los datos reales -->
        <div id="sec-tiempos" class="card subtab-content"></div>
        <div id="sec-civilizaciones" class="card subtab-content" style="display: none;"></div>
        <div id="sec-enfrentamientos" class="card subtab-content" style="display: none;"></div>
    </div>

    <!-- BARRA DE NAVEGACIÓN INFERIOR (Solo móviles) -->
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

        function cambiarSubtab(seccion) {
            document.querySelectorAll('.subtab-content').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));

            const target = document.getElementById('sec-' + seccion);
            if (target) target.style.display = 'block';
            if (event && event.currentTarget) {
                event.currentTarget.classList.add('active');
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            const ahora = new Date();
            const fechaFormateada = ahora.toLocaleDateString('es-ES');
            const horaFormateada = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const elementoFecha = document.getElementById('fecha-actualizacion');
            if (elementoFecha) {
                elementoFecha.textContent = `${fechaFormateada}, ${horaFormateada}`;
            }
        });
    </script>
</body>
</html>
