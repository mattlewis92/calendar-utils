import './util/use-london-timezone';
import { getWeekView } from '../src/calendar-utils';
import { adapterFactory as dateFnsAdapterFactory } from '../src/date-adapters/date-fns';
import { startOfDay } from 'date-fns';

const dateAdapter = dateFnsAdapterFactory();

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
