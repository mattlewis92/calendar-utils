/// <reference types="chai" />
/// <reference types="mocha" />
/// <reference types="sinon" />

import {expect} from 'chai';
import {useFakeTimers} from 'sinon';
import * as moment from 'moment'; //TODO - remove the moment dependency from tests
import {startOfWeek, addHours, addDays, endOfWeek, subDays, startOfDay, endOfDay, addMinutes} from 'date-fns';
import {
  getWeekViewHeader,
  getWeekView,
  getMonthView,
  WeekDay,
  CalendarEvent,
  WeekViewEventRow,
  MonthView,
  getDayView,
  DayView,
  DayViewHour,
  getDayViewHourGrid,
  DayViewHourSegment
} from './../src/calendarUtils';

const TIMEZONE_OFFSET: number = new Date().getTimezoneOffset() * 60 * 1000;

let clock: any;
beforeEach(() => {
  clock = useFakeTimers(new Date('2016-06-28').getTime());
});

afterEach(() => {
  clock.restore();
});

describe('getWeekViewHeader', () => {

  it('get all days of the week for the given date', () => {
    const days: WeekDay[] = getWeekViewHeader({
      viewDate: new Date('2016-06-28')
    });
    days.forEach((day: any) => {
      day.timestamp = day.date.valueOf();
      delete day.date;
    });

    expect(days).to.deep.equal([{
      timestamp: new Date('2016-06-26').getTime() + TIMEZONE_OFFSET,
      isPast: true,
      isToday: false,
      isFuture: false,
      isWeekend: true
    }, {
      timestamp: new Date('2016-06-27').getTime() + TIMEZONE_OFFSET,
      isPast: true,
      isToday: false,
      isFuture: false,
      isWeekend: false
    }, {
      timestamp: new Date('2016-06-28').getTime() + TIMEZONE_OFFSET,
      isPast: false,
      isToday: true,
      isFuture: false,
      isWeekend: false
    }, {
      timestamp: new Date('2016-06-29').getTime() + TIMEZONE_OFFSET,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: false
    }, {
      timestamp: new Date('2016-06-30').getTime() + TIMEZONE_OFFSET,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: false
    }, {
      timestamp: new Date('2016-07-01').getTime() + TIMEZONE_OFFSET,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: false
    }, {
      timestamp: new Date('2016-07-02').getTime() + TIMEZONE_OFFSET,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: true
    }]);

  });

});

describe('getWeekView', () => {

  it('should get the correct span, offset and extends values for events that start within the week', () => {

    const events: CalendarEvent[] = [{
      start: new Date('2016-06-27'),
      end: new Date('2016-06-29'),
      title: '',
      color: {primary: '', secondary: ''}
    }];

    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date('2016-06-27')});
    expect(result).to.deep.equal([{
      row: [{
        event: events[0],
        offset: 1,
        span: 3,
        startsBeforeWeek: false,
        endsAfterWeek: false
      }]
    }]);

  });

  it('should get the correct span, offset and extends values for events that start before the week and end within it', () => {

    const events: CalendarEvent[] = [{
      start: new Date('2016-06-24'),
      end: new Date('2016-06-29'),
      title: '',
      color: {primary: '', secondary: ''}
    }];

    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date('2016-06-27')});
    expect(result).to.deep.equal([{
      row: [{
        event: events[0],
        offset: 0,
        span: 4,
        startsBeforeWeek: true,
        endsAfterWeek: false
      }]
    }]);

  });

  it('should get the correct span, offset and extends values for events that start within the week and end after it', () => {

    const events: CalendarEvent[] = [{
      start: new Date('2016-06-27'),
      end: new Date('2016-07-10'),
      title: '',
      color: {primary: '', secondary: ''}
    }];

    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date('2016-06-27')});
    expect(result).to.deep.equal([{
      row: [{
        event: events[0],
        offset: 1,
        span: 6,
        startsBeforeWeek: false,
        endsAfterWeek: true
      }]
    }]);

  });

  it('should get the correct span, offset and extends values for events that start before the week and end after it', () => {

    const events: CalendarEvent[] = [{
      start: new Date('2016-06-24'),
      end: new Date('2016-07-10'),
      title: '',
      color: {primary: '', secondary: ''}
    }];

    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date('2016-06-27')});
    expect(result).to.deep.equal([{
      row: [{
        event: events[0],
        offset: 0,
        span: 7,
        startsBeforeWeek: true,
        endsAfterWeek: true
      }]
    }]);

  });

  it('should put events in the same row that don\'t overlap', () => {
    const events: CalendarEvent[] = [{
      title: 'Event 0',
      start: startOfWeek(new Date()),
      end: addHours(startOfWeek(new Date()), 5),
      color: {primary: '', secondary: ''}
    }, {
      title: 'Event 1',
      start: addDays(startOfWeek(new Date()), 2),
      end: addHours(addDays(startOfWeek(new Date()), 2), 5),
      color: {primary: '', secondary: ''}
    }];
    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date()});
    expect(result[0].row[0].event).to.deep.equal(events[0]);
    expect(result[0].row[1].event).to.deep.equal(events[1]);
  });

  it('should put events in the next row when they overlap', () => {
    const events: CalendarEvent[] = [{
      title: 'Event 0',
      start: startOfWeek(new Date()),
      end: addHours(startOfWeek(new Date()), 5),
      color: {primary: '', secondary: ''}
    }, {
      title: 'Event 1',
      start: startOfWeek(new Date()),
      end: addHours(startOfWeek(new Date()), 5),
      color: {primary: '', secondary: ''}
    }];
    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date()});
    expect(result[0].row[0].event).to.deep.equal(events[0]);
    expect(result[1].row[0].event).to.deep.equal(events[1]);
  });

  it('should sort events by start date when all events are in the same column', () => {
    const events: CalendarEvent[] = [{
      title: 'Event 1',
      start: addHours(new Date(), 1),
      color: {primary: '', secondary: ''}
    }, {
      title: 'Event 0',
      start: new Date(),
      color: {primary: '', secondary: ''}
    }];
    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date()});
    expect(result[0].row[0].event).to.deep.equal(events[1]);
    expect(result[1].row[0].event).to.deep.equal(events[0]);
  });

  it('should exclude any events that dont occur in the event period', () => {

    const events: CalendarEvent[] = [{
      start: new Date('2016-06-24'),
      end: new Date('2016-05-25'),
      title: '',
      color: {primary: '', secondary: ''}
    }];

    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date('2016-06-27')});
    expect(result).to.deep.equal([]);

  });

  it('should exclude any events without an end date that dont occur in the event period', () => {

    const events: CalendarEvent[] = [{
      start: new Date('2016-06-24'),
      title: '',
      color: {primary: '', secondary: ''}
    }];

    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date('2016-06-27')});
    expect(result).to.deep.equal([]);

  });

  it('should include events that start on the beginning on the week', () => {
    const events: CalendarEvent[] = [{
      start: startOfWeek(new Date('2016-06-27')),
      end: new Date('2016-08-01'),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date('2016-06-27')});
    expect(result[0].row[0].event).to.deep.equal(events[0]);
  });

  it('should include events that end the end end of the week', () => {
    const events: CalendarEvent[] = [{
      start: new Date('2016-04-01'),
      end: endOfWeek(new Date('2016-06-27')),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: WeekViewEventRow[] = getWeekView({events, viewDate: new Date('2016-06-27')});
    expect(result[0].row[0].event).to.deep.equal(events[0]);
  });

});

describe('getMonthView', () => {

  let result: MonthView, events: CalendarEvent[];
  beforeEach(() => {
    events = [{
      start: new Date('2016-07-03'),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: new Date('2016-07-05'),
      end: new Date('2016-07-07'),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: new Date('2016-06-29'),
      end: new Date('2016-06-30'),
      title: '',
      color: {primary: '', secondary: ''}
    }];

    result = getMonthView({viewDate: new Date('2016-07-03'), events});
  });

  it('should get the row offsets', () => {
    expect(result.rowOffsets).to.deep.equal([0, 7, 14, 21, 28, 35]);
  });

  it('should get all days in the month plus the ones at the start and end of the week', () => {
    expect(result.days.length).to.equal(42);
  });

  it('should set the date on each day', () => {
    expect(result.days[0].date.valueOf()).to.equal(new Date('2016-06-26').getTime() + TIMEZONE_OFFSET);
    expect(result.days[10].date.valueOf()).to.equal(new Date('2016-07-06').getTime() + TIMEZONE_OFFSET);
  });

  it('should set inMonth on days', () => {
    expect(result.days[0].inMonth).to.be.false;
    expect(result.days[10].inMonth).to.be.true;
    expect(result.days[40].inMonth).to.be.false;
  });

  it('should set isPast on days', () => {
    expect(result.days[0].isPast).to.be.true;
    expect(result.days[2].isPast).to.be.false;
    expect(result.days[10].isPast).to.be.false;
  });

  it('should set isToday on days', () => {
    expect(result.days[0].isToday).to.be.false;
    expect(result.days[2].isToday).to.be.true;
  });

  it('should set isFuture on days', () => {
    expect(result.days[0].isFuture).to.be.false;
    expect(result.days[2].isFuture).to.be.false;
    expect(result.days[10].isFuture).to.be.true;
  });

  it('should set isWeekend on days', () => {
    expect(result.days[0].isWeekend).to.be.true;
    expect(result.days[2].isWeekend).to.be.false;
    expect(result.days[6].isWeekend).to.be.true;
  });

  it('should include events not in the current month but that could appear on the first and last days of adjoining months', () => {
    expect(result.days[3].events.length).to.equal(1);
  });

  it('should set events on the correct days', () => {
    expect(result.days[6].events).to.deep.equal([]);
    expect(result.days[7].events).to.deep.equal([events[0]]);
    expect(result.days[8].events).to.deep.equal([]);
    expect(result.days[9].events).to.deep.equal([events[1]]);
    expect(result.days[10].events).to.deep.equal([events[1]]);
    expect(result.days[11].events).to.deep.equal([events[1]]);
    expect(result.days[12].events).to.deep.equal([]);
  });

  it('should set the badge total on days', () => {
    expect(result.days[6].badgeTotal).to.equal(0);
    expect(result.days[7].badgeTotal).to.equal(1);
    expect(result.days[8].badgeTotal).to.equal(0);
    expect(result.days[9].badgeTotal).to.equal(1);
    expect(result.days[10].badgeTotal).to.equal(1);
    expect(result.days[11].badgeTotal).to.equal(1);
    expect(result.days[12].badgeTotal).to.equal(0);
  });

  it('should include events that start on the first week of the calendar but not actually in the month', () => {
    events = [{
      start: new Date('2016-06-29'),
      end: new Date('2016-07-01'),
      title: '',
      color: {primary: '', secondary: ''}
    }];

    result = getMonthView({viewDate: new Date('2016-07-03'), events});
    expect(result.days[3].events).to.deep.equal([events[0]]);
    expect(result.days[4].events).to.deep.equal([events[0]]);
    expect(result.days[5].events).to.deep.equal([events[0]]);
    expect(result.days[6].events).to.deep.equal([]);
  });

});

describe('getDayView', () => {

  it('should exclude all events that dont occur on the view date', () => {
    const events: CalendarEvent[] = [{
      start: startOfDay(subDays(new Date(), 1)),
      end: endOfDay(subDays(new Date(), 1)),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events).to.deep.equal([]);
  });

  it('should include events that start before the view date and end during it', () => {
    const events: CalendarEvent[] = [{
      start: startOfDay(subDays(new Date(), 1)),
      end: addHours(startOfDay(new Date()), 1),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
  });

  it('should include events that start during the view date and end after it', () => {
    const events: CalendarEvent[] = [{
      start: startOfDay(new Date()),
      end: addDays(new Date(), 5),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
  });

  it('should include events that start during the view date and end during it', () => {
    const events: CalendarEvent[] = [{
      start: addHours(startOfDay(new Date()), 1),
      end: addHours(startOfDay(new Date()), 2),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
  });

  it('should exclude events that are on the view date but outside of the day start', () => {
    const events: CalendarEvent[] = [{
      start: addHours(startOfDay(new Date()), 1),
      end: addMinutes(addHours(startOfDay(new Date()), 6), 15),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 6, minute: 30},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events).to.deep.equal([]);
  });

  it('should exclude events that are on the view date but outside of the day end', () => {
    const events: CalendarEvent[] = [{
      start: moment().endOf('day').subtract(1, 'hour').toDate(),
      end: moment().hours(18).minutes(45).toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 18, minute: 30},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events).to.deep.equal([]);
  });

  it('should sort all events by start date', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(1, 'hour').toDate(),
      end: moment().startOf('day').add(2, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: moment().startOf('day').toDate(),
      end: moment().startOf('day').add(1, 'hour').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[1]);
    expect(result.events[1].event).to.equal(events[0]);
  });

  it('should span the entire day', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').toDate(),
      end: moment().add(1, 'day').startOf('day').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(0);
    expect(result.events[0].height).to.deep.equal(1439);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.true;
  });

  it('should start part of the way through the day and end after it', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      end: moment().add(2, 'days').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(150);
    expect(result.events[0].height).to.deep.equal(1289);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.true;
  });

  it('should start before the start of the day and end part of the way through', () => {
    const events: CalendarEvent[] = [{
      start: moment().subtract(1, 'day').toDate(),
      end: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(0);
    expect(result.events[0].height).to.deep.equal(150);
    expect(result.events[0].startsBeforeDay).to.be.true;
    expect(result.events[0].endsAfterDay).to.be.false;
  });

  it('should start part of the way through the day and end part of the way through it', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      end: moment().startOf('day').add(6, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(150);
    expect(result.events[0].height).to.deep.equal(210);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.false;
  });

  it('should use a default height of one segment if there is no event end date', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(150);
    expect(result.events[0].height).to.deep.equal(30);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.false;
  });

  it('should respect the day start', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      end: moment().startOf('day').add(5, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 1, minute: 30},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(60);
    expect(result.events[0].height).to.deep.equal(150);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.false;
  });

  it('should respect the day end', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      end: moment().startOf('day').add(18, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 16, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(150);
    expect(result.events[0].height).to.deep.equal(869);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.true;
  });

  it('should adjust the event height and top to account for a bigger hour segment size', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      end: moment().startOf('day').add(7, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 6,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 16, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(450);
    expect(result.events[0].height).to.deep.equal(810);
  });

  it('should stack events where one starts before the other and ends during it', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      end: moment().startOf('day').add(7, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: moment().startOf('day').add(1, 'hours').toDate(),
      end: moment().startOf('day').add(5, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[1]);
    expect(result.events[0].left).to.equal(0);
    expect(result.events[1].event).to.equal(events[0]);
    expect(result.events[1].left).to.equal(100);
  });

  it('should stack events where one starts during the other and ends after it', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      end: moment().startOf('day').add(7, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: moment().startOf('day').add(3, 'hours').toDate(),
      end: moment().startOf('day').add(10, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
    expect(result.events[0].left).to.equal(0);
    expect(result.events[1].event).to.equal(events[1]);
    expect(result.events[1].left).to.equal(100);
  });

  it('should stack events where one starts during the other and ends during it', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      end: moment().startOf('day').add(7, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: moment().startOf('day').add(3, 'hours').toDate(),
      end: moment().startOf('day').add(5, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
    expect(result.events[0].left).to.equal(0);
    expect(result.events[1].event).to.equal(events[1]);
    expect(result.events[1].left).to.equal(100);
  });

  it('should not stack events that do not overlap each other', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      end: moment().startOf('day').add(4, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: moment().startOf('day').add(5, 'hours').toDate(),
      end: moment().startOf('day').add(6, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
    expect(result.events[0].left).to.equal(0);
    expect(result.events[1].event).to.equal(events[1]);
    expect(result.events[1].left).to.equal(0);
  });

  it('should not stack events where one starts on the others end date', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').add(30, 'minutes').toDate(),
      end: moment().startOf('day').add(4, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: moment().startOf('day').add(4, 'hours').toDate(),
      end: moment().startOf('day').add(6, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
    expect(result.events[0].left).to.equal(0);
    expect(result.events[1].event).to.equal(events[1]);
    expect(result.events[1].left).to.equal(0);
  });

  it('should return the largest row width', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').toDate(),
      end: moment().startOf('day').add(4, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: moment().startOf('day').add(4, 'hours').toDate(),
      end: moment().startOf('day').add(6, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: moment().startOf('day').add(2, 'hours').toDate(),
      end: moment().startOf('day').add(4, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: moment().startOf('day').add(2, 'hours').toDate(),
      end: moment().startOf('day').add(4, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.width).to.equal(300);
  });

  it('should exclude events with 0 height', () => {
    const events: CalendarEvent[] = [{
      start: moment().startOf('day').add(2, 'hours').toDate(),
      end: moment().startOf('day').add(2, 'hours').toDate(),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events.length).to.equal(0);
  });

  it('should separate all day events that occur on that day', () => {

    const events: CalendarEvent[] = [{
      start: moment().subtract(1, 'day').startOf('day').toDate(),
      end: moment().add(1, 'day').endOf('day').toDate(),
      title: '',
      color: {primary: '', secondary: ''},
      allDay: true
    }, {
      start: moment().subtract(1, 'day').startOf('day').toDate(),
      end: moment().add(1, 'day').endOf('day').toDate(),
      title: '',
      color: {primary: '', secondary: ''},
      allDay: false
    }, {
      start: moment().subtract(10, 'days').startOf('day').toDate(),
      end: moment().subtract(5, 'days').endOf('day').toDate(),
      title: '',
      color: {primary: '', secondary: ''},
      allDay: true
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.deep.equal(events[1]);
    expect(result.allDayEvents).to.deep.equal([events[0]]);

  });

});

describe('getDayViewHourGrid', () => {

  interface DayViewHourSegmentDate extends DayViewHourSegment {
    jsDate: Date;
  }

  it('should get the day view segments respecting the start and end of the day', () => {

    const result: DayViewHour[] = getDayViewHourGrid({
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {
        hour: 1,
        minute: 30
      },
      dayEnd: {
        hour: 3,
        minute: 59
      }
    });
    result.forEach((hour: DayViewHour) => {
      hour.segments.forEach((segment: DayViewHourSegmentDate) => {
        segment.jsDate = segment.date;
        delete segment.date;
      });
    });
    expect(result).to.deep.equal([{
      segments: [
        {jsDate: moment().startOf('day').hours(1).minutes(30).toDate(), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: moment().startOf('day').hours(2).minutes(0).toDate(), isStart: true},
        {jsDate: moment().startOf('day').hours(2).minutes(30).toDate(), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: moment().startOf('day').hours(3).minutes(0).toDate(), isStart: true},
        {jsDate: moment().startOf('day').hours(3).minutes(30).toDate(), isStart: false}
      ]
    }]);

  });

  it('should get the day view segments with a bigger segment size', () => {

    const result: DayViewHour[] = getDayViewHourGrid({
      viewDate: new Date(),
      hourSegments: 4,
      dayStart: {
        hour: 1,
        minute: 30
      },
      dayEnd: {
        hour: 3,
        minute: 59
      }
    });
    result.forEach((hour: DayViewHour) => {
      hour.segments.forEach((segment: DayViewHourSegmentDate) => {
        segment.jsDate = segment.date;
        delete segment.date;
      });
    });
    expect(result).to.deep.equal([{
      segments: [
        {jsDate: moment().startOf('day').hours(1).minutes(30).toDate(), isStart: false},
        {jsDate: moment().startOf('day').hours(1).minutes(45).toDate(), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: moment().startOf('day').hours(2).minutes(0).toDate(), isStart: true},
        {jsDate: moment().startOf('day').hours(2).minutes(15).toDate(), isStart: false},
        {jsDate: moment().startOf('day').hours(2).minutes(30).toDate(), isStart: false},
        {jsDate: moment().startOf('day').hours(2).minutes(45).toDate(), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: moment().startOf('day').hours(3).minutes(0).toDate(), isStart: true},
        {jsDate: moment().startOf('day').hours(3).minutes(15).toDate(), isStart: false},
        {jsDate: moment().startOf('day').hours(3).minutes(30).toDate(), isStart: false},
        {jsDate: moment().startOf('day').hours(3).minutes(45).toDate(), isStart: false}
      ]
    }]);

  });

});