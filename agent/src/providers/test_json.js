import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the JSON file
const FILE_PATH = path.join(__dirname, "twitter_cookies.json");

console.log("[DEBUG] Checking file at:", FILE_PATH);

// Check if the file exists
if (fs.existsSync(FILE_PATH)) {
    console.log("[INFO] File exists. Reading content...");

    try {
        // Read and parse the JSON file
        const jsonData = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
        console.log("[SUCCESS] JSON Data Loaded:", jsonData);
    } catch (error) {
        console.error("[ERROR] Failed to read JSON file:", error);
    }
} else {
    console.warn("[WARNING] File not found. Creating a new JSON file...");

    // Sample JSON Data
    const sampleData = [
        {
            name: "auth_token",
            value: "your_auth_token_here",
            domain: ".twitter.com",
            path: "/",
            secure: true,
            httpOnly: true
        },
        {
            name: "guest_id",
            value: "your_guest_id_here",
            domain: ".twitter.com",
            path: "/",
            secure: true
        }
    ];

    try {
        // Write sample data to a new JSON file
        fs.writeFileSync(FILE_PATH, JSON.stringify(sampleData, null, 2));
        console.log("[SUCCESS] New JSON file created:", FILE_PATH);
    } catch (error) {
        console.error("[ERROR] Failed to create JSON file:", error);
    }
}