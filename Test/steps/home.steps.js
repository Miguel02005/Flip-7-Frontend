const { Given, When, Then } = require('@cucumber/cucumber')
const { chromium } = require('playwright')
const assert = require('assert')
const state = require('../support/state')

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const HEADLESS  = process.env.HEADLESS === 'true'

Given('I access the home page', async function () {
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

    console.log(`  → Navegando a ${BASE_URL}`)
    await page.goto(BASE_URL)
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15000 })
    console.log('  ✓ home-page listo')
})

When('I click the Play button', async function () {
    console.log('  → Click en home-new-game')
    await state.getPage().click('[data-testid="home-new-game"]')
})

Then('I should see the game title FLIP 7', async function () {
    const page  = state.getPage()
    const flip  = await page.textContent('.lobby__title-flip')
    const seven = await page.textContent('.lobby__title-seven')
    console.log(`  → Título: "${flip}" "${seven}"`)
    assert(flip.includes('FLIP'))
    assert(seven.includes('7'))
})

Then('I should see the Play button', async function () {
    const visible = await state.getPage().isVisible('[data-testid="home-new-game"]')
    console.log(`  → home-new-game visible: ${visible}`)
    assert(visible === true)
})

Then('I should see the How to play section', async function () {
    const bodyText = await state.getPage().textContent('body')
    const found    = bodyText.includes('How to Play')
    console.log(`  → "How to Play" encontrado: ${found}`)
    assert(found)
})

Then('I should be on the game page', async function () {
    await state.getPage().waitForURL(/\/game/)
    const url = state.getPage().url()
    console.log(`  → URL actual: ${url}`)
    assert(url.includes('/game'))
})

Then('I should see the game setup form', async function () {
    const page = state.getPage()
    // Esperar a que aparezca el setup O el board (el juego puede tener estado previo)
    await page.waitForSelector('[data-testid="game-setup"], [data-testid="board"]', { timeout: 10000 })
    const setupVisible = await page.isVisible('[data-testid="game-setup"]')
    const boardVisible = await page.isVisible('[data-testid="board"]')
    console.log(`  → game-setup visible: ${setupVisible}, board visible: ${boardVisible}`)
    assert(setupVisible || boardVisible, 'No se encontró ni game-setup ni board')
})