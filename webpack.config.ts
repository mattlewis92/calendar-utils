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
      loader: 'tslint-loader',
      exclude: /node_modules/,
      enforce: 'pre',
      options: {
        emitErrors: true,
        failOnHint: true
      }
    }, {
      test: /\.ts$/,
      loader: 'ts-loader',
      exclude: /node_modules/,
      options: {
        compilerOptions: {
          module: 'es2015',
          declaration: false
        }
      }
    }]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};
