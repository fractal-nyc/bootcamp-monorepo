/**
 * @fileoverview In-memory stats tracking service for bot diagnostics
 * including message counts, reminders, and error tracking.
 */

/** Bot runtime statistics. */
interface Stats {
  startTime: Date;
  messagesSent: number;
  messagesReceived: number;
  remindersTriggered: number;
  verificationsRun: number;
  errors: number;
}

const stats: Stats = {
  startTime: new Date(),
  messagesSent: 0,
  messagesReceived: 0,
  remindersTriggered: 0,
  verificationsRun: 0,
  errors: 0,
};

/** Returns current stats including calculated uptime in milliseconds. */
export function getStats(): Stats & { uptimeMs: number } {
  return {
    ...stats,
    uptimeMs: Date.now() - stats.startTime.getTime(),
  };
}

/** Increments the messages sent counter. */
export function incrementMessagesSent(): void {
  stats.messagesSent++;
}

/** Increments the messages received counter. */
export function incrementMessagesReceived(): void {
  stats.messagesReceived++;
}

/** Increments the reminders triggered counter. */
export function incrementRemindersTriggered(): void {
  stats.remindersTriggered++;
}

/** Increments the verifications run counter. */
export function incrementVerificationsRun(): void {
  stats.verificationsRun++;
}

/** Increments the errors counter. */
export function incrementErrors(): void {
  stats.errors++;
}

/** Resets all stats to zero and updates the start time. */
export function resetStats(): void {
  stats.startTime = new Date();
  stats.messagesSent = 0;
  stats.messagesReceived = 0;
  stats.remindersTriggered = 0;
  stats.verificationsRun = 0;
  stats.errors = 0;
}
