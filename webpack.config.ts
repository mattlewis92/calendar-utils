import * as webpackDateFnsExternals from 'webpack-date-fns-externals';

module.exports = {
  entry: __dirname + '/src/calendar-utils.ts',
  output: {
    path: __dirname + '/dist/umd',
    filename: 'calendar-utils.js',
    libraryTarget: 'umd',
    library: 'calendarUtils'
  },
  externals: [
    webpackDateFnsExternals()
  ],
  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'tslint-loader?emitErrors=true&failOnHint=true',
      exclude: /node_modules/,
      enforce: 'pre'
    }, {
      test: /\.ts$/,
      loader: 'awesome-typescript-loader?module=es2015&declaration=false',
      exclude: /node_modules/,
      options: {
        module: 'es2015'
      }
    }]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};
