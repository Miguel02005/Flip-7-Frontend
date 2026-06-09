// @ts-check
import { defineConfig, devices } from '@playwright/test'
/* global process */

/**
 * Configuración de Playwright para Flip-7.
 *
 * Pruebas E2E (tests/e2e/): usan el navegador y requieren el backend
 * Spring Boot corriendo en http://localhost:8080 (y el dev server que
 * Playwright arranca con `npm run dev` en 5173).
 *
 * Pruebas de API pura (tests/integration/): usan `node --test` con fetch
 * directo contra el backend y NO requieren navegador.
 *
 * Ejecución:
 *   - Iniciar backend: cd ../Flip-7-Backend/flip-7-backend/backend && mvn spring-boot:run
 *   - npm run test:e2e
 *   - npm run test:api
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Ejecutar tests en paralelo. */
  fullyParallel: false,
  /* Fallar el build si quedó test.only en el código. */
  forbidOnly: !!process.env.CI,
  /* Reintentos solo en CI. */
  retries: process.env.CI ? 2 : 0,
  /* En CI, ejecutar tests secuencialmente. */
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
