/**
 * @fileoverview Configuration constants for the attendance bot including
 * cron schedules, channel IDs, and user mappings.
 */

/** Cron expression for daily EOD reminder (5 PM EST, Mon-Sat, skip Sundays). */
export const EOD_REMINDER_CRON = "0 17 * * 1-6";

/** Cron expression for EOD verification (11:59 PM EST). */
export const EOD_VERIFICATION_CRON = "59 23 * * *";

/** Cron expression for daily attendance reminder (9:45 AM EST). */
export const ATTENDANCE_REMINDER_CRON = "45 9 * * *";

/** Cron expression for attendance verification (10:00 AM EST). */
export const ATTENDANCE_VERIFICATION_CRON = "0 10 * * *";

/** Cron expression for daily briefing (8 AM EST). */
export const DAILY_BRIEFING_CRON = "0 8 * * *";

/** Cron expression for midday PR reminder (12:45 PM EST). */
export const MIDDAY_PR_REMINDER_CRON = "45 12 * * *";

/** Cron expression for midday PR verification (1:00 PM EST). */
export const MIDDAY_PR_VERIFICATION_CRON = "0 13 * * *";

/** Timezone for all cron schedules. */
export const CRON_TIMEZONE = "America/New_York";

/** Discord channel ID for EOD updates. */
export const EOD_CHANNEL_ID = "1336123201968935006";

/** Discord channel ID for attendance check-ins. */
export const ATTENDANCE_CHANNEL_ID = "1418329701658792046";

/** Discord channel ID for daily briefing messages. */
export const DAILY_BRIEFING_CHANNEL_ID = "1463280393888333884";

/** Discord channel ID for bot testing output. */
export const BOT_TEST_CHANNEL_ID = "1377482428062629978";

/** Array of channel IDs to monitor and log messages from. */
export const MONITORED_CHANNEL_IDS = [EOD_CHANNEL_ID, ATTENDANCE_CHANNEL_ID];

/** Discord role ID for the current active cohort (empty if disabled). */
export const CURRENT_COHORT_ROLE_ID = "";

/** Discord role ID for the FA2025 cohort. */
export const FA2025_COHORT_ROLE_ID = "1416479282817007797";

/** Discord user ID to name mapping for the current cohort. */
export const USER_ID_TO_NAME_MAP = new Map<string, string>([]);

/** Discord user ID to name mapping for FA2025 cohort members. */
export const FA2025_USER_ID_TO_NAME_MAP = new Map<string, string>([
  ["800099563767726100", "Aarti"],
  ["256191677566287873", "Anansi"],
  ["362690699042226176", "Boris"],
  ["553672761961087023", "Ethan"],
  ["798682227311116299", "Evan"],
  ["769682825724821534", "Genesis"],
  ["1348398765295538257", "Hubert"],
  ["143113024658472960", "Isaac"],
  ["494671407834333195", "Jahnik"],
  ["291235559848935425", "Jared"],
  ["1410637801547894875", "Jeong Yoon"],
  ["276874874625064960", "Maddie"],
  ["487202824732540928", "Mohamed"],
  ["481630254318878743", "Niels"],
  ["934144488027336754", "Noa"],
  ["1394002529678921808", "Nyan"],
  ["261908968312537088", "Russell"],
  ["170200954057129985", "Scout"],
  ["488432135687110679", "Shouwang"],
  ["1052420848918745160", "Mauria"],
  ["621918678191177748", "Valerie"],
]);

// ============================================================================
// Cohort Configuration
// ============================================================================

/** Configuration for a bootcamp cohort. */
export interface CohortConfig {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD, first Monday
  breakWeek: number | null; // 1-indexed week number
  totalWeeks: number;
}

/** SP2026 cohort configuration */
export const SP2026_COHORT: CohortConfig = {
  id: "sp2026",
  name: "Spring 2026",
  startDate: "2026-02-02",
  breakWeek: 5, // Week 5 is break week
  totalWeeks: 13,
};

export const CURRENT_COHORT_CONFIG: CohortConfig = SP2026_COHORT;

/** Base GitHub URL for curriculum */
export const CURRICULUM_GITHUB_URL =
  "https://github.com/fractal-bootcamp/bootcamp-monorepo/tree/main/curriculum/weeks";
