# World Cup 2026 - Frontend

Aplicacion web para la polla mundialista FIFA World Cup 2026. Permite a los usuarios registrar predicciones de partidos y podio, ver el ranking en tiempo real y consultar el reglamento.

## Stack Tecnologico

- **Framework**: React 19
- **Bundler**: Vite 8
- **Estilos**: Tailwind CSS 4 + CSS Custom Properties
- **Estado servidor**: TanStack React Query 5
- **Routing**: React Router 7
- **HTTP**: Axios
- **WebSocket**: Socket.io Client
- **Validacion**: Zod 4
- **Notificaciones**: Sonner
- **Banderas**: flag-icons
- **Iconos**: react-icons (Feather Icons)
- **Testing**: Vitest + Testing Library
- **Lenguaje**: TypeScript 5

## Estructura del Proyecto

```
src/
├── api/               # Clientes HTTP (Axios)
│   ├── client.ts      # Configuracion base (interceptores JWT, manejo 401)
│   ├── auth.ts        # Login
│   ├── users.ts       # Ranking, predicciones, avatar, perfil
│   ├── matches.ts     # Partidos y resultados
│   ├── teams.ts       # Equipos y grupos
│   └── config.ts      # Configuracion (deadline podio)
├── components/
│   ├── admin/         # Panel de administracion (registrar resultados)
│   ├── auth/          # Login, registro, recuperar contrasena
│   ├── common/        # Componentes compartidos
│   ├── layout/        # Header, ProfileModal, Layout
│   ├── matches/       # MatchCard, MatchRow, GroupMatches, BracketView, MatchDetailModal
│   ├── podium/        # PodiumSelector (prediccion de campeon, sub, 3ro)
│   ├── ranking/       # RankingTable (tabla de posiciones)
│   ├── rules/         # Reglamento del torneo
│   └── simulator/     # Simulador de puntos
├── context/
│   └── AuthContext.tsx # Estado de autenticacion (JWT, usuario, WebSocket global)
├── hooks/
│   └── useSocket.ts   # Hook para escuchar eventos WebSocket
├── pages/             # Paginas de ruta
│   ├── MatchesPage.tsx
│   ├── RankingPage.tsx
│   ├── PodiumPage.tsx
│   ├── TeamsPage.tsx
│   ├── SimulatorPage.tsx
│   ├── RulesPage.tsx
│   └── AdminPage.tsx
├── types/
│   └── index.ts       # Interfaces TypeScript (User, Match, Team, etc.)
├── utils/
│   ├── scoring.ts     # Calculo de puntos (mirror del backend)
│   ├── scoring.test.ts
│   └── flags.ts       # Mapeo teamId -> codigo de bandera
├── App.tsx            # Definicion de rutas
├── main.tsx           # Entry point
└── index.css          # Tema global (50+ CSS custom properties, paleta FIFA)
```

## Paginas y Funcionalidades

### Partidos (`/`)
- Vista de partidos por fase (grupos, 32avos, 16avos, cuartos, semis, final)
- Tarjetas interactivas para ingresar predicciones
- Bloqueo automatico al inicio del partido (validacion por fecha)
- Estados visuales: Pronostico (azul), En vivo (ambar), Finalizado (verde)
- Modal de detalle con predicciones de todos los participantes

### Ranking (`/ranking`)
- Tabla de posiciones en tiempo real
- Puntaje de partidos + puntaje de podio = total
- Avatares de usuario

### Podio (`/podium`)
- Selector de campeon, subcampeon y tercer lugar
- Visualizacion tipo podio con pedestales animados
- Fecha limite configurable desde base de datos
- Validacion de resultados reales al finalizar el torneo

### Equipos (`/teams`)
- Vista de los 48 equipos organizados por grupo
- Ranking FIFA de cada seleccion

### Simulador (`/simulator`)
- Calculadora interactiva de puntos
- Ingresa resultado real y prediccion para ver el desglose

### Reglamento (`/rules`)
- Explicacion del sistema de puntuacion
- Tabla de ejemplos de calculo
- Puntos de podio y distribucion de premios

### Panel Admin (`/admin`)
- Solo para usuarios con rol `admin`
- Registrar resultados de partidos
- Recalculo automatico de puntos

## Tiempo Real (WebSocket)

La aplicacion escucha eventos en tiempo real:
- **Predicciones**: Se actualizan al guardar (otros participantes ven cambios)
- **Resultados**: Ranking y puntos se recalculan instantaneamente
- **Perfil**: Avatares se actualizan en toda la app
- **Seguridad**: Force logout al cambiar contrasena

## Requisitos

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0
- **Backend** corriendo (API REST + WebSocket)

## Ejecucion con Docker (recomendado)

```bash
# 1. Copiar variables de entorno
cp .env.template .env

# 2. Editar .env con la URL del backend
nano .env

# 3. Levantar el frontend
docker compose up -d

# 4. Ver logs
docker compose logs -f frontend
```

Esto levanta **1 contenedor**:
| Servicio | Puerto | Descripcion |
|----------|--------|-------------|
| `frontend` | 5173 | Vite dev server con hot reload |

Para detener:
```bash
docker compose down
```

> **Nota:** El frontend necesita que el backend este corriendo. Si ambos estan en la misma maquina,
> asegurate de que `.env` apunte a la IP/puerto correcto del backend.

## Ejecucion local (sin Docker)

```bash
# 1. Copiar y configurar variables de entorno
cp .env.template .env

# 2. Instalar dependencias
npm install

# 3. Desarrollo
npm run dev

# 4. Build de produccion
npm run build

# 5. Preview del build
npm run preview
```

## Configuracion

### Variables de Entorno

```env
# URL base del backend REST API (sin trailing slash)
VITE_API_URL=http://localhost:3000

# URL del servidor WebSocket (mismo que backend)
VITE_WS_URL=ws://localhost:3000
```

Si no se configuran, el frontend usa automaticamente el hostname del navegador con puerto 3000 (funciona en localhost y LAN sin cambiar nada).

## Tests

```bash
npm test              # Ejecutar tests
npm run test:watch    # Tests en modo watch
```

## Tema Visual

La aplicacion usa una paleta oficial FIFA con soporte dark-only, definida mediante CSS Custom Properties en `index.css`:
- Colores primarios: FIFA Navy, FIFA Blue, FIFA Teal
- Colores de estado: Success (verde), Error (rojo), Warning (ambar)
- Colores de podio: Gold, Silver, Bronze
- Sombras, bordes y radios consistentes
