import type { Guild } from 'discord.js';

export const ROLES = {
    instructor: "1362774423391703180",
    su2025: "1335982158036209706"
}

/**
 * Converts a role identifier to a proper Discord mention format
 * @param guild - The Discord guild to search for roles
 * @param roleIdentifier - Can be a role name, role ID, or already formatted mention
 * @returns Properly formatted Discord mention string
 */
export function getRoleByName(guild: Guild, roleIdentifier: string): string {
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
    return roleIdentifiers.map(identifier => getRoleByName(guild, identifier));
}