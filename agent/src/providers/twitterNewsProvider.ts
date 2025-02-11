import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import { Scraper } from "agent-twitter-client";

export const TwitterNewsProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        console.log("[DEBUG] Fetching latest Web3 tweets...");

        const twitterAccounts = [
            "retropgf",
            "karmaticacid",
            "commonsstack",
            "tecmns",
            "Generalmagicio",
            "Giveth",
        ];

        if (twitterAccounts.length === 0) {
            return "No accounts specified to fetch news from.";
        }

        const scraper = new Scraper();

        try {
            // Login using stored credentials or session cookies
            await scraper.login(
                process.env.TWITTER_USERNAME || "",
                process.env.TWITTER_PASSWORD || ""
            );

            let latestTweets = [];

            for (const account of twitterAccounts) {
                const tweetsArray = [];

                for await (const tweet of scraper.getTweets(account, 20)) {
                    tweetsArray.push(tweet);
                }

                latestTweets.push({ account, tweets: tweetsArray });
            }

            let request =
                "# You will check all theese tweets and return only 5 most trending tweets from all theese tweets.\n";
            request += latestTweets
                .map(
                    ({ account, tweets }) =>
                        `🔹 **${account}**:\n${tweets
                            .map(
                                (t: any) =>
                                    `- ${t.text}\n  🔗 [View Tweet](https://twitter.com/${account}/status/${t.id})`
                            )
                            .join("\n")}`
                )
                .join("\n\n");

            return request;
        } catch (error) {
            console.error("[ERROR] Failed to fetch Twitter news:", error);
            return "An error occurred while fetching Twitter news.";
        }
    },
};
