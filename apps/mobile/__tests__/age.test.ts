import { calculateAge } from "../src/lib/age";

/**
 * Unit tests for the age gate.
 *
 * The MÄÄK onboarding hard-blocks users under 20. Any off-by-one in
 * calculateAge (leap years, day-of-birthday, month rollover) can silently
 * let a 19-year-old through, which has legal/brand risk.
 *
 * These tests freeze Date.now() at known points and assert exact ages
 * around the interesting boundaries. The DB-level CHECK constraint
 * (migrations/20260411190000_age_gate_enforcement.sql) is the second line
 * of defence.
 */

function setNow(iso: string) {
  const fixed = new Date(iso).getTime();
  jest.spyOn(Date, "now").mockImplementation(() => fixed);
  // new Date() without args uses Date.now internally, so spyOn is enough.
  // new Date("string") still works normally.
  const RealDate = Date;
  // @ts-expect-error — jest mock pattern
  global.Date = class extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) {
        super(fixed);
        return;
      }
      // @ts-expect-error — forward to real constructor
      super(...args);
    }
    static now() {
      return fixed;
    }
  };
}

function restoreDate() {
  jest.restoreAllMocks();
  global.Date = Date;
}

describe("calculateAge", () => {
  afterEach(() => {
    restoreDate();
  });

  describe("age gate boundary (20 years)", () => {
    test("day before 20th birthday → 19", () => {
      setNow("2026-04-10T12:00:00.000Z"); // today
      // Born 2006-04-11 → turns 20 tomorrow
      expect(calculateAge("11", "4", "2006")).toBe(19);
    });

    test("on 20th birthday → 20", () => {
      setNow("2026-04-11T12:00:00.000Z");
      expect(calculateAge("11", "4", "2006")).toBe(20);
    });

    test("day after 20th birthday → 20", () => {
      setNow("2026-04-12T12:00:00.000Z");
      expect(calculateAge("11", "4", "2006")).toBe(20);
    });
  });

  describe("leap year edge cases", () => {
    test("Feb 29 birthday on non-leap year returns age on Feb 29 day", () => {
      // Born 2000-02-29. Today is 2026-02-28 (non-leap). JS Date treats
      // Feb 29 birthday on Feb 28 of a non-leap as "not yet 26" — our
      // calculateAge hits the monthDiff === 0 && today.date < birth.date
      // branch (28 < 29) and decrements.
      setNow("2026-02-28T12:00:00.000Z");
      expect(calculateAge("29", "2", "2000")).toBe(25);
    });

    test("Feb 29 birthday on March 1 of non-leap year → 26", () => {
      setNow("2026-03-01T12:00:00.000Z");
      expect(calculateAge("29", "2", "2000")).toBe(26);
    });

    test("Feb 29 birthday on leap day → 28", () => {
      setNow("2028-02-29T12:00:00.000Z");
      expect(calculateAge("29", "2", "2000")).toBe(28);
    });
  });

  describe("month rollover", () => {
    test("day before birthday in same month → age - 1", () => {
      setNow("2026-06-14T12:00:00.000Z");
      expect(calculateAge("15", "6", "2000")).toBe(25);
    });

    test("on birthday in same month → age", () => {
      setNow("2026-06-15T12:00:00.000Z");
      expect(calculateAge("15", "6", "2000")).toBe(26);
    });
  });

  describe("input validation", () => {
    test("rejects non-numeric day", () => {
      expect(() => calculateAge("abc", "4", "2000")).toThrow(/Day/);
    });

    test("rejects month 0", () => {
      expect(() => calculateAge("1", "0", "2000")).toThrow(/Month/);
    });

    test("rejects month 13", () => {
      expect(() => calculateAge("1", "13", "2000")).toThrow(/Month/);
    });

    test("rejects Feb 30", () => {
      expect(() => calculateAge("30", "2", "2000")).toThrow(/Day/);
    });

    test("rejects Feb 29 on non-leap year", () => {
      expect(() => calculateAge("29", "2", "2001")).toThrow(/Day/);
    });

    test("rejects future birth date", () => {
      setNow("2026-04-11T12:00:00.000Z");
      expect(() => calculateAge("11", "4", "2030")).toThrow(/future/);
    });
  });
});
