/**
 * @fileoverview Curriculum data and date-to-assignment mapping functions.
 * Maps calendar dates to curriculum assignments based on cohort configuration.
 */

import {
  CohortConfig,
  CURRENT_COHORT_CONFIG,
  CURRICULUM_GITHUB_URL,
} from "./constants";

/** A day's assignment in the curriculum. */
export interface DayAssignment {
  week: number;
  dayOfWeek: number; // 1=Mon, 6=Sat
  title: string;
  description: string;
  githubPath: string; // Relative path like "01-intro/assignments/1-simple-game.md"
}

/** Mock curriculum data: Record<weekNum, Record<dayNum, assignment info>> */
const MOCK_CURRICULUM: Record<
  number,
  Record<number, { title: string; description: string; githubPath: string }>
> = {
  1: {
    1: {
      title: "Simple Game",
      description: "Build a Tic-Tac-Toe game with React.",
      githubPath: "01-intro/assignments/1-simple-game.md",
    },
    2: {
      title: "Styling",
      description: "Add CSS styling and responsive design.",
      githubPath: "01-intro/assignments/2-styling.md",
    },
    3: {
      title: "Server Setup",
      description: "Create an Express server.",
      githubPath: "01-intro/assignments/3-server.md",
    },
    4: {
      title: "Multi-Game",
      description: "Support multiple game instances.",
      githubPath: "01-intro/assignments/4-multi-game.md",
    },
    5: {
      title: "Database",
      description: "Add Prisma and PostgreSQL.",
      githubPath: "01-intro/assignments/5-database.md",
    },
    6: {
      title: "Week 1 Review",
      description: "Review and polish your project.",
      githubPath: "01-intro/assignments/1-simple-game.md",
    },
  },
  2: {
    1: {
      title: "Auth Basics",
      description: "Implement user authentication.",
      githubPath: "02-chatbot/assignments/1-auth.md",
    },
    2: {
      title: "Chat Feature",
      description: "Build a real-time chat interface.",
      githubPath: "02-chatbot/assignments/2-chat.md",
    },
    3: {
      title: "Persistence",
      description: "Add database persistence.",
      githubPath: "02-chatbot/assignments/3-persistence.md",
    },
    4: {
      title: "Tools & Streaming",
      description: "Implement AI tool calling.",
      githubPath: "02-chatbot/assignments/4-tools.md",
    },
    5: {
      title: "Chatbot Polish",
      description: "Polish your chatbot.",
      githubPath: "02-chatbot/assignments/4-tools.md",
    },
    6: {
      title: "Week 2 Demo",
      description: "Demo your chatbot project.",
      githubPath: "02-chatbot/assignments/4-tools.md",
    },
  },
  3: {
    1: {
      title: "Group Project Kickoff",
      description: "Form teams and pitch ideas.",
      githubPath: "03-group-project/assignment.md",
    },
    2: {
      title: "Group Project",
      description: "Continue working on your group project.",
      githubPath: "03-group-project/assignment.md",
    },
    3: {
      title: "Group Project",
      description: "Continue working on your group project.",
      githubPath: "03-group-project/assignment.md",
    },
    4: {
      title: "Group Project",
      description: "Continue working on your group project.",
      githubPath: "03-group-project/assignment.md",
    },
    5: {
      title: "Group Project",
      description: "Continue working on your group project.",
      githubPath: "03-group-project/assignment.md",
    },
    6: {
      title: "Group Project Demo",
      description: "Demo your group project.",
      githubPath: "03-group-project/assignment.md",
    },
  },
  4: {
    1: {
      title: "Week 4 Day 1",
      description: "Lorem ipsum dolor sit amet.",
      githubPath: "04-placeholder/assignments/day1.md",
    },
    2: {
      title: "Week 4 Day 2",
      description: "Consectetur adipiscing elit.",
      githubPath: "04-placeholder/assignments/day2.md",
    },
    3: {
      title: "Week 4 Day 3",
      description: "Sed do eiusmod tempor.",
      githubPath: "04-placeholder/assignments/day3.md",
    },
    4: {
      title: "Week 4 Day 4",
      description: "Incididunt ut labore et dolore.",
      githubPath: "04-placeholder/assignments/day4.md",
    },
    5: {
      title: "Week 4 Day 5",
      description: "Magna aliqua ut enim.",
      githubPath: "04-placeholder/assignments/day5.md",
    },
    6: {
      title: "Week 4 Day 6",
      description: "Ad minim veniam quis.",
      githubPath: "04-placeholder/assignments/day6.md",
    },
  },
  // Week 5 is break week - no entries
  6: {
    1: {
      title: "Week 6 Day 1",
      description: "Nostrud exercitation ullamco.",
      githubPath: "06-placeholder/assignments/day1.md",
    },
    2: {
      title: "Week 6 Day 2",
      description: "Laboris nisi ut aliquip.",
      githubPath: "06-placeholder/assignments/day2.md",
    },
    3: {
      title: "Week 6 Day 3",
      description: "Ex ea commodo consequat.",
      githubPath: "06-placeholder/assignments/day3.md",
    },
    4: {
      title: "Week 6 Day 4",
      description: "Duis aute irure dolor.",
      githubPath: "06-placeholder/assignments/day4.md",
    },
    5: {
      title: "Week 6 Day 5",
      description: "In reprehenderit in voluptate.",
      githubPath: "06-placeholder/assignments/day5.md",
    },
    6: {
      title: "Week 6 Day 6",
      description: "Velit esse cillum dolore.",
      githubPath: "06-placeholder/assignments/day6.md",
    },
  },
  7: {
    1: {
      title: "Week 7 Day 1",
      description: "Eu fugiat nulla pariatur.",
      githubPath: "07-placeholder/assignments/day1.md",
    },
    2: {
      title: "Week 7 Day 2",
      description: "Excepteur sint occaecat.",
      githubPath: "07-placeholder/assignments/day2.md",
    },
    3: {
      title: "Week 7 Day 3",
      description: "Cupidatat non proident.",
      githubPath: "07-placeholder/assignments/day3.md",
    },
    4: {
      title: "Week 7 Day 4",
      description: "Sunt in culpa qui officia.",
      githubPath: "07-placeholder/assignments/day4.md",
    },
    5: {
      title: "Week 7 Day 5",
      description: "Deserunt mollit anim id.",
      githubPath: "07-placeholder/assignments/day5.md",
    },
    6: {
      title: "Week 7 Day 6",
      description: "Est laborum et dolorum.",
      githubPath: "07-placeholder/assignments/day6.md",
    },
  },
  8: {
    1: {
      title: "Week 8 Day 1",
      description: "Fuga vel qui accusamus.",
      githubPath: "08-placeholder/assignments/day1.md",
    },
    2: {
      title: "Week 8 Day 2",
      description: "Quia voluptas sit aspernatur.",
      githubPath: "08-placeholder/assignments/day2.md",
    },
    3: {
      title: "Week 8 Day 3",
      description: "Aut odit aut fugit.",
      githubPath: "08-placeholder/assignments/day3.md",
    },
    4: {
      title: "Week 8 Day 4",
      description: "Sed quia consequuntur magni.",
      githubPath: "08-placeholder/assignments/day4.md",
    },
    5: {
      title: "Week 8 Day 5",
      description: "Dolores eos qui ratione.",
      githubPath: "08-placeholder/assignments/day5.md",
    },
    6: {
      title: "Week 8 Day 6",
      description: "Voluptatem sequi nesciunt.",
      githubPath: "08-placeholder/assignments/day6.md",
    },
  },
  9: {
    1: {
      title: "Week 9 Day 1",
      description: "Neque porro quisquam est.",
      githubPath: "09-placeholder/assignments/day1.md",
    },
    2: {
      title: "Week 9 Day 2",
      description: "Qui dolorem ipsum quia.",
      githubPath: "09-placeholder/assignments/day2.md",
    },
    3: {
      title: "Week 9 Day 3",
      description: "Dolor sit amet consectetur.",
      githubPath: "09-placeholder/assignments/day3.md",
    },
    4: {
      title: "Week 9 Day 4",
      description: "Adipisci velit sed quia.",
      githubPath: "09-placeholder/assignments/day4.md",
    },
    5: {
      title: "Week 9 Day 5",
      description: "Non numquam eius modi.",
      githubPath: "09-placeholder/assignments/day5.md",
    },
    6: {
      title: "Week 9 Day 6",
      description: "Tempora incidunt ut labore.",
      githubPath: "09-placeholder/assignments/day6.md",
    },
  },
  10: {
    1: {
      title: "Week 10 Day 1",
      description: "Et dolore magnam aliquam.",
      githubPath: "10-placeholder/assignments/day1.md",
    },
    2: {
      title: "Week 10 Day 2",
      description: "Quaerat voluptatem ut enim.",
      githubPath: "10-placeholder/assignments/day2.md",
    },
    3: {
      title: "Week 10 Day 3",
      description: "Ad minima veniam quis.",
      githubPath: "10-placeholder/assignments/day3.md",
    },
    4: {
      title: "Week 10 Day 4",
      description: "Nostrum exercitationem ullam.",
      githubPath: "10-placeholder/assignments/day4.md",
    },
    5: {
      title: "Week 10 Day 5",
      description: "Corporis suscipit laboriosam.",
      githubPath: "10-placeholder/assignments/day5.md",
    },
    6: {
      title: "Week 10 Day 6",
      description: "Nisi ut aliquid ex ea.",
      githubPath: "10-placeholder/assignments/day6.md",
    },
  },
  11: {
    1: {
      title: "Week 11 Day 1",
      description: "Commodi consequatur quis.",
      githubPath: "11-placeholder/assignments/day1.md",
    },
    2: {
      title: "Week 11 Day 2",
      description: "Autem vel eum iure.",
      githubPath: "11-placeholder/assignments/day2.md",
    },
    3: {
      title: "Week 11 Day 3",
      description: "Reprehenderit qui in ea.",
      githubPath: "11-placeholder/assignments/day3.md",
    },
    4: {
      title: "Week 11 Day 4",
      description: "Voluptate velit esse quam.",
      githubPath: "11-placeholder/assignments/day4.md",
    },
    5: {
      title: "Week 11 Day 5",
      description: "Nihil molestiae consequatur.",
      githubPath: "11-placeholder/assignments/day5.md",
    },
    6: {
      title: "Week 11 Day 6",
      description: "Vel illum qui dolorem.",
      githubPath: "11-placeholder/assignments/day6.md",
    },
  },
  12: {
    1: {
      title: "Week 12 Day 1",
      description: "Eum fugiat quo voluptas.",
      githubPath: "12-placeholder/assignments/day1.md",
    },
    2: {
      title: "Week 12 Day 2",
      description: "Nulla pariatur at vero.",
      githubPath: "12-placeholder/assignments/day2.md",
    },
    3: {
      title: "Week 12 Day 3",
      description: "Eos et accusamus et iusto.",
      githubPath: "12-placeholder/assignments/day3.md",
    },
    4: {
      title: "Week 12 Day 4",
      description: "Odio dignissimos ducimus.",
      githubPath: "12-placeholder/assignments/day4.md",
    },
    5: {
      title: "Week 12 Day 5",
      description: "Qui blanditiis praesentium.",
      githubPath: "12-placeholder/assignments/day5.md",
    },
    6: {
      title: "Week 12 Day 6",
      description: "Voluptatum deleniti atque.",
      githubPath: "12-placeholder/assignments/day6.md",
    },
  },
  13: {
    1: {
      title: "Week 13 Day 1",
      description: "Corrupti quos dolores et quas.",
      githubPath: "13-placeholder/assignments/day1.md",
    },
    2: {
      title: "Week 13 Day 2",
      description: "Molestias excepturi sint.",
      githubPath: "13-placeholder/assignments/day2.md",
    },
    3: {
      title: "Week 13 Day 3",
      description: "Occaecati cupiditate non.",
      githubPath: "13-placeholder/assignments/day3.md",
    },
    4: {
      title: "Week 13 Day 4",
      description: "Provident similique sunt.",
      githubPath: "13-placeholder/assignments/day4.md",
    },
    5: {
      title: "Week 13 Day 5",
      description: "In culpa qui officia deserunt.",
      githubPath: "13-placeholder/assignments/day5.md",
    },
    6: {
      title: "Final Demo Day",
      description: "Present your final project.",
      githubPath: "13-placeholder/assignments/final.md",
    },
  },
};

/**
 * Maps a calendar date to its curriculum position (week and day of week).
 * @param date - The date to map.
 * @param cohort - The cohort configuration.
 * @returns The week (1-indexed) and day of week (1=Mon, 6=Sat), or null if outside cohort.
 */
export function getCurriculumPosition(
  date: Date,
  cohort: CohortConfig = CURRENT_COHORT_CONFIG
): { week: number; dayOfWeek: number } | null {
  // Use UTC noon for both dates to avoid DST-related off-by-one errors
  const [sy, sm, sd] = cohort.startDate.split("-").map(Number);
  const startUtcNoon = Date.UTC(sy, sm - 1, sd, 12);
  const targetUtcNoon = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12);

  // Calculate days since start (can be negative if before start)
  const diffDays = Math.round((targetUtcNoon - startUtcNoon) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return null; // Before cohort starts
  }

  // Calculate week number (1-indexed)
  const week = Math.floor(diffDays / 7) + 1;

  if (week > cohort.totalWeeks) {
    return null; // After cohort ends
  }

  // Get day of week from the input date's local representation (0=Sun through 6=Sat in JS)
  const jsDayOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getDay();

  // Convert to 1=Mon through 6=Sat, 0=Sun
  // We only care about Mon-Sat (1-6)
  if (jsDayOfWeek === 0) {
    return null; // Sunday - no assignment
  }

  const dayOfWeek = jsDayOfWeek; // 1=Mon, 2=Tue, ..., 6=Sat

  return { week, dayOfWeek };
}

/**
 * Returns the next working day (skipping Sunday).
 * @param date - The current date.
 * @returns The next working day.
 */
export function getNextWorkingDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  // If next day is Sunday, skip to Monday
  if (nextDay.getDay() === 0) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

/**
 * Gets tomorrow's assignment based on the current date and cohort.
 * @param date - The current date (defaults to now).
 * @param cohort - The cohort configuration (defaults to current cohort).
 * @returns The day assignment or null if none available.
 */
export function getTomorrowsAssignment(
  date: Date = new Date(),
  cohort: CohortConfig = CURRENT_COHORT_CONFIG
): DayAssignment | null {
  const tomorrow = getNextWorkingDay(date);
  const position = getCurriculumPosition(tomorrow, cohort);

  if (!position) {
    return null; // Outside cohort dates
  }

  const { week, dayOfWeek } = position;

  // Check if this is the break week
  if (cohort.breakWeek && week === cohort.breakWeek) {
    return null; // Break week - no assignment
  }

  // Look up assignment in mock data
  const weekData = MOCK_CURRICULUM[week];
  if (!weekData) {
    return null; // No data for this week
  }

  const dayData = weekData[dayOfWeek];
  if (!dayData) {
    return null; // No data for this day
  }

  return {
    week,
    dayOfWeek,
    title: dayData.title,
    description: dayData.description,
    githubPath: dayData.githubPath,
  };
}

/**
 * Formats an assignment for Discord display.
 * @param assignment - The assignment to format.
 * @returns Formatted string with assignment details and GitHub link.
 */
export function formatAssignmentForDiscord(assignment: DayAssignment): string {
  const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[assignment.dayOfWeek];
  const githubUrl = `${CURRICULUM_GITHUB_URL}/${assignment.githubPath}`;

  return (
    `**${dayName}'s Assignment (Week ${assignment.week}):** ${assignment.title}\n` +
    `${assignment.description}\n` +
    `${githubUrl}`
  );
}
