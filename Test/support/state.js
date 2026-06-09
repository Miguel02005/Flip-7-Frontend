// Almacén compartido entre todos los steps de un mismo escenario.
// Se resetea en el After hook al cerrar el browser.

let browser = null
let page = null

module.exports = {
    getBrowser: () => browser,
    getPage:    () => page,
    setBrowser: (b) => { browser = b },
    setPage:    (p) => { page = p },
    reset:      () => { browser = null; page = null },
}
