import { Client, GatewayIntentBits } from 'discord.js';

// Load environment variables
const CONFIG = {
    TOKEN: process.env.BOT_TOKEN || '',
    GUILD_ID: process.env.GUILD_ID || ''
};

if (!CONFIG.TOKEN) {
    console.error('L BOT_TOKEN environment variable is required');
    process.exit(1);
}

if (!CONFIG.GUILD_ID) {
    console.error('L GUILD_ID environment variable is required');
    process.exit(1);
}

// Create client with minimal intents needed for role fetching
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log(` Bot logged in as ${client.user?.username}`);
    
    try {
        // Fetch the guild
        const guild = await client.guilds.fetch(CONFIG.GUILD_ID);
        console.log(`=� Fetching roles for guild: ${guild.name}\n`);
        
        // Fetch all roles
        const roles = await guild.roles.fetch();
        
        // Sort roles by position (higher position = higher in hierarchy)
        const sortedRoles = roles.sort((a, b) => b.position - a.position);
        
        console.log('<� Guild Roles:');
        console.log('P'.repeat(60));
        
        sortedRoles.forEach(role => {
            const color = role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'No color';
            const memberCount = role.members.size;
            
            console.log(`Name: ${role.name}`);
            console.log(`ID: ${role.id}`);
            console.log(`Position: ${role.position}`);
            console.log(`Color: ${color}`);
            console.log(`Members: ${memberCount}`);
            console.log(`Mentionable: ${role.mentionable ? 'Yes' : 'No'}`);
            console.log(`Managed: ${role.managed ? 'Yes (Bot/Integration)' : 'No'}`);
            console.log('-'.repeat(40));
        });
        
        console.log(`\n📊 Total roles: ${roles.size}`);
        
        // Show TypeScript-friendly format for easy copying
        console.log('\n🔧 TypeScript format for roles.ts:');
        console.log('═'.repeat(60));
        console.log('export const ROLES = {');
        
        sortedRoles.forEach(role => {
            // Skip @everyone role and managed roles (usually bot roles)
            if (role.name !== '@everyone' && !role.managed) {
                // Convert role name to a valid TypeScript property name
                const propName = role.name.toLowerCase()
                    .replace(/[^a-zA-Z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');
                
                console.log(`    ${propName}: "${role.id}", // ${role.name}`);
            }
        });
        
        console.log('};');
        
    } catch (error) {
        console.error('L Error fetching roles:', error);
    } finally {
        // Disconnect the client
        client.destroy();
        process.exit(0);
    }
});

client.on('error', (error) => {
    console.error('L Discord client error:', error);
    process.exit(1);
});

// Login to Discord
console.log('= Logging in to Discord...');
client.login(CONFIG.TOKEN);