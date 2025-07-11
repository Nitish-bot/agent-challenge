import dotenv from "dotenv";
import { createOllama } from "ollama-ai-provider";

// Load environment variables once at the beginning
dotenv.config();

// Export all your environment variables
// Defaults to Ollama qwen2.5:1.5b
// https://ollama.com/library/qwen2.5
export const llModelName = process.env.MODEL_NAME_AT_ENDPOINT ?? "qwen2.5:1.5b";
export const llURL = process.env.API_BASE_URL ?? "http://127.0.0.1:11434/api";
export const embeddingURL = process.env.EMBEDDING_API_BASE_URL ?? "http://127.0.0.1:11434/api";
export const emeddingModelName = process.env.EMBEDDING_MODEL_NAME ?? "nomic-embed-text"

// Create and export the model instance
export const llModel = createOllama({ baseURL: llURL })
  .chat(llModelName, {
    simulateStreaming: true,
  });

export const embeddingModel = createOllama({ baseURL: embeddingURL })
  .textEmbeddingModel(emeddingModelName);
