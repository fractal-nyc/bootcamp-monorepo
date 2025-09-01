import { CronJob } from 'cron';
import type { Client, TextChannel } from 'discord.js';
import { processRoleMentions } from './roles';

const EOD_CHANNEL_ID = '1336123201968935006'
const READING_CHANNEL_ID = '1336694823050285169'
const PRACTICE_CHANNEL_ID = '1378928414181949480'
const BOT_TEST_ID = '1377482428062629978'

// Threshold for Sevalla hosting - increased to handle potential delays
const SEVALLA_THRESHOLD_MS = 30000; // 30 second threshold for slow hosting

interface CronMessage {
    content: string;
    mentions: string[];
}

interface CronJobConfig {
    name: string;
    schedule: string;
    channelId: string;
    enabled: boolean;
    message: CronMessage;
}

interface TimezoneConfig {
    timezone: string;
    locale: string;
}

// ===== TIMEZONE CONFIGURATION =====
const TIMEZONE_CONFIG: TimezoneConfig = {
    timezone: 'America/New_York', // Change to your timezone
    locale: 'en-US'
};

// ===== MESSAGE TEMPLATES =====
const EOD_STATUS_TEMPLATE = `Reminder @su2025, 📝 Please submit your EOD status report

*Template*:
*Blockers* - what is blocking you from making more progress and having more fun?
*Wins* - What wins are worth celebrating today? 
*PRs* - link all your PRS for the day
*Code Review* - Link your one PR review for the day`;

const DAILY_READINGS_TEMPLATE = `@su2025, this is your daily thread to discuss today's readings.

*post your questions/comments/highlights/notes in this thread by the start of lecture tomorrow*

readings are not optional, and if you do not complete them you may be... 🤖||T3RM1N4T3D!!||🤖

todo: andrew needs to actually wire this up with the readings, but for now you can find today's reading in here:
https://github.com/fractal-bootcamp/bootcamp-monorepo/tree/main/curriculum/weeks
`

const DAILY_PRACTICE_TEMPLATE = `@su2025, this is your daily thread to discuss today's practice problems.

*post your questions/comments/highlights/notes/revelations in this thread by the start of lecture tomorrow*

practice problems are not optional unless you complete them all in advance!

any suborbination may be punished with... 🤖||T3RM1N4T10N!!||🤖

todo: andrew needs to actually wire this up with the practice problems, but for now you can find today's practice problems in here:
https://github.com/fractal-bootcamp/bootcamp-monorepo/tree/main/curriculum/weeks
`

const DAILY_EOD_REVIEW_TEMPLATE = ``

// ===== CRON JOB DEFINITIONS =====
/**
 * CRON SYNTAX EXPLAINED
 * 
 * Cron expressions are strings used to define scheduled times for jobs. 
 * The format is:
 * 
 *   ┌───────────── second (0 - 59)
 *   │ ┌───────────── minute (0 - 59)
 *   │ │ ┌───────────── hour (0 - 23)
 *   │ │ │ ┌───────────── day of month (1 - 31)
 *   │ │ │ │ ┌───────────── month (1 - 12)
 *   │ │ │ │ │ ┌───────────── day of week (0 - 7) (0 or 7 = Sunday)
 *   │ │ │ │ │ │
 *   * * * * * *
 * 
 * Each field can be:
 *   - A specific value (e.g., 5)
 *   - A range (e.g., 1-5)
 *   - A list (e.g., 1,3,5)
 *   - A step (e.g., *\/15 for every 15 units)
 *   - An asterisk (*) for "every" value
 * 
 * Examples:
 *   "0 0 18 * * 1-6"   → 6:00 PM, Monday through Saturday
 *   "0 0 8 * * 1-6"    → 8:00 AM, Monday through Saturday
 *   "15 * * * * *"     → Every minute at 15 seconds
 *   "0 0 0 * * *"      → Midnight every day
 * 
 * Note: This project uses 6 fields (including seconds) for finer control.

  */

const CRON_JOBS: CronJobConfig[] = [
    {
        name: 'weekly_meeting',
        schedule: '0 0 14 * * 1', // Every Monday at 2:00 PM (added seconds field)
        channelId: EOD_CHANNEL_ID,
        enabled: false,
        message: {
            content: '📅 Weekly team meeting starts in 15 minutes!',
            mentions: ['@here'] // or role IDs: ['<@&ROLE_ID>']
        }
    },
    {
        name: 'every_15_sec_test',
        schedule: '*/15 * * * * *', // Every 15 seconds (added seconds field)
        channelId: BOT_TEST_ID,
        enabled: false,
        message: {
            content: '⏰ This is your every-15 second cron test message!',
            mentions: ['instructor'] // Uses predefined role name
        }
    },
    {
        name: 'midnight_test',
        schedule: '0 0 0 * * *', // Every day at midnight (added seconds field)
        channelId: BOT_TEST_ID,
        enabled: false,
        message: {
            content: '🌙 This is your midnight cron test message, the crons should work tomorrow!',
            mentions: [] // No mentions
        }
    },
    {
        name: 'eod_status_reminder',
        schedule: '0 0 18 * * 1-6', // Monday through Saturday at 6:00 PM (added seconds field)
        channelId: EOD_CHANNEL_ID,
        enabled: false,
        message: {
            content: EOD_STATUS_TEMPLATE,
            mentions: ['su2025'] // Uses predefined role name
        }
    },
    {
        name: 'daily_reading',
        schedule: '0 0 8 * * 1-6', // Monday through Saturday at 8:00 AM (added seconds field)
        channelId: READING_CHANNEL_ID,
        enabled: false,
        message: {
            content: DAILY_READINGS_TEMPLATE,
            mentions: ['su2025'] // Uses predefined role name
        }
    },
    {
        name: 'daily_practice',
        schedule: '0 0 8 * * 1-6', // Monday through Saturday at 8:00 AM (added seconds field)
        channelId: PRACTICE_CHANNEL_ID,
        enabled: false,
        message: {
            content: DAILY_PRACTICE_TEMPLATE,
            mentions: ['su2025'] // Uses predefined role name
        }
    },
];

const activeCronJobs = new Map<string, CronJob>();

export function startCronJobs(client: Client): void {
    CRON_JOBS.forEach((jobConfig: CronJobConfig) => {
        if (jobConfig.enabled) {
            const cronJob = CronJob.from({
                cronTime: jobConfig.schedule,
                onTick: async function () {
                    await sendScheduledMessage(jobConfig, client);
                },
                start: true,
                timeZone: TIMEZONE_CONFIG.timezone,
                name: jobConfig.name,
                threshold: SEVALLA_THRESHOLD_MS, // Long threshold for Sevalla hosting
                errorHandler: (error: unknown) => {
                    console.error(`❌ Error in cron job ${jobConfig.name}:`, error);
                }
            });

            activeCronJobs.set(jobConfig.name, cronJob);
            console.log(`✅ Started cron job: ${jobConfig.name} (${jobConfig.schedule}) with ${SEVALLA_THRESHOLD_MS}ms threshold`);
        } else {
            console.log(`⏸️  Skipped disabled job: ${jobConfig.name}`);
        }
    });
}

export function stopCronJobs(): void {
    activeCronJobs.forEach((cronJob: CronJob, name: string) => {
        cronJob.stop();
        console.log(`🛑 Stopped cron job: ${name}`);
    });
    activeCronJobs.clear();
}

export async function sendScheduledMessage(job: CronJobConfig, client: Client): Promise<void> {
    try {
        const channel = await client.channels.fetch(job.channelId);
        if (!channel || !channel.isTextBased()) {
            console.error(`❌ Channel not found or not text - based: ${job.channelId} for job: ${job.name} `);
            return;
        }

        let messageContent = job.message.content;

        // Add mentions if specified
        if (job.message.mentions && job.message.mentions.length > 0) {
            const guild = (channel as TextChannel).guild;

            const mentions = await processRoleMentions(guild, job.message.mentions);
            const mentionString = mentions.join(' ');
            messageContent = `${mentionString}\n\n${messageContent}`;
        }

        await (channel as TextChannel).send(messageContent);
        console.log(`📨 Sent scheduled message for job: ${job.name} `);
    } catch (error) {
        console.error(`❌ Error sending scheduled message for ${job.name}: `, error);
    }
}