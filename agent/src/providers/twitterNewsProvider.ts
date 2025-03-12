import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import { Scraper } from "agent-twitter-client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TwitterApi } from "twitter-api-v2";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the JSON file
const COOKIE_PATH = path.join(__dirname, "twitter_cookies.json");

async function getTwitterFollowingDb() {
    const dbPath = path.join(__dirname, "../../data/db.sqlite");

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
    });

    // Check if our table exists, if not create it
    await db.exec(`
        CREATE TABLE IF NOT EXISTS twitter_following_accounts (
            username TEXT PRIMARY KEY,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}

async function getTwitterFollowing() {
    const client = new TwitterApi({
        // Add your Twitter API credentials here
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    try {
        const db = await getTwitterFollowingDb();

        // Fetch current following from Twitter
        const following = await client.v2.following(
            process.env.TWITTER_USER_ID!,
            {
                max_results: 1000, // adjust as needed
            }
        );

        // Get existing accounts from DB
        const existingAccounts = await db.all(
            "SELECT username FROM twitter_following_accounts"
        );
        const existingUsernames = new Set(
            existingAccounts.map((acc) => acc.username)
        );

        // Check for new accounts and insert them
        for (const user of following.data) {
            if (!existingUsernames.has(user.username)) {
                await db.run(
                    "INSERT INTO twitter_following_accounts (username) VALUES (?)",
                    [user.username]
                );
                console.log(`New account added: ${user.username}`);
            }
        }

        // Return all accounts from database
        return await db.all("SELECT username FROM twitter_following_accounts");
    } catch (error) {
        console.error("Error fetching Twitter following:", error);
        throw error;
    }
}

// Replace the static array with the dynamic following list
async function getTwitterAccounts() {
    try {
        const db = await getTwitterFollowingDb();
        const accounts = await db.all(
            "SELECT username FROM twitter_following_accounts"
        );
        return accounts.map((acc) => acc.username);
    } catch (error) {
        // Fallback to static list in case of error
        console.error("Error getting accounts from DB, using fallback:", error);
        return [
            "retropgf",
            "karmaticacid",
            "commonsstack",
            "tecmns",
            "Generalmagicio",
            "Giveth",
        ];
    }
}

export const TwitterNewsProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        console.log("[DEBUG] Fetching latest Web3 tweets...");

        const scraper = new Scraper({});
        let loggedIn = false;

        try {
            // Load and apply cookies if they exist
            if (fs.existsSync(COOKIE_PATH)) {
                try {
                    const rawCookies = JSON.parse(
                        fs.readFileSync(COOKIE_PATH, "utf-8")
                    );

                    if (!Array.isArray(rawCookies) || rawCookies.length === 0) {
                        console.warn(
                            "[WARNING] Cookie file is empty or corrupted."
                        );
                    } else {
                        const validCookies = rawCookies.map(
                            (cookie) =>
                                `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}`
                        );

                        await scraper.setCookies(validCookies);

                        // Verify login status
                        loggedIn = await scraper.isLoggedIn();
                        if (loggedIn) {
                            console.log(
                                "[DEBUG] Successfully authenticated using cookies!"
                            );
                        } else {
                            console.warn(
                                "[WARNING] Cookies are invalid or expired. Logging in manually."
                            );
                        }
                    }
                } catch (jsonError) {
                    console.error(
                        "[ERROR] Failed to read or parse cookies:",
                        jsonError
                    );
                }
            } else {
                console.warn("[WARNING] No saved cookies found.");
            }

            // Perform manual login if needed
            if (!loggedIn) {
                console.log("[DEBUG] Attempting manual login...");
                await scraper.login(
                    process.env.TWITTER_USERNAME || "",
                    process.env.TWITTER_PASSWORD || ""
                );
                console.log("[DEBUG] Login successful!");

                // Save new cookies after login
                const newCookies = await scraper.getCookies();
                if (Array.isArray(newCookies) && newCookies.length > 0) {
                    fs.writeFileSync(
                        COOKIE_PATH,
                        JSON.stringify(newCookies, null, 2)
                    );
                    console.log("[DEBUG] Cookies saved for future use.");
                } else {
                    console.error("[ERROR] No cookies received after login!");
                }
            }

            const followers = await scraper.getFollowing(
                process.env.TWITTER_USER_ID!,
                1000
            );

            console.log({ followers });

            const twitterAccounts = [];
            for await (const follower of followers) {
                twitterAccounts.push(follower.username);
            }

            console.log({ twitterAccounts });

            if (twitterAccounts.length === 0) {
                return "No accounts specified to fetch news from.";
            }

            let latestTweets = [];
            for (const account of twitterAccounts) {
                const tweetsArray = [];
                for await (const tweet of scraper.getTweets(account, 5)) {
                    tweetsArray.push(tweet);
                }
                latestTweets.push({ account, tweets: tweetsArray });
            }

            let request =
                "# You will check all these tweets and return only 5 most trending tweets including link for each tweet to that tweet.\n";
            request += latestTweets
                .map(
                    ({ account, tweets }) =>
                        `🔹 **${account}**:\n${tweets
                            .map(
                                (t: any) =>
                                    `- ${t.text}\n  🔗 https://twitter.com/${account}/status/${t.id}`
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
