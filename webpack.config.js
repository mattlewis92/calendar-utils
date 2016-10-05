module.exports = {
  entry: './src/calendarUtils.ts',
  output: {
    filename: './dist/umd/calendarUtils.js',
    libraryTarget: 'umd',
    library: 'calendarUtils'
  },
  externals: {
    'date-fns/end_of_day': {
      root: ['dateFns', 'endOfDay'],
      commonjs: 'date-fns/end_of_day',
      commonjs2: 'date-fns/end_of_day'
    },
    'date-fns/add_minutes': {
      root: ['dateFns', 'addMinutes'],
      commonjs: 'date-fns/add_minutes',
      commonjs2: 'date-fns/add_minutes'
    },
    'date-fns/difference_in_days': {
      root: ['dateFns', 'differenceInDays'],
      commonjs: 'date-fns/difference_in_days',
      commonjs2: 'date-fns/difference_in_days'
    },
    'date-fns/start_of_day': {
      root: ['dateFns', 'startOfDay'],
      commonjs: 'date-fns/start_of_day',
      commonjs2: 'date-fns/start_of_day'
    },
    'date-fns/is_same_day': {
      root: ['dateFns', 'isSameDay'],
      commonjs: 'date-fns/is_same_day',
      commonjs2: 'date-fns/is_same_day'
    },
    'date-fns/get_day': {
      root: ['dateFns', 'getDay'],
      commonjs: 'date-fns/get_day',
      commonjs2: 'date-fns/get_day'
    },
    'date-fns/start_of_week': {
      root: ['dateFns', 'startOfWeek'],
      commonjs: 'date-fns/start_of_week',
      commonjs2: 'date-fns/start_of_week'
    },
    'date-fns/add_days': {
      root: ['dateFns', 'addDays'],
      commonjs: 'date-fns/add_days',
      commonjs2: 'date-fns/add_days'
    },
    'date-fns/end_of_week': {
      root: ['dateFns', 'endOfWeek'],
      commonjs: 'date-fns/end_of_week',
      commonjs2: 'date-fns/end_of_week'
    },
    'date-fns/difference_in_seconds': {
      root: ['dateFns', 'differenceInSeconds'],
      commonjs: 'date-fns/difference_in_seconds',
      commonjs2: 'date-fns/difference_in_seconds'
    },
    'date-fns/start_of_month': {
      root: ['dateFns', 'startOfMonth'],
      commonjs: 'date-fns/start_of_month',
      commonjs2: 'date-fns/start_of_month'
    },
    'date-fns/end_of_month': {
      root: ['dateFns', 'endOfMonth'],
      commonjs: 'date-fns/end_of_month',
      commonjs2: 'date-fns/end_of_month'
    },
    'date-fns/is_same_month': {
      root: ['dateFns', 'isSameMonth'],
      commonjs: 'date-fns/is_same_month',
      commonjs2: 'date-fns/is_same_month'
    },
    'date-fns/is_same_second': {
      root: ['dateFns', 'isSameSecond'],
      commonjs: 'date-fns/is_same_second',
      commonjs2: 'date-fns/is_same_second'
    },
    'date-fns/set_hours': {
      root: ['dateFns', 'setHours'],
      commonjs: 'date-fns/set_hours',
      commonjs2: 'date-fns/set_hours'
    },
    'date-fns/set_minutes': {
      root: ['dateFns', 'setMinutes'],
      commonjs: 'date-fns/set_minutes',
      commonjs2: 'date-fns/set_minutes'
    },
    'date-fns/start_of_minute': {
      root: ['dateFns', 'startOfMinute'],
      commonjs: 'date-fns/start_of_minute',
      commonjs2: 'date-fns/start_of_minute'
    },
    'date-fns/difference_in_minutes': {
      root: ['dateFns', 'differenceInMinutes'],
      commonjs: 'date-fns/difference_in_minutes',
      commonjs2: 'date-fns/difference_in_minutes'
    },
    'date-fns/add_hours': {
      root: ['dateFns', 'addHours'],
      commonjs: 'date-fns/add_hours',
      commonjs2: 'date-fns/add_hours'
    }
  },
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
