import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import { Scraper } from "agent-twitter-client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CookieJar, Cookie } from "tough-cookie";

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the JSON file
const COOKIE_PATH = path.join(__dirname, "twitter_cookies.json");

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

        const scraper = new Scraper({});
        let loggedIn = false;

        try {
            // **Load cookies before login**
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
                        console.log("[DEBUG] Loaded raw cookies:", rawCookies);

                        // **Convert JSON cookies to valid Cookie objects**
                        const cookieJar = new CookieJar();
                        for (const cookie of rawCookies) {
                            if (
                                !cookie.name ||
                                !cookie.value ||
                                !cookie.domain
                            ) {
                                console.warn(
                                    "[WARNING] Skipping invalid cookie:",
                                    cookie
                                );
                                continue;
                            }
                            try {
                                const parsedCookie = new Cookie({
                                    key: cookie.name,
                                    value: cookie.value,
                                    domain: cookie.domain,
                                    path: cookie.path || "/",
                                    secure: cookie.secure ?? true, // Ensure secure cookies are set properly
                                    httpOnly: cookie.httpOnly ?? false, // Ensure httpOnly is handled properly
                                    expires: cookie.expires
                                        ? new Date(cookie.expires)
                                        : undefined,
                                });

                                // Set the cookie in the jar
                                await cookieJar.setCookie(
                                    parsedCookie.toString(),
                                    `https://${cookie.domain}`
                                );
                            } catch (cookieError) {
                                console.error(
                                    "[ERROR] Failed to parse cookie:",
                                    cookieError
                                );
                            }
                        }

                        // **Extract valid cookies from CookieJar**
                        const validCookies = cookieJar.getCookiesSync(
                            "https://twitter.com"
                        );
                        console.log(
                            "[DEBUG] Setting formatted cookies:",
                            validCookies
                        );

                        // **Apply cookies to the scraper**
                        await scraper.setCookies(validCookies);

                        // **Check if login is needed**
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

            // **Only login if cookies failed**
            if (!loggedIn) {
                console.log("[DEBUG] Attempting manual login...");
                await scraper.login(
                    process.env.TWITTER_USERNAME || "",
                    process.env.TWITTER_PASSWORD || ""
                );
                console.log("[DEBUG] Login successful!");

                // **Save new cookies after login**
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

            let latestTweets = [];
            for (const account of twitterAccounts) {
                const tweetsArray = [];
                for await (const tweet of scraper.getTweets(account, 20)) {
                    tweetsArray.push(tweet);
                }
                latestTweets.push({ account, tweets: tweetsArray });
            }

            let request =
                "# You will check all these tweets and return only 5 most trending tweets including links.\n";
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
