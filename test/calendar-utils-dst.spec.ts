import './util/use-london-timezone';
import { DEFAULT_TIMEZONE } from './util/use-london-timezone';
import { getWeekView, getAllDayWeekEvents } from '../src/calendar-utils';
import { adapterFactory as dateFnsAdapterFactory } from '../src/date-adapters/date-fns';
import { adapterFactory as momentAdapterFactory } from '../src/date-adapters/moment';
import { adapterFactory as luxonAdapterFactory } from '../src/date-adapters/luxon';
import { startOfDay, setHours, setMinutes } from 'date-fns';
import { register } from 'timezone-mock';
import * as moment from 'moment';
import * as luxon from 'luxon';

const dateAdapter = dateFnsAdapterFactory();
const momentDateAdapter = momentAdapterFactory(moment);
const luxonDateAdapter = luxonAdapterFactory(luxon);

describe('getWeekView', () => {
  it('should get the week view while handling the a DST change forward', () => {
    const result = getWeekView(dateAdapter, {
      viewDate: new Date('2019-03-31'),
      hourSegments: 2,
      dayStart: { hour: 0, minute: 0 },
      dayEnd: { hour: 23, minute: 59 },
      segmentHeight: 30,
      weekStartsOn: 0,
    });
    expect(result.hourColumns[0].hours.length).toEqual(24);
    expect(result).toMatchSnapshot();
  });

  it('should get the week view while handling the a DST change backward', () => {
    const result = getWeekView(dateAdapter, {
      viewDate: new Date('2019-10-27'),
      hourSegments: 2,
      dayStart: { hour: 0, minute: 0 },
      dayEnd: { hour: 23, minute: 59 },
      segmentHeight: 30,
      weekStartsOn: 0,
    });
    expect(result.hourColumns[0].hours.length).toEqual(24);
    expect(result).toMatchSnapshot();
  });

  it('should get the correct week height on days where DST changes', () => {
    const result = getWeekView(dateAdapter, {
      viewDate: new Date('2020-10-25'),
      hourSegments: 2,
      dayStart: { hour: 0, minute: 0 },
      dayEnd: { hour: 23, minute: 59 },
      segmentHeight: 30,
      weekStartsOn: 0,
      events: [
        {
          title: '',
          start: startOfDay(new Date('2020-10-25')),
          end: startOfDay(new Date('2020-10-26')),
        },
      ],
    });
    expect(result.hourColumns[0].events[0].height).toEqual(1439);
  });
});

describe('getTimezoneOffset', () => {
  it('should return the correct offset', () => {
    const testDate = new Date('2019-04-01');

    const dateFnsOffset = dateAdapter.getTimezoneOffset(testDate);
    const momentOffset = momentDateAdapter.getTimezoneOffset(testDate);
    const luxonOffset = luxonDateAdapter.getTimezoneOffset(testDate);

    expect(dateFnsOffset).toBe(-60);
    expect(momentOffset).toBe(-60);
    expect(luxonOffset).toBe(-60);
  });
});

describe('getAllDayWeekEvents', () => {
  beforeEach(() => {
    // Mock Date/date-fns (uses native Date)
    register('US/Eastern'); // Toronto uses Eastern timezone
  });

  afterEach(() => {
    register(DEFAULT_TIMEZONE); // Restore default timezone for other tests
  });

  it('should correctly position an all-day event spanning from Friday before the DST change to the next Friday (Toronto) with excluded days [0, 6]', () => {
    // View: March 3–15, 2026 so we see both Fridays (DST springs forward in Toronto on March 9)
    const viewStart = new Date('2026-03-03');
    const viewEnd = new Date('2026-03-15');

    // Event spans Fri Mar 7 (before DST) – Fri Mar 14 (after DST), crossing the timezone change weekend
    const event = {
      title: 'Week spanning DST',
      start: setMinutes(setHours(new Date('2026-03-07'), 8), 0),
      end: setMinutes(setHours(new Date('2026-03-14'), 8), 0),
      allDay: true,
    };

    const result = getAllDayWeekEvents(dateAdapter, {
      viewStart,
      viewEnd,
      excluded: [0, 6], // Exclude Sunday and Saturday
      events: [event],
    });

    expect(result).toHaveLength(1);
    expect(result[0].row).toHaveLength(1);
    // With excluded [0, 6], visible days are Mon 3, Tue 4, Wed 5, Thu 6, Fri 7, Mon 10, Tue 11, Wed 12, Thu 13, Fri 14
    // Event spans Fri 7 → Fri 14 → offset 4 (Fri 7), span 6 (Fri 7, Mon 10, Tue 11, Wed 12, Thu 13, Fri 14)
    expect(result[0].row[0].offset).toBe(4);
    expect(result[0].row[0].span).toBe(6);
    expect(result[0].row[0].startsBeforeWeek).toBe(false);
    expect(result[0].row[0].endsAfterWeek).toBe(false);
    expect(result[0].row[0].event).toEqual(event);
  });
});
