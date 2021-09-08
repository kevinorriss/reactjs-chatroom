module.exports = {
    exclude: "node_modules/**",
    presets: [ 
        ['@babel/preset-env', { targets: { node: 'current' } } ],
        ['@babel/preset-react', { targets: { node: 'current' } } ]
    ],
    plugins: ['react-css-modules-transform']
}