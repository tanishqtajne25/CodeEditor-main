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

const redisClient = createClient();

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

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME as string;

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
    const { code, language } = req.body;
    const snippetId = `snippet-${Date.now()}${getExtension(language)}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: snippetId,
      Body: code,
      ContentType: "text/plain",
    });

    await s3Client.send(command);
    res.status(200).json({ snippetId });
  } catch (error) {
    console.error("Error saving to S3:", error);
    res.status(500).json({ error: "Failed to save snippet" });
  }
});

app.get("/snippets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: id,
    });

    const response = await s3Client.send(command);
    const code = await response.Body?.transformToString();
    
    // Infer language from extension
    let language = "javascript";
    if (id.endsWith(".py")) language = "python";
    if (id.endsWith(".cpp")) language = "cpp";
    if (id.endsWith(".java")) language = "java";
    if (id.endsWith(".rs")) language = "rust";
    if (id.endsWith(".go")) language = "go";

    res.status(200).json({ code, language });
  } catch (error) {
    console.error("Error retrieving from S3:", error);
    res.status(404).json({ error: "Snippet not found" });
  }
});

app.delete("/snippets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: id,
    });

    await s3Client.send(command);
    res.status(200).json({ message: "Snippet deleted successfully" });
  } catch (error) {
    console.error("Error deleting from S3:", error);
    res.status(500).json({ error: "Failed to delete snippet" });
  }
});

const server = app.listen(3000, '0.0.0.0', () => {
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
