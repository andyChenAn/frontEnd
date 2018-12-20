const path = require('path');
module.exports = {
    entry : './index.js',
    output : {
        path : path.resolve(__dirname , './dist'),
        filename : 'build.js'
    },
    target : 'node',
    mode : 'development',
    devtool : '#source-map',
    module : {
        rules : [
            {
                test : /.jsx?$/,
                use : 'babel-loader',
                exclude : /node_modules/
            }
        ]
    }
};