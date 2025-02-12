import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import { Client, GatewayIntentBits } from "discord.js";

export const DiscordNewsProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        console.log("[DEBUG] Fetching latest Discord messages...");

        // Discord Bot Token (Store in ENV file for security)
        const DISCORD_API_TOKEN = process.env.DISCORD_API_TOKEN;
        const CHANNEL_IDS = process.env.DISCORD_CHANNEL_IDS?.split(",") || [];

        if (!DISCORD_API_TOKEN) {
            console.error("[ERROR] Discord Bot Token is missing!");
            return "Error: Missing bot token.";
        }

        if (CHANNEL_IDS.length === 0) {
            console.error("[ERROR] No Discord channel IDs provided.");
            return "Error: No channels specified.";
        }

        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });

        return new Promise((resolve, reject) => {
            client.once("ready", async () => {
                console.log(`[INFO] Connected as ${client.user?.tag}`);

                let newsMessages: string[] = [];

                try {
                    for (const channelId of CHANNEL_IDS) {
                        const channel = await client.channels.fetch(channelId);

                        console.log("channel", channel);

                        if (channel && channel.isTextBased()) {
                            const messages = await channel.messages.fetch({
                                limit: 15,
                            }); // Fetch last 5 messages

                            console.log("messages", messages);

                            newsMessages.push(
                                `🔹 **${
                                    "name" in channel
                                        ? channel.name
                                        : "Unknown Channel"
                                }**:\n${messages
                                    .map(
                                        (msg) =>
                                            `- ${msg.author.username}: ${msg.content}`
                                    )
                                    .join("\n")}`
                            );
                        }
                    }

                    client.destroy(); // Disconnect the bot after fetching
                    resolve(
                        `*****news inside channels********\n From provided news decide what is tranding top 5 discord news:\nn` +
                            newsMessages.join("\n\n")
                    );
                } catch (error) {
                    console.error(
                        "[ERROR] Failed to fetch Discord messages:",
                        error
                    );
                    client.destroy();
                    reject("Error fetching Discord news.");
                }
            });

            client.login(DISCORD_API_TOKEN);
        });
    },
};
