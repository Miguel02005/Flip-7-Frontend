const { After } = require('@cucumber/cucumber')
const state = require('./state')

// Único hook de limpieza — cierra el browser al final de cada escenario.
// Al estar centralizado aquí evitamos que cada archivo de steps intente
// cerrar el mismo browser de forma secuencial, lo que encadenaba timeouts.
After(async function () {
    const browser = state.getBrowser()
    if (browser) {
        try {
            await browser.close()
        } catch (_) {
            // Ignorar errores si el browser ya se cerró
        } finally {
            state.reset()
        }
    }
})
