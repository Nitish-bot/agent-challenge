import { Mastra } from "@mastra/core/mastra";
import { PineconeVector } from "@mastra/pinecone";
import { PinoLogger } from "@mastra/loggers";
import { nosanaAgent } from "./agents/nosana-agent/nosana-agent";

const apiKey = process.env.PINECONE_API_KEY;
if (!apiKey) {
	throw new Error("Pinecone API key is not set in environment variables.");
}

const pineconeVector = new PineconeVector({
	apiKey,
});

export const mastra = new Mastra({
	agents: { nosanaAgent },
	vectors: { pineconeVector: pineconeVector as any },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	server: {
		port: 8080,
		timeout: 10000,
	},
});
