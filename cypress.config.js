const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://front.serverest.dev',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',

    // Cada teste comeca com o navegador limpo: nenhum cenario depende do anterior.
    testIsolation: true,

    viewportWidth: 1440,
    viewportHeight: 900,

    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 60000,

    video: false,
    screenshotOnRunFailure: true,

    // O ServeRest online e um ambiente publico e compartilhado, sujeito a
    // instabilidade de rede. O retry cobre esse risco de infraestrutura -
    // nunca deve ser usado para mascarar teste mal escrito.
    retries: { runMode: 2, openMode: 0 },

    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      html: false,
      json: true,
      reportFilename: '[status]_[datetime]-[name]-report',
    },

    env: {
      apiUrl: 'https://serverest.dev',
    },

    setupNodeEvents(on, config) {
      return config;
    },
  },
});
