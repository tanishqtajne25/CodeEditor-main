import express from "express";
import { createClient } from "redis";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// Load .env using explicit path so it works with PM2
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(express.json());
app.use(cors());

const redisClient = createClient(
  process.env.REDIS_URL ? { url: process.env.REDIS_URL } : undefined
);

redisClient.on("error", (err) => console.log("Redis Client Error", err));

app.post("/submit", async (req, res) => {
  const { code, language, roomId, input } = req.body;
  const submissionId = `submission-${Date.now()}-${roomId}`;

  console.log(`Received submission from room ${roomId}`);

  try {
    // Push submission to Redis
    await redisClient.lPush(
      "problems",
      JSON.stringify({ code, language, roomId, submissionId, input })
    );

    console.log(
      `Submission pushed to Redis for: ${roomId}  and problem id: ${submissionId}`
    );

    res.status(200).send("Submission received and stored");
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to store submission");
  }
});

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const dynamodbClient = new DynamoDBClient({
  region: process.env.AWS_REGION as string,
});
const ddbDocClient = DynamoDBDocumentClient.from(dynamodbClient);
const TABLE_NAME = process.env.SNIPPETS_TABLE_NAME || "Snippets";
const ALLOWED_LANGUAGES = new Set([
  "javascript",
  "python",
  "cpp",
  "java",
  "rust",
  "go",
]);

const getExtension = (language: string) => {
    switch (language) {
      case "javascript": return ".js";
      case "python": return ".py";
      case "cpp": return ".cpp";
      case "java": return ".java";
      case "rust": return ".rs";
      case "go": return ".go";
      default: return ".txt";
    }
};

app.post("/snippets", async (req, res) => {
  try {
    const { code, language, roomId, users } = req.body;
    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ error: "Code snippet is required" });
    }

    const normalizedLanguage =
      typeof language === "string" ? language.trim().toLowerCase() : "";

    if (!ALLOWED_LANGUAGES.has(normalizedLanguage)) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    const normalizedRoomId =
      typeof roomId === "string" && roomId.trim() ? roomId.trim() : "unknown";

    const normalizedUsers = Array.isArray(users)
      ? Array.from(
          new Set(
            users
              .filter((user): user is string => typeof user === "string")
              .map((user) => user.trim())
              .filter((user) => user.length > 0)
          )
        )
      : [];

    const snippetId = `snippet-${Date.now()}${getExtension(normalizedLanguage)}`;

    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        SnippetID: snippetId,
        Language: normalizedLanguage,
        RoomID: normalizedRoomId,
        RoomCreator: normalizedRoomId,
        Users: normalizedUsers,
        people: normalizedUsers,
        CodeSnippet: code,
        CreatedAt: new Date().toISOString()
      }
    }));

    res.status(200).json({ snippetId });
  } catch (error) {
    console.error("Error saving snippet:", error);
    const message = error instanceof Error ? error.message : "Failed to save snippet";
    res.status(500).json({ error: message });
  }
});

app.get("/snippets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const ddbResponse = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { SnippetID: id }
    }));

    if (!ddbResponse.Item) {
      return res.status(404).json({ error: "Snippet not found in DynamoDB" });
    }

    const { CodeSnippet, Language, RoomID, RoomCreator, Users, people, CreatedAt } = ddbResponse.Item;

    res.status(200).json({ 
      code: CodeSnippet || "", 
      language: Language || "javascript", 
      roomId: RoomID || RoomCreator, 
      users: Array.isArray(Users) ? Users : (Array.isArray(people) ? people : []), 
      createdAt: CreatedAt 
    });
  } catch (error) {
    console.error("Error retrieving snippet:", error);
    res.status(500).json({ error: "Failed to retrieve snippet" });
  }
});

app.delete("/snippets/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await ddbDocClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { SnippetID: id }
    }));

    res.status(200).json({ message: "Snippet deleted successfully" });
  } catch (error) {
    console.error("Error deleting from DynamoDB:", error);
    res.status(500).json({ error: "Failed to delete snippet" });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log("Express Server Listening on port 3000");
});

async function main() {
  try {
    await redisClient.connect();

    console.log("Redis Client Connected");
  } catch (error) {
    console.log("Failed to connect to Redis", error);
  }
}

main();
