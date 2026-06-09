const { Given, When, Then } = require('@cucumber/cucumber')
const { chromium } = require('playwright')
const assert = require('assert')
const state = require('../support/state')

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const HEADLESS  = process.env.HEADLESS === 'true'

// ── Given: abrir /game ────────────────────────────────────────────────────────

Given('I access the game page', async function () {
    console.log(`\n  → Lanzando Chromium (headless: ${HEADLESS})...`)
    const browser = await chromium.launch({ headless: HEADLESS })
    const context = await browser.newContext()
    const page    = await context.newPage()
    state.setBrowser(browser)
    state.setPage(page)

    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`  [browser error] ${msg.text()}`)
    })
    page.on('pageerror', err => console.log(`  [page crash] ${err.message}`))

    console.log(`  → Navegando a ${BASE_URL}/game`)
    await page.goto(`${BASE_URL}/game`)
    await page.waitForSelector('[data-testid="game-setup"]', { timeout: 15000 })
    console.log('  ✓ game-setup listo')
})

// ── Acciones del formulario ───────────────────────────────────────────────────

When('I click the Add player button', async function () {
    console.log('  → Click en add-player')
    await state.getPage().click('[data-testid="add-player"]')
})

When('I add players until there are 8', async function () {
    const page   = state.getPage()
    const addBtn = '[data-testid="add-player"]'
    let count    = 0
    while (!(await page.isDisabled(addBtn))) {
        await page.click(addBtn)
        count++
    }
    console.log(`  → Añadidos ${count} jugadores hasta el máximo`)
})

When('I remove player at position {int}', async function (pos) {
    console.log(`  → Eliminando jugador en posición ${pos}`)
    await state.getPage().click(`[data-testid="remove-player-${pos - 1}"]`)
})

When('I remove players until only 2 remain', async function () {
    const page   = state.getPage()
    let inputs   = await page.$$('[data-testid^="player-name-input-"]')
    console.log(`  → Jugadores actuales: ${inputs.length}, reduciendo a 2`)
    while (inputs.length > 2) {
        const lastIndex = inputs.length - 1
        const removeBtn = `[data-testid="remove-player-${lastIndex}"]`
        if (await page.isDisabled(removeBtn)) break
        await page.click(removeBtn)
        inputs = await page.$$('[data-testid^="player-name-input-"]')
        console.log(`    → Quedan: ${inputs.length}`)
    }
})

When('I clear all player names except the first one', async function () {
    const page   = state.getPage()
    const inputs = await page.$$('[data-testid^="player-name-input-"]')
    console.log(`  → Borrando ${inputs.length - 1} nombres`)
    for (let i = 1; i < inputs.length; i++) {
        await inputs[i].fill('')
    }
})

When('I change player {int} name to {word}', async function (index, name) {
    console.log(`  → Cambiando jugador ${index} a "${name}"`)
    await state.getPage().fill(`[data-testid="player-name-input-${index}"]`, name)
})

// ── Aserciones ────────────────────────────────────────────────────────────────

Then('I should see {int} player name inputs', async function (count) {
    const page = state.getPage()
    await page.waitForFunction(
        (n) => document.querySelectorAll('[data-testid^="player-name-input-"]').length === n,
        count,
        { timeout: 5000 }
    )
    const inputs = await page.$$('[data-testid^="player-name-input-"]')
    console.log(`  → Inputs: ${inputs.length} (esperado: ${count})`)
    assert.strictEqual(inputs.length, count)
})

Then('the Start game button should be enabled', async function () {
    const disabled = await state.getPage().isDisabled('[data-testid="start-game"]')
    console.log(`  → start-game disabled: ${disabled}`)
    assert(disabled === false)
})

Then('the Start game button should be disabled', async function () {
    const disabled = await state.getPage().isDisabled('[data-testid="start-game"]')
    console.log(`  → start-game disabled: ${disabled}`)
    assert(disabled === true)
})

Then('the Add player button should be disabled', async function () {
    const disabled = await state.getPage().isDisabled('[data-testid="add-player"]')
    console.log(`  → add-player disabled: ${disabled}`)
    assert(disabled === true)
})

Then('all remove buttons should be disabled', async function () {
    const removeBtns = await state.getPage().$$('[data-testid^="remove-player-"]')
    console.log(`  → Verificando ${removeBtns.length} botones remove`)
    for (const btn of removeBtns) {
        assert(await btn.isDisabled() === true)
    }
    console.log('  ✓ Todos deshabilitados')
})

Then('player {int} input should have value {word}', async function (index, value) {
    const inputValue = await state.getPage().inputValue(`[data-testid="player-name-input-${index}"]`)
    console.log(`  → jugador ${index}: "${inputValue}" (esperado: "${value}")`)
    assert.strictEqual(inputValue, value)
})
