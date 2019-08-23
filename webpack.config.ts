module.exports = {
  mode: 'production',
  entry: __dirname + '/src/calendar-utils.ts',
  output: {
    path: __dirname + '/dist/bundles',
    filename: 'calendar-utils.umd.js',
    libraryTarget: 'umd',
    library: 'calendarUtils',
    globalObject: "typeof self !== 'undefined' ? self : this"
  },
  module: {
    rules: [{
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
  },
  optimization: {
    minimize: false
  }
};
