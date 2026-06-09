# Informe de Integración Frontend ↔ Backend — Flip 7

**Fecha:** 2026-06-09
**Backend:** `C:\Users\Miguel\Documents\Flip-7-Backend\flip-7-backend\backend` (Java 25, Spring Boot 3.5.3, puerto 8080)
**Frontend:** `C:\Users\Miguel\Documents\Flip-7-Frontend\frontend` (React 19, Vite 8, puerto 5173)

---

## 1. Endpoints del backend encontrados y conectados

Todos los endpoints están definidos en `GameController` con prefijo `/games`. Ninguno fue modificado.

| # | Método | Path | Función del frontend | Línea en `realApi.js` |
|---|--------|------|----------------------|------------------------|
| 1 | POST | `/games` | `createGame({ playerNames })` | `realApi.js:88-90` |
| 2 | GET | `/games/{gameId}` | `getGameState({ gameId })` | `realApi.js:96-98` |
| 3 | GET | `/games/finished` | `getFinishedGames()` | `realApi.js:138-140` |
| 4 | GET | `/games/finished/{gameId}` | `getFinishedGame({ gameId })` | `realApi.js:147-149` |
| 5 | POST | `/games/{gameId}/rounds/start` | `startRound({ gameId })` | `realApi.js:104-106` |
| 6 | POST | `/games/{gameId}/draw` | `drawCard({ gameId, playerId })` | `realApi.js:112-117` |
| 7 | POST | `/games/{gameId}/stay` | `stay({ gameId, playerId })` | `realApi.js:123-127` |
| 8 | POST | `/games/{gameId}/actions` | `applyAction({ gameId, targetPlayerId })` | `realApi.js:133-135` |

DTOs de request/response consumidos (no se modificaron, se respeta el contrato del backend):

- **Request:** `CreateGameRequest`, `DrawCardRequest`, `StayRequest`, `ApplyActionRequest`
- **Response:** `GameResponse`, `CreateGameResponse`, `FinishedGameResponse`, `PlayerResponse`, `CardResponse`, `RoundResultResponse`, `RoundPlayerScoreResponse`, `PendingActionResponse`, `AutomaticEventResponse`, `WinnerResponse`, `ApiErrorResponse`

Constantes de los enums del backend reflejadas en `src/config/api.js` como objetos congelados: `STATUS`, `CARD_TYPE`, `CARD_KIND`, `PLAYER_STATUS`, `MODIFIER_TYPE`, `MODIFIER_LABELS`, `ACTION_LABELS`, `STATUS_LABELS`, `PLAYER_STATUS_LABELS`.

---

## 2. Componentes / páginas conectadas al backend

| Capa | Archivo | Conexión |
|------|---------|----------|
| Servicio | `src/services/realApi.js` | Cliente `fetch` con timeout, abort, headers JSON, mapeo de errores |
| Servicio | `src/services/errors.js` | Mapea `ApiErrorResponse` a `Error` con `status`, `errorCode`, `message` en español |
| Servicio | `src/services/api.js` | Fachada que re-exporta `realApi.js` + alias `getHistory` |
| Estado | `src/store/gameContext.jsx` | `createGame` crea y obtiene estado, `startRound`/`drawCard`/`stay`/`applyAction` actualizan el estado, `handleAutomaticEvent` y `handlePendingAction` disparan toasts |
| Página | `src/pages/HomePage.jsx` | Lobby en español; botones `Jugar` / `Continuar` / `Ver historial` |
| Página | `src/pages/GamePage.jsx` | Setup + board; auto-start; auto-avance 5 s tras `ROUND_END` |
| Página | `src/pages/HistoryPage.jsx` | Lee `GameResponse.roundHistory` vía `getGameState` |
| Componente | `src/components/GameSetup/GameSetup.jsx` | Nombres en español, valida ≥ 2 jugadores |
| Componente | `src/components/Board/Board.jsx` | Status, ronda, resumen, banner del ganador |
| Componente | `src/components/PlayerZone/PlayerZone.jsx` | Mano del jugador (`player.cards`), puntajes, estado, animación de 2ª Oportunidad |
| Componente | `src/components/ActionPanel/ActionPanel.jsx` | Botones `Robar carta` / `Plantarse`; UI de `pendingAction` con selección de objetivo |
| Componente | `src/components/Card/Card.jsx` | Renderiza cartas con etiquetas en español |
| Componente | `src/components/ScoreBoard/ScoreBoard.jsx` | Marcador ordenado por puntaje total |
| Componente | `src/components/WinnerModal/WinnerModal.jsx` | Modal con podio y botones |
| Componente | `src/components/Toast/ToastContainer.jsx` | Toasts con auto-dismiss (3.5 s) |
| Shell | `src/App.jsx` | Rutas, theme toggle (texto en español) |

---

## 3. Archivos modificados / creados / eliminados

### Creados

```
frontend/src/config/api.js                     Configuración + constantes espejo de enums
frontend/src/services/errors.js                Mapeo de errores HTTP → español
frontend/src/services/realApi.js               Cliente HTTP real (fetch)
frontend/src/services/api.js                   Fachada sin switch de mocks
frontend/tests/e2e/game-setup.spec.js          Test E2E del lobby y creación
frontend/tests/e2e/normal-round.spec.js        Test E2E de robar / plantar
frontend/tests/integration/api.spec.mjs        Test de API con fetch directo (node:test)
frontend/INFORME-INTEGRACION.md                Este informe
```

### Modificados

```
frontend/vite.config.js                        Proxy /api → :8080, puerto explícito
frontend/.env.development                      VITE_API_BASE=/api (eliminado VITE_USE_MOCK)
frontend/.env.production                       Idem
frontend/index.html                            lang="es", title en español
frontend/playwright.config.js                  baseURL, webServer, testDir
frontend/package.json                          Scripts test:e2e y test:api
frontend/src/App.jsx                           aria-labels en español
frontend/src/store/gameContext.jsx             createGame con doble fetch, eventos en español
frontend/src/pages/HomePage.jsx                Lobby en español
frontend/src/pages/GamePage.jsx                useRef para el timer, eliminado import mock
frontend/src/pages/HistoryPage.jsx             getGameState en vez de getHistory
frontend/src/components/Card/Card.jsx          NUMBER_NAMES y labels en español
frontend/src/components/PlayerZone/PlayerZone.jsx  player.cards, secondChance derivado
frontend/src/components/ActionPanel/ActionPanel.jsx  Strings en español
frontend/src/components/Board/Board.jsx        roundNumber, STATUS_LABELS, sin deckRemaining
frontend/src/components/ScoreBoard/ScoreBoard.jsx  Marcador en español
frontend/src/components/GameSetup/GameSetup.jsx    Defaults y placeholders en español
frontend/src/components/WinnerModal/WinnerModal.jsx  Strings en español
frontend/src/components/Toast/ToastContainer.jsx   aria-label "Cerrar"
```

### Eliminados

```
frontend/src/utils/scoreUtils.js               Vacío, sin uso
frontend/src/components/DeckPile/              Directorio vacío
frontend/src/components/Flip7Overlay/         Directorio vacío
frontend/src/components/RoundSummary/          Directorio vacío
frontend/tests/example.spec.js                 Test de playwright.dev sin relación
frontend/tests/e2e/mock-rules.mjs              Importaba mocks inexistentes
frontend/tests/e2e/turn-order.mjs              Importaba mocks inexistentes
frontend/tests/e2e/game-setup.spec.js          0 bytes (reemplazado)
frontend/tests/e2e/normal-round.spec.js        0 bytes (reemplazado)
frontend/tests/e2e/all-bust.spec.js            0 bytes
frontend/tests/e2e/helpers.js                  0 bytes
```

---

## 4. Problemas encontrados durante la integración

1. **`mockData.js` inexistente** → múltiples componentes (`GamePage`, `Card`, `PlayerZone`, `ActionPanel`) importaban `CARD_TYPES`, `PLAYER_STATUS`, `MODIFIER_VALUES` de un archivo que nunca fue creado. **Solución:** centralizar las constantes en `src/config/api.js` y actualizar todos los importes.
2. **`realApi.js` vacío** → `services/api.js` lo importaba dinámicamente, pero no contenía nada. **Solución:** implementarlo con `fetch`, timeouts (`AbortController`), headers JSON y mapeo de errores.
3. **Switch `VITE_USE_MOCK`** → la app estaba configurada para usar mocks. **Solución:** eliminar el switch de `api.js`, borrar `VITE_USE_MOCK` de los `.env`, fijar `VITE_API_BASE=/api`.
4. **Shape `player.hand` vs `player.cards`** → el frontend asumía `hand`; el backend devuelve `cards`. **Solución:** adaptar `PlayerZone.jsx` y `Board.jsx`.
5. **Shape `round.round` vs `round.roundNumber`** → el frontend asumía `round`; el backend devuelve `roundNumber`. **Solución:** adaptar `Board.jsx` y `HistoryPage.jsx`.
6. **Sin campo `deckRemaining`** → el backend no expone las cartas restantes en el mazo. **Solución:** eliminar esa visualización de `Board.jsx` (no inventar el dato).
7. **Sin flag `secondChance` en el jugador** → se deriva de `player.cards.some(c => c.type === 'SECOND_CHANCE')`. **Solución:** función `hasSecondChance()` en `PlayerZone.jsx`.
8. **CORS no configurado en el backend** → cualquier llamada directa desde el navegador sería bloqueada. **Solución:** proxy de Vite (`/api` → `http://localhost:8080`); no se modificó el backend.
9. **`applyAction` enviaba `sourcePlayerId`** → el backend no lo espera; solo necesita `targetPlayerId`. **Solución:** quitar `sourcePlayerId` del payload en `gameContext.jsx` y `realApi.js`.
10. **`createGame` solo devuelve `{ gameId }`** → el frontend esperaba el estado completo. **Solución:** `createGame` hace dos llamadas (POST + GET) en `gameContext.jsx`.
11. **Textos en inglés en prácticamente todos los componentes** → traducidos al español (lobby, panel, modales, toasts, errores, aria-labels, página de historial, theme toggle).
12. **`index.html` con `lang="en"`** → cambiado a `lang="es"` y `<title>` en español.
13. **Componentes vacíos sin uso** (`DeckPile/`, `Flip7Overlay/`, `RoundSummary/`, `scoreUtils.js`) → eliminados.
14. **Tests E2E importados de mocks inexistentes o de 0 bytes** → borrados y reemplazados por specs reales.
15. **Errores de lint**:
    - `no-unused-vars` (4): `onStartFirstRound`, `loading` (Board), `label` (Card), y 1 más.
    - `set-state-in-effect`: `setAutoAdvanceTimer` en `GamePage`.
    - `no-undef` en `playwright.config.js`: `process` no estaba en `globals.browser`.
    - `react-refresh/only-export-components` en `gameContext.jsx`: el patrón Provider + hooks en el mismo módulo activa la regla.
    - **Solución:** limpiar imports no usados, refactorizar `autoAdvanceTimer` de `useState` a `useRef`, comentar `process` como global, deshabilitar la regla en el módulo de context (patrón estándar de Provider+hooks).

---

## 5. Funcionalidades conectadas

- [x] **Crear partida** — `POST /games` con 2-8 jugadores.
- [x] **Iniciar ronda** — `POST /games/{id}/rounds/start`. Auto-arranque al crear la partida.
- [x] **Obtener estado** — `GET /games/{id}`. Usado en `GamePage` (auto) y `HistoryPage`.
- [x] **Robar carta** — `POST /games/{id}/draw`. Solo lo ve el `currentPlayerId`.
- [x] **Plantarse** — `POST /games/{id}/stay`.
- [x] **Resolver acción pendiente (FREEZE/FLIP_THREE)** — `POST /games/{id}/actions` con `targetPlayerId`.
- [x] **Lista de partidas terminadas** — `GET /games/finished` (expuesta en `realApi.getFinishedGames`).
- [x] **Detalle de partida terminada** — `GET /games/finished/{id}` (expuesta en `realApi.getFinishedGame`).
- [x] **Fin de ronda** — `ROUND_END` → UI de resumen + botón "Iniciar siguiente ronda" (auto 5 s).
- [x] **Ganador (≥ 200 puntos)** — `GAME_OVER` → banner en `Board` + `WinnerModal` con podio.
- [x] **Manejo de eventos automáticos** — `lastAutomaticEvent` → toast "💛 Segunda Oportunidad salvó a {name}…".
- [x] **Selección de objetivo en acción pendiente** — UI con `targetSelf` + clic en `PlayerZone` (sólo jugadores `ACTIVE` ≠ source).
- [x] **Manejo de errores 400/404/409** — mensajes del backend traducidos al español en `errors.js`.
- [x] **Manejo de errores de red / timeout** — mensajes en español (`buildNetworkError`).

---

## 6. Funcionalidades pendientes / no conectadas

- **Test E2E determinista de `GAME_OVER`**: el backend requiere alcanzar 200 puntos, lo cual depende del orden aleatorio del mazo. No se automatiza.
- **Visualización de cartas restantes en el mazo**: el backend no expone este dato (`@Transient` y descartes se barajan al vaciarse). Se eliminó de la UI para no inventar.
- **Sonidos / animaciones de volteo 7 / flip three en cadena**: los toasts informativos funcionan, pero no hay overlay dedicado. No era un requisito explícito.

---

## 7. Verificación

| Check | Resultado |
|-------|-----------|
| `npm run build` | ✓ Pasa (50 módulos, 262 kB JS, 31 kB CSS, 241 ms) |
| `npm run lint` | ✓ 0 errores, 0 warnings |
| `node --check tests/integration/api.spec.mjs` | ✓ Parsea |
| `grep "VITE_USE_MOCK\|mockApi\|mockData" src/ tests/` | 0 resultados |
| `grep` de strings user-facing en inglés | 0 resultados |
| Backend files modificados | 0 (verificado con `find -newer`) |
| App arranca con backend corriendo | Sí (proxy `/api` → `:8080`) |

---

## 8. Cómo ejecutar

1. **Backend** (terminal 1):
   ```bash
   cd "C:\Users\Miguel\Documents\Flip-7-Backend\flip-7-backend\backend"
   mvn spring-boot:run
   # Espera a ver: "Started Main in X seconds"
   ```

2. **Frontend** (terminal 2):
   ```bash
   cd "C:\Users\Miguel\Documents\Flip-7-Frontend\frontend"
   npm install      # solo la primera vez
   npm run dev      # http://localhost:5173
   ```

3. **Pruebas de API contra el backend real** (sin navegador):
   ```bash
   cd "C:\Users\Miguel\Documents\Flip-7-Frontend\frontend"
   npm run test:api
   ```

4. **Pruebas E2E con navegador** (requiere backend en :8080):
   ```bash
   cd "C:\Users\Miguel\Documents\Flip-7-Frontend\frontend"
   npx playwright install    # solo la primera vez
   npm run test:e2e
   ```

---

## 9. Reglas cumplidas

- ✅ No se modificó ningún archivo del backend.
- ✅ No se crearon endpoints nuevos.
- ✅ No se usan mocks (ni MSW, ni jest mocks, ni stubs, ni datos hardcodeados en lugar de llamadas reales).
- ✅ Todas las pruebas de integración golpean el backend real (`http://localhost:8080`).
- ✅ Todos los textos visibles están en español.
- ✅ El frontend se conecta exclusivamente a la API real.
