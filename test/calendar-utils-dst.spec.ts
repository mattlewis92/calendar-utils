import './util/force-london';
import { getDayViewHourGrid, getWeekView } from '../src/calendar-utils';
import { adapterFactory as dateFnsAdapterFactory } from '../src/date-adapters/date-fns';

const dateAdapter = dateFnsAdapterFactory()

describe('getDayViewHourGrid', () => {
  it('should get the day view while handling the a DST change forward', () => {
    const result = getDayViewHourGrid(dateAdapter, {
      viewDate: new Date('2019-03-31'),
      hourSegments: 2,
      dayStart: { hour: 0, minute: 0 },
      dayEnd: { hour: 23, minute: 59 },
    });
    expect(result.length).toEqual(24)
    expect(result).toMatchSnapshot()
  });

  it('should get the day view while handling the a DST change backward', () => {
    const result = getDayViewHourGrid(dateAdapter, {
      viewDate: new Date('2019-10-27'),
      hourSegments: 2,
      dayStart: { hour: 0, minute: 0 },
      dayEnd: { hour: 23, minute: 59 },
    });
    expect(result.length).toEqual(24)
    expect(result).toMatchSnapshot()
  });
})

describe('getWeekView', () => {

  it('should get the week view while handling the a DST change forward', () => {
    const result = getWeekView(dateAdapter, {
      viewDate: new Date('2019-03-31'),
      hourSegments: 2,
      dayStart: { hour: 0, minute: 0 },
      dayEnd: { hour: 23, minute: 59 },
      segmentHeight: 30,
      weekStartsOn: 0
    });
    expect(result.hourColumns[0].hours.length).toEqual(24)
    expect(result).toMatchSnapshot()
  });

  it('should get the week view while handling the a DST change backward', () => {
    const result = getWeekView(dateAdapter, {
      viewDate: new Date('2019-10-27'),
      hourSegments: 2,
      dayStart: { hour: 0, minute: 0 },
      dayEnd: { hour: 23, minute: 59 },
      segmentHeight: 30,
      weekStartsOn: 0
    });
    expect(result.hourColumns[0].hours.length).toEqual(24)
    expect(result).toMatchSnapshot()
  });

})
