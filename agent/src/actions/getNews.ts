import { HandlerCallback } from "@elizaos/core";
import {
    ActionExample,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";

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

        // Fetch news data (replace with real API call)
        const trendingNews = [
            "Ethereum upgrade expected soon.",
            "Bitcoin ETF gaining momentum.",
            "Solana DeFi sees record volumes.",
            "Web3 social platforms on the rise.",
            "Regulators discussing crypto adoption.",
        ];

        // Notify the user
        await _callback({ text: "Fetching the latest Web3 news..." });

        // Send all news in a single response
        await _callback({
            text: `Here are 5 trending Web3 news stories:\n\n${trendingNews
                .map((news, i) => `${i + 1}. ${news}`)
                .join("\n")}`,
        });

        return true;
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
