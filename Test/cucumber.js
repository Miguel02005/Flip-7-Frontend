module.exports = {
    default: {
        require: [
            './support/hooks.js',
            './steps/*.js',
        ],
        format: ['progress-bar'],
        publishQuiet: true,
    },
}
