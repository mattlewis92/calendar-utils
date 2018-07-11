import * as addDays from 'date-fns/add_days/index';
import * as addHours from 'date-fns/add_hours/index';
import * as addMinutes from 'date-fns/add_minutes/index';
import * as addSeconds from 'date-fns/add_seconds/index';
import * as differenceInDays from 'date-fns/difference_in_days/index';
import * as differenceInMinutes from 'date-fns/difference_in_minutes/index';
import * as differenceInSeconds from 'date-fns/difference_in_seconds/index';
import * as endOfDay from 'date-fns/end_of_day/index';
import * as endOfMonth from 'date-fns/end_of_month/index';
import * as endOfWeek from 'date-fns/end_of_week/index';
import * as getDay from 'date-fns/get_day/index';
import * as getMonth from 'date-fns/get_month/index';
import * as isSameDay from 'date-fns/is_same_day/index';
import * as isSameMonth from 'date-fns/is_same_month/index';
import * as isSameSecond from 'date-fns/is_same_second/index';
import * as max from 'date-fns/max/index';
import * as setHours from 'date-fns/set_hours/index';
import * as setMinutes from 'date-fns/set_minutes/index';
import * as startOfDay from 'date-fns/start_of_day/index';
import * as startOfMinute from 'date-fns/start_of_minute/index';
import * as startOfMonth from 'date-fns/start_of_month/index';
import * as startOfWeek from 'date-fns/start_of_week/index';
import { DateAdapter } from '../date-adapter';

export function adapterFactory(): DateAdapter {
  return {
    addDays,
    addHours,
    addMinutes,
    addSeconds,
    differenceInDays,
    differenceInMinutes,
    differenceInSeconds,
    endOfDay,
    endOfMonth,
    endOfWeek,
    getDay,
    getMonth,
    isSameDay,
    isSameMonth,
    isSameSecond,
    max,
    setHours,
    setMinutes,
    startOfDay,
    startOfMinute,
    startOfMonth,
    startOfWeek
  };
}
