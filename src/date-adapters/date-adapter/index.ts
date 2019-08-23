export interface DateAdapter {
  addDays(date: Date | string | number, amount: number): Date;

  addHours(date: Date | string | number, amount: number): Date;

  addMinutes(date: Date | string | number, amount: number): Date;

  addSeconds(date: Date | string | number, amount: number): Date;

  differenceInDays(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): number;

  differenceInMinutes(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): number;

  differenceInSeconds(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): number;

  endOfDay(date: Date | string | number): Date;

  endOfMonth(date: Date | string | number): Date;

  endOfWeek(
    date: Date | string | number,
    options?: {
      weekStartsOn?: number;
    }
  ): Date;

  getDay(date: Date | string | number): number;

  getMonth(date: Date | string | number): number;

  isSameDay(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): boolean;

  isSameMonth(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): boolean;

  isSameSecond(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): boolean;

  max(dates: Array<Date | number>): Date;

  setHours(date: Date | string | number, hours: number): Date;

  setMinutes(date: Date | string | number, minutes: number): Date;

  getHours(date: Date | string | number): number;

  getMinutes(date: Date | string | number): number;

  startOfDay(date: Date | string | number): Date;

  startOfMinute(date: Date | string | number): Date;

  startOfMonth(date: Date | string | number): Date;

  startOfWeek(
    date: Date | string | number,
    options?: {
      weekStartsOn?: number;
    }
  ): Date;
}
