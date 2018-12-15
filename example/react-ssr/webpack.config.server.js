const path = require('path');
module.exports = {
    entry : './server.js',
    output : {
        path : path.resolve(__dirname),
        filename : 'server.build.js'
    },
    mode : 'development',
    target : 'node',
    devtool : '#source-map',
    module : {
        rules : [
            {
                test : /.(js|jsx)$/,
                use : 'babel-loader',
                exclude : /node_modules/
            }
        ]
    }
}