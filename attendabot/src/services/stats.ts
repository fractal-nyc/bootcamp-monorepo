// Stats tracking service for bot diagnostics

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

export function getStats(): Stats & { uptimeMs: number } {
  return {
    ...stats,
    uptimeMs: Date.now() - stats.startTime.getTime(),
  };
}

export function incrementMessagesSent(): void {
  stats.messagesSent++;
}

export function incrementMessagesReceived(): void {
  stats.messagesReceived++;
}

export function incrementRemindersTriggered(): void {
  stats.remindersTriggered++;
}

export function incrementVerificationsRun(): void {
  stats.verificationsRun++;
}

export function incrementErrors(): void {
  stats.errors++;
}

export function resetStats(): void {
  stats.startTime = new Date();
  stats.messagesSent = 0;
  stats.messagesReceived = 0;
  stats.remindersTriggered = 0;
  stats.verificationsRun = 0;
  stats.errors = 0;
}
