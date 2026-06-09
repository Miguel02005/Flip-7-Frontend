const { When, Then } = require('@cucumber/cucumber')
const assert = require('assert')
const state = require('../support/state')

// ── Helper de diagnóstico ─────────────────────────────────────────────────────

async function logDOM(page, label) {
    const html = await page.content()
    const ids  = [...new Set([...html.matchAll(/data-testid="([^"]+)"/g)].map(m => m[1]))]
    console.log(`\n  [DOM @ ${label}] data-testids presentes (${ids.length}):`)
    ids.forEach(id => console.log(`    · ${id}`))
}

// ── Steps de configuración previa al juego ────────────────────────────────────

When('I set player {int} name to {word}', async function (index, name) {
    const page = state.getPage()
    assert(page !== null, 'Página no inicializada — ¿falló el Given?')
    console.log(`  → Escribiendo "${name}" en player-name-input-${index}`)
    await page.fill(`[data-testid="player-name-input-${index}"]`, name)
})

When('I remove extra players until only 2 remain', async function () {
    const page = state.getPage()
    let inputs = await page.$$('[data-testid^="player-name-input-"]')
    console.log(`  → Jugadores: ${inputs.length}, reduciendo a 2`)
    while (inputs.length > 2) {
        const lastIndex = inputs.length - 1
        const removeBtn = `[data-testid="remove-player-${lastIndex}"]`
        if (await page.isDisabled(removeBtn)) break
        await page.click(removeBtn)
        inputs = await page.$$('[data-testid^="player-name-input-"]')
        console.log(`    → Quedan: ${inputs.length}`)
    }
})

// ── Steps de flujo de juego ───────────────────────────────────────────────────

When('I click the Start game button', async function () {
    const page = state.getPage()
    console.log('\n  → Click en start-game...')
    await page.click('[data-testid="start-game"]')
    console.log('  → Esperando [data-testid="board"] (15s)...')
    try {
        await page.waitForSelector('[data-testid="board"]', { timeout: 15000 })
        console.log('  ✓ board visible')
    } catch (e) {
        console.log('  ✗ TIMEOUT esperando board')
        await logDOM(page, 'después de Start')
        const errorEl = await page.$('[data-testid="error-toast"]')
        if (errorEl) {
            const errorText = await errorEl.textContent()
            console.log(`  [error en UI] ${errorText}`)
        }
        throw e
    }
    const hasPanel = await page.$('[data-testid="action-panel"]')
    console.log(`  → action-panel (data-testid): ${hasPanel ? 'sí' : 'no (normal en algunos estados)'}`)
})

When('I click the Draw card button', async function () {
    console.log('  → Click en draw-card')
    await state.getPage().click('[data-testid="draw-card"]')
})

When('I click the Stay button', async function () {
    console.log('  → Click en stay')
    await state.getPage().click('[data-testid="stay"]')
})

When('I click the Reset game button', async function () {
    console.log('  → Click en reset-game')
    await state.getPage().click('[data-testid="reset-game"]')
})

When('I force the round to end by staying', async function () {
    const page = state.getPage()
    let attempts = 0
    console.log('  → Forzando fin de ronda con Stay repetido...')
    while (attempts < 20) {
        const stayVisible = await page.isVisible('[data-testid="stay"]')
        if (!stayVisible) {
            console.log(`    → Stay ya no visible tras ${attempts} clicks`)
            break
        }
        await page.click('[data-testid="stay"]')
        attempts++
        console.log(`    → Stay #${attempts}`)
        await page.waitForTimeout(500)
    }
    console.log('  → Esperando round-summary...')
    await page.waitForSelector('[data-testid="round-summary"]', { timeout: 15000 })
    console.log('  ✓ round-summary visible')
})


Then('I should see the game board', async function () {
    const board = await state.getPage().isVisible('[data-testid="board"]')
    console.log(`  → board visible: ${board}`)
    assert(board === true)
})

Then('the Draw card button should be enabled', async function () {
    const disabled = await state.getPage().isDisabled('[data-testid="draw-card"]')
    console.log(`  → draw-card disabled: ${disabled}`)
    assert(disabled === false)
})

Then('the Stay button should be enabled', async function () {
    const disabled = await state.getPage().isDisabled('[data-testid="stay"]')
    console.log(`  → stay disabled: ${disabled}`)
    assert(disabled === false)
})

Then('I should be on the home page', async function () {
    const page = state.getPage()
    console.log('  → Esperando home-page...')
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 5000 })
    const visible = await page.isVisible('[data-testid="home-page"]')
    console.log(`  → home-page visible: ${visible}`)
    assert(visible === true)
})

Then('the action panel should contain {string}', async function (text) {
    const page = state.getPage()
    console.log(`  → Buscando .action-bar con texto "${text}"...`)
    await page.waitForSelector('.action-bar', { timeout: 10000 })
    const bodyText = await page.textContent('.action-bar')
    console.log(`  → Panel: "${bodyText.trim().substring(0, 100)}"`)
    assert(bodyText.includes(text), `Esperaba "${text}" pero el panel dice: "${bodyText}"`)
})

Then('I should see the Start next round button', async function () {
    const visible = await state.getPage().isVisible('[data-testid="start-next-round"]')
    console.log(`  → start-next-round visible: ${visible}`)
    assert(visible === true)
})

Then('the scoreboard should show {int} players', async function (count) {
    const page = state.getPage()
    console.log(`  → Esperando score-board...`)
    await page.waitForSelector('[data-testid="score-board"]', { timeout: 10000 })
    const rows = await page.$$('.score-board__row')
    console.log(`  → Filas: ${rows.length} (esperado: ${count})`)
    assert.strictEqual(rows.length, count)
})

Then('I should see the round summary', async function () {
    const visible = await state.getPage().isVisible('[data-testid="round-summary"]')
    console.log(`  → round-summary visible: ${visible}`)
    assert(visible === true)
})

Then('the summary table should have column {string}', async function (columnName) {
    const headers = await state.getPage().$$('[data-testid="round-summary"] th')
    let found = false
    for (const th of headers) {
        const text = await th.textContent()
        if (text.includes(columnName)) { found = true; break }
    }
    console.log(`  → Columna "${columnName}": ${found ? '✓' : '✗'}`)
    assert(found === true, `Columna "${columnName}" no encontrada en la tabla de resumen`)
})