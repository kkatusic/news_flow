import {
    elizaLogger,
    generateText,
    HandlerCallback,
    ModelClass,
} from "@elizaos/core";
import {
    ActionExample,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";
import { TwitterNewsProvider } from "../providers/twitterNewsProvider";
import { DiscordNewsProvider } from "../providers/discordNewsProvider";

export const getNewsAction: Action = {
    name: "GET_NEWS",
    similes: [
        "NEWS",
        "TRENDING_NEWS",
        "LATEST_WEB3_NEWS",
        "WEB3_UPDATES",
        "CRYPTO_NEWS",
        "BLOCKCHAIN_NEWS",
        "DEFI_UPDATES",
        "NFT_TRENDS",
        "METAVERSE_NEWS",
        "BITCOIN_TRENDS",
        "ETHEREUM_NEWS",
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        console.log("[DEBUG] Validating GET_NEWS action..."); // Log this
        return true;
    },
    description: "Providing latest Web3 news.",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: { [key: string]: unknown },
        _callback: HandlerCallback
    ): Promise<boolean> => {
        console.log("[DEBUG] Running GET_NEWS action...");

        try {
            await _callback({
                text: "Fetching the latest news from Twitter and Discord...",
            });

            // Fetch news from Twitter
            const twitterNews = await TwitterNewsProvider.get(
                _runtime,
                _message,
                _state
            );
            // Fetch news from Discord
            const discordNews = await DiscordNewsProvider.get(
                _runtime,
                _message,
                _state
            );

            // Format the response
            const context = `
                You will get twitter and discord news.\n
                You will return only 5 most trending web3 news compbining tweets and most trending posts from discord.\n\n
                **📢 Twitter Updates News:**
                ${twitterNews}
                **💬 Discord Discussions News:**
                ${discordNews}

                Your answer would be like this\n\n\n
                **Latest 5 Web3 News**:
                - News 1
                - News 2
                - News 3
                - News 4
                - News 5
            `;

            const projectValidationAnswer = await generateText({
                runtime: _runtime,
                context,
                modelClass: ModelClass.LARGE,
            });
            _callback({
                text: projectValidationAnswer,
            });

            return true;
        } catch (error: any) {
            elizaLogger.error("Error in NewsAGIplugin handler:", error);
            _callback({
                text: `Error fetching boosted projects: ${error.message}`,
                content: { error: error.message },
            });
            return false;
        }
    },
    // rewrite action examples to ask for a hello world
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Give me 5 trending Web3 news.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Fetching the latest Web3 news...",
                    action: "GET_NEWS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "What are the latest blockchain trends?" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me check Channels for the latest blockchain trends...",
                    action: "GET_NEWS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you tell me what’s hot this month in crypto today?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Checking Channels for the latest crypto news...",
                    action: "GET_NEWS",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Top trending crypto news:\n\n1. Bitcoin surpasses $50K...\n2. Ethereum L2 adoption skyrockets...\n3. New regulations impact DeFi...\n4. Solana’s latest upgrade boosts performance...\n5. Web3 gaming sees a huge surge.",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
