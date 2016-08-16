module.exports = {
  entry: './src/calendarUtils.ts',
  output: {
    filename: './dist/src/calendarUtils.js',
    libraryTarget: 'umd',
    library: 'calendarUtils'
  },
  externals: {
    moment: 'moment'
  },
  devtool: 'source-map',
  module: {
    preLoaders: [{
      test: /\.ts$/, loader: 'tslint?emitErrors=true&failOnHint=true', exclude: /node_modules/
    }],
    loaders: [{
      test: /\.ts$/, loader: 'ts', exclude: /node_modules/
    }]
  },
  resolve: {
    extensions: ['', '.ts', '.js']
  }
};
