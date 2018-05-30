const path = require('path');

module.exports = {
    entry: './js/index.js',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js'
    }
};
