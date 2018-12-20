const path = require('path');
const webpack = require('webpack');
module.exports = {
    entry : './index.js',
    output : {
        path : path.resolve(__dirname , 'dist'),
        filename : 'build.js'
    },
    mode : 'development',
    devtool : '#source-map',
    module : {
        rules : [
            {
                test : /.(js|jsx)$/,
                loader : 'babel-loader',
                exclude : /node_modules/
            }
        ]
    },
    target: 'node',
};