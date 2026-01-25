/**
 * @fileoverview Tests for the stats service (services/stats.ts).
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getStats,
  incrementMessagesSent,
  incrementMessagesReceived,
  incrementRemindersTriggered,
  incrementVerificationsRun,
  incrementErrors,
  resetStats,
} from "../../services/stats";

describe("Stats Service", () => {
  beforeEach(() => {
    // Reset stats before each test to ensure isolation
    resetStats();
  });

  describe("getStats", () => {
    it("returns initial stats with zero counters", () => {
      const stats = getStats();

      expect(stats.messagesSent).toBe(0);
      expect(stats.messagesReceived).toBe(0);
      expect(stats.remindersTriggered).toBe(0);
      expect(stats.verificationsRun).toBe(0);
      expect(stats.errors).toBe(0);
    });

    it("includes startTime as a Date", () => {
      const stats = getStats();
      expect(stats.startTime).toBeInstanceOf(Date);
    });

    it("includes calculated uptimeMs", () => {
      const stats = getStats();
      expect(typeof stats.uptimeMs).toBe("number");
      expect(stats.uptimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("incrementMessagesSent", () => {
    it("increments messagesSent counter", () => {
      incrementMessagesSent();
      incrementMessagesSent();

      const stats = getStats();
      expect(stats.messagesSent).toBe(2);
    });
  });

  describe("incrementMessagesReceived", () => {
    it("increments messagesReceived counter", () => {
      incrementMessagesReceived();
      incrementMessagesReceived();
      incrementMessagesReceived();

      const stats = getStats();
      expect(stats.messagesReceived).toBe(3);
    });
  });

  describe("incrementRemindersTriggered", () => {
    it("increments remindersTriggered counter", () => {
      incrementRemindersTriggered();

      const stats = getStats();
      expect(stats.remindersTriggered).toBe(1);
    });
  });

  describe("incrementVerificationsRun", () => {
    it("increments verificationsRun counter", () => {
      incrementVerificationsRun();
      incrementVerificationsRun();

      const stats = getStats();
      expect(stats.verificationsRun).toBe(2);
    });
  });

  describe("incrementErrors", () => {
    it("increments errors counter", () => {
      incrementErrors();
      incrementErrors();
      incrementErrors();
      incrementErrors();

      const stats = getStats();
      expect(stats.errors).toBe(4);
    });
  });

  describe("resetStats", () => {
    it("resets all counters to zero", () => {
      incrementMessagesSent();
      incrementMessagesReceived();
      incrementRemindersTriggered();
      incrementVerificationsRun();
      incrementErrors();

      resetStats();

      const stats = getStats();
      expect(stats.messagesSent).toBe(0);
      expect(stats.messagesReceived).toBe(0);
      expect(stats.remindersTriggered).toBe(0);
      expect(stats.verificationsRun).toBe(0);
      expect(stats.errors).toBe(0);
    });

    it("updates startTime to current time", () => {
      const beforeReset = new Date();

      // Small delay to ensure time difference
      resetStats();

      const stats = getStats();
      expect(stats.startTime.getTime()).toBeGreaterThanOrEqual(beforeReset.getTime());
    });
  });

  describe("counters are independent", () => {
    it("incrementing one counter does not affect others", () => {
      incrementMessagesSent();
      incrementMessagesSent();
      incrementErrors();

      const stats = getStats();

      expect(stats.messagesSent).toBe(2);
      expect(stats.messagesReceived).toBe(0);
      expect(stats.remindersTriggered).toBe(0);
      expect(stats.verificationsRun).toBe(0);
      expect(stats.errors).toBe(1);
    });
  });
});
