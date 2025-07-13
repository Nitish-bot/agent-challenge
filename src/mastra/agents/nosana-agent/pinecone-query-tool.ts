import { Pinecone } from "@pinecone-database/pinecone";
import { createVectorQueryTool } from "@mastra/rag";
import { embeddingModel } from "../../config";
import { z } from "zod";
import "dotenv/config";

async function searchPinecone(text: string, topK: number = 1): Promise<string[]>{
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("Pinecone API key is not set in environment variables.");
    }
    
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    
    const index = pc.Index("nosana", process.env.PINECONE_HOST);
    
    const response = await index.searchRecords({
        query: {
            topK,
            inputs: { text },
        },
        fields: ['text'],
    });

    const textArray = response.result.hits.map(hit => (
        hit.fields.text || ""
    ));

    return textArray;
}

export const pineconeQueryTool = createVectorQueryTool({
    vectorStoreName: "pineconeVector",
    indexName: "nosana-mastra-2",
    model: embeddingModel,
})