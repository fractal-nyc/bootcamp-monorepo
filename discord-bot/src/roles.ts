import type { Guild } from 'discord.js';

export const ROLES = {
    jake_andrew: "1214297504607113337", // jake + andrew
    admin: "1219318577270882324", // admin
    instructor: "1362774423391703180", // instructor
    sp2025: "1335982238264983552", // Sp2025
    su2024: "1237976275700944958", // Su2024
    su2025: "1335982158036209706", // su2025
    bootcamper: "1303751671947722792", // bootcamper
    soleda: "1255742357383675995", // soleda
    axle: "1257723804130742383", // axle
    heartbeat: "1257724022658044024", // heartbeat
    forge: "1280182349241258134", // Forge
    fa2024: "1284144792741089392", // Fa2024
    book_club: "1299436741278826538", // Book Club
    valor: "1300850409891565608", // valor
    quiller: "1306037885136277526", // quiller
    new_role: "1378915638453600276", // new role
};

/**
 * Converts a role identifier to a proper Discord mention format
 * @param guild - The Discord guild to search for roles
 * @param roleIdentifier - Can be a role name, role ID, or already formatted mention
 * @returns Properly formatted Discord mention string
 */
export function getRoleStringByName(guild: Guild, roleIdentifier: string): string {
    // Return as-is if already formatted
    if (roleIdentifier === '@everyone' || roleIdentifier === '@here') {
        return roleIdentifier;
    }

    if (roleIdentifier.startsWith('<@&') && roleIdentifier.endsWith('>')) {
        return roleIdentifier; // Already formatted role mention
    }

    if (roleIdentifier.startsWith('<@') && roleIdentifier.endsWith('>')) {
        return roleIdentifier; // Already formatted user mention
    }

    // Check if it's a predefined role name in our ROLES constant
    if (roleIdentifier in ROLES) {
        const roleId = ROLES[roleIdentifier as keyof typeof ROLES];
        return `<@&${roleId}>`;
    }

    // Try to find role by name in the guild
    const role = guild.roles.cache.find(r => r.name === roleIdentifier);
    if (role) {
        return `<@&${role.id}>`;
    }

    // If not found as role, return as plain text with @ prefix
    console.warn(`⚠️  Role "${roleIdentifier}" not found in guild ${guild.name}`);
    return `@${roleIdentifier}`;
}

/**
 * Processes an array of role identifiers and converts them to mention format
 * @param guild - The Discord guild to search for roles
 * @param roleIdentifiers - Array of role names, IDs, or already formatted mentions
 * @returns Promise resolving to array of properly formatted mention strings
 */
export async function processRoleMentions(guild: Guild, roleIdentifiers: string[]): Promise<string[]> {
    return roleIdentifiers.map(identifier => getRoleStringByName(guild, identifier));
}