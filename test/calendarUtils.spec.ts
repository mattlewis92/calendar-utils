/// <reference types="chai" />
/// <reference types="mocha" />
/// <reference types="sinon" />

import {expect} from 'chai';
import {useFakeTimers} from 'sinon';
import {
  startOfWeek,
  addHours,
  addDays,
  endOfWeek,
  subDays,
  startOfDay,
  endOfDay,
  addMinutes,
  subHours,
  setHours,
  setMinutes,
  endOfMonth,
  startOfYesterday,
  startOfTomorrow
} from 'date-fns';
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
} from '../src/calendarUtils';

let clock: any, timezoneOffset: number;
beforeEach(() => {
  clock = useFakeTimers(new Date('2016-06-28').getTime());
  timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
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
      timestamp: new Date('2016-06-26').getTime() + timezoneOffset,
      isPast: true,
      isToday: false,
      isFuture: false,
      isWeekend: true
    }, {
      timestamp: new Date('2016-06-27').getTime() + timezoneOffset,
      isPast: true,
      isToday: false,
      isFuture: false,
      isWeekend: false
    }, {
      timestamp: new Date('2016-06-28').getTime() + timezoneOffset,
      isPast: false,
      isToday: true,
      isFuture: false,
      isWeekend: false
    }, {
      timestamp: new Date('2016-06-29').getTime() + timezoneOffset,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: false
    }, {
      timestamp: new Date('2016-06-30').getTime() + timezoneOffset,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: false
    }, {
      timestamp: new Date('2016-07-01').getTime() + timezoneOffset,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: false
    }, {
      timestamp: new Date('2016-07-02').getTime() + timezoneOffset,
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

  it('should not throw if no events are provided', () => {
    const result: WeekViewEventRow[] = getWeekView({viewDate: new Date('2016-06-27')});
    expect(result).to.deep.equal([]);
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
    expect(result.days[0].date.valueOf()).to.equal(new Date('2016-06-26').getTime() + timezoneOffset);
    expect(result.days[10].date.valueOf()).to.equal(new Date('2016-07-06').getTime() + timezoneOffset);
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

  it('should not throw if no events are provided', () => {
    expect(() => getMonthView({viewDate: new Date('2016-07-03')})).not.to.throw();
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
      start: subHours(endOfDay(new Date()), 1),
      end: setMinutes(setHours(new Date(), 18), 45),
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
      start: addHours(startOfDay(new Date()), 1),
      end: addHours(startOfDay(new Date()), 2),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: startOfDay(new Date()),
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
    expect(result.events[0].event).to.equal(events[1]);
    expect(result.events[1].event).to.equal(events[0]);
  });

  it('should span the entire day', () => {
    const events: CalendarEvent[] = [{
      start: startOfDay(new Date()),
      end: startOfDay(addDays(new Date(), 1)),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addDays(new Date(), 2),
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
      start: subDays(new Date(), 1),
      end: addMinutes(addHours(startOfDay(new Date()), 2), 30),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 6),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 5),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 18),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 7),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 7),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 1),
      end: addHours(startOfDay(new Date()), 5),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 7),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 3),
      end: addHours(startOfDay(new Date()), 10),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 7),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 3),
      end: addHours(startOfDay(new Date()), 5),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 4),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 5),
      end: addHours(startOfDay(new Date()), 6),
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
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 4),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 4),
      end: addHours(startOfDay(new Date()), 6),
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
      start: addHours(startOfDay(new Date()), 2),
      end: addHours(startOfDay(new Date()), 4),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 4),
      end: addHours(startOfDay(new Date()), 6),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 2),
      end: addHours(startOfDay(new Date()), 4),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 2),
      end: addHours(startOfDay(new Date()), 4),
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
      start: addHours(startOfDay(new Date()), 2),
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
    expect(result.events.length).to.equal(0);
  });

  it('should separate all day events that occur on that day', () => {

    const events: CalendarEvent[] = [{
      start: subDays(startOfDay(new Date()), 1),
      end: endOfDay(addDays(new Date(), 1)),
      title: '',
      color: {primary: '', secondary: ''},
      allDay: true
    }, {
      start: subDays(startOfDay(new Date()), 1),
      end: endOfDay(addDays(new Date(), 1)),
      title: '',
      color: {primary: '', secondary: ''},
      allDay: false
    }, {
      start: subDays(startOfDay(new Date()), 10),
      end: endOfDay(subDays(new Date(), 5)),
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

  it('should include all day events that start on the current day with no end date', () => {

    const events: CalendarEvent[] = [{
      start: startOfDay(new Date()),
      title: '',
      color: {primary: '', secondary: ''},
      allDay: true
    }];

    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 6, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.allDayEvents).to.deep.equal([events[0]]);

  });

  it('should stack events in the correct columns', () => {

    const events: CalendarEvent[] = [{
      start: subDays(endOfMonth(new Date()), 3),
      end: addDays(endOfMonth(new Date()), 3),
      title: 'Day column 2',
      color: {primary: '', secondary: ''},
    }, {
      start: startOfYesterday(),
      end: setHours(startOfTomorrow(), 11),
      title: 'Day column 1 - event 1',
      color: {primary: '', secondary: ''}
    }, {
      start: setHours(addDays(startOfDay(new Date()), 1), 11),
      end: setHours(addDays(startOfDay(new Date()), 1), 15),
      title: 'Day column 1 - event 2',
      color: {primary: '', secondary: ''}
    }];

    const result: DayView = getDayView({
      events,
      viewDate: startOfTomorrow(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });

    expect(result.events[0].event).to.equal(events[1]);
    expect(result.events[0].height).to.equal(660);
    expect(result.events[0].top).to.equal(0);
    expect(result.events[0].left).to.equal(0);

    expect(result.events[1].event).to.equal(events[0]);
    expect(result.events[1].height).to.equal(1439);
    expect(result.events[1].top).to.equal(0);
    expect(result.events[1].left).to.equal(100);

    expect(result.events[2].event).to.equal(events[2]);
    expect(result.events[2].height).to.equal(240);
    expect(result.events[2].top).to.equal(660);
    expect(result.events[2].left).to.equal(0);

  });

  it('should not throw if no events are provided', () => {

    const result: DayView = getDayView({
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 6, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events).to.deep.equal([]);

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
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 1), 30), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 0), isStart: true},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 30), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 0), isStart: true},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 30), isStart: false}
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
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 1), 30), isStart: false},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 1), 45), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 0), isStart: true},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 15), isStart: false},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 30), isStart: false},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 45), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 0), isStart: true},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 15), isStart: false},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 30), isStart: false},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 45), isStart: false}
      ]
    }]);

  });

});