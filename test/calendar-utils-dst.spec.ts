import './util/use-london-timezone';
import { getWeekView } from '../src/calendar-utils';
import { adapterFactory as dateFnsAdapterFactory } from '../src/date-adapters/date-fns';
import { adapterFactory as momentAdapterFactory } from '../src/date-adapters/moment';
import { startOfDay } from 'date-fns';
import * as moment from 'moment';

const dateAdapter = dateFnsAdapterFactory();
const momentDateAdapter = momentAdapterFactory(moment);

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

    expect(dateFnsOffset).toBe(-60);
    expect(momentOffset).toBe(-60);
  });
});
