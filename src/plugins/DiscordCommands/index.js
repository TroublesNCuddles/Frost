module.exports = {
    Plugin: require('./plugin.js'),
    Definition: {
        name: "Discord Commands",
        default_options: {
            prefix: '>'
        },
        dependencies: {
            datastores: ['MongoDB'],
            managers: ['Discord']
        },
        priority: 10
    }
}