module.exports = {
  entry: __dirname + '/src/calendarUtils.ts',
  output: {
    path: __dirname + '/dist/umd',
    filename: 'calendarUtils.js',
    libraryTarget: 'umd',
    library: 'calendarUtils'
  },
  externals: {
    'date-fns/end_of_day': {
      root: ['dateFns', 'endOfDay'],
      commonjs: 'date-fns/end_of_day/index',
      commonjs2: 'date-fns/end_of_day/index'
    },
    'date-fns/add_minutes': {
      root: ['dateFns', 'addMinutes'],
      commonjs: 'date-fns/add_minutes/index',
      commonjs2: 'date-fns/add_minutes/index'
    },
    'date-fns/difference_in_days': {
      root: ['dateFns', 'differenceInDays'],
      commonjs: 'date-fns/difference_in_days/index',
      commonjs2: 'date-fns/difference_in_days/index'
    },
    'date-fns/start_of_day': {
      root: ['dateFns', 'startOfDay'],
      commonjs: 'date-fns/start_of_day/index',
      commonjs2: 'date-fns/start_of_day/index'
    },
    'date-fns/is_same_day': {
      root: ['dateFns', 'isSameDay'],
      commonjs: 'date-fns/is_same_day/index',
      commonjs2: 'date-fns/is_same_day/index'
    },
    'date-fns/get_day': {
      root: ['dateFns', 'getDay'],
      commonjs: 'date-fns/get_day/index',
      commonjs2: 'date-fns/get_day/index'
    },
    'date-fns/start_of_week': {
      root: ['dateFns', 'startOfWeek'],
      commonjs: 'date-fns/start_of_week/index',
      commonjs2: 'date-fns/start_of_week/index'
    },
    'date-fns/add_days': {
      root: ['dateFns', 'addDays'],
      commonjs: 'date-fns/add_days/index',
      commonjs2: 'date-fns/add_days/index'
    },
    'date-fns/end_of_week': {
      root: ['dateFns', 'endOfWeek'],
      commonjs: 'date-fns/end_of_week/index',
      commonjs2: 'date-fns/end_of_week/index'
    },
    'date-fns/difference_in_seconds': {
      root: ['dateFns', 'differenceInSeconds'],
      commonjs: 'date-fns/difference_in_seconds/index',
      commonjs2: 'date-fns/difference_in_seconds/index'
    },
    'date-fns/start_of_month': {
      root: ['dateFns', 'startOfMonth'],
      commonjs: 'date-fns/start_of_month/index',
      commonjs2: 'date-fns/start_of_month/index'
    },
    'date-fns/end_of_month': {
      root: ['dateFns', 'endOfMonth'],
      commonjs: 'date-fns/end_of_month/index',
      commonjs2: 'date-fns/end_of_month/index'
    },
    'date-fns/is_same_month': {
      root: ['dateFns', 'isSameMonth'],
      commonjs: 'date-fns/is_same_month/index',
      commonjs2: 'date-fns/is_same_month/index'
    },
    'date-fns/is_same_second': {
      root: ['dateFns', 'isSameSecond'],
      commonjs: 'date-fns/is_same_second/index',
      commonjs2: 'date-fns/is_same_second/index'
    },
    'date-fns/set_hours': {
      root: ['dateFns', 'setHours'],
      commonjs: 'date-fns/set_hours/index',
      commonjs2: 'date-fns/set_hours/index'
    },
    'date-fns/set_minutes': {
      root: ['dateFns', 'setMinutes'],
      commonjs: 'date-fns/set_minutes/index',
      commonjs2: 'date-fns/set_minutes/index'
    },
    'date-fns/start_of_minute': {
      root: ['dateFns', 'startOfMinute'],
      commonjs: 'date-fns/start_of_minute/index',
      commonjs2: 'date-fns/start_of_minute/index'
    },
    'date-fns/difference_in_minutes': {
      root: ['dateFns', 'differenceInMinutes'],
      commonjs: 'date-fns/difference_in_minutes/index',
      commonjs2: 'date-fns/difference_in_minutes/index'
    },
    'date-fns/add_hours': {
      root: ['dateFns', 'addHours'],
      commonjs: 'date-fns/add_hours/index',
      commonjs2: 'date-fns/add_hours/index'
    }
  },
  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'tslint-loader?emitErrors=true&failOnHint=true',
      exclude: /node_modules/,
      enforce: 'pre'
    }, {
      test: /\.ts$/,
      loader: 'awesome-typescript-loader?module=es2015&declaration=false&ignoreDiagnostics=[2307]',
      exclude: /node_modules/
    }]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};
