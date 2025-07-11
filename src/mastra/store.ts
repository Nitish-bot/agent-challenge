import { promises as fs } from 'fs';
import { MDocument } from '@mastra/rag';
import { PineconeVector } from '@mastra/pinecone';
import { embeddingModel } from './config';
import { embed } from 'ai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

// Directory with your markdown files
const docsDir = '../../docs';
const allChunks = [];

async function getMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      return await getMarkdownFiles(res);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      return [res];
    }
    return [];
  }));
  return files.flat();
}

const filePaths = await getMarkdownFiles(docsDir);

for (const filePath of filePaths) {
    const content = await fs.readFile(filePath, 'utf-8');
    const doc = MDocument.fromMarkdown(content);
    const chunks = await doc.chunk({
        strategy: "markdown",
        headers: [
            ["#", "title"],
            ["##", "section"],
        ],
    });

    allChunks.push(...chunks);
}

console.log(`Found ${allChunks.length} chunks in markdown files.`);

// Alternative: Process embeddings sequentially
const allEmbeddings = [];
for (let i = 0; i < allChunks.length; i++) {
  const chunk = allChunks[i];
  console.log(`Processing chunk ${i + 1}/${allChunks.length}...`);
  
  const embedding = await embed({
    value: chunk.text,
    model: embeddingModel,
  });
  
  allEmbeddings.push(embedding.embedding);
}

console.log(`Generated embeddings for ${allEmbeddings.length} chunks.`);

const pc = new PineconeVector({
    apiKey: process.env.PINECONE_API_KEY!,
})

await pc.createIndex({
    indexName: 'nosana-mastra-2',
    dimension: 768,
});

console.log('Pinecone index created or already exists.');

await pc.upsert({
    indexName: 'nosana-mastra-2',
    vectors: allEmbeddings,
    metadata: allChunks.map(chunk => ({
        id: chunk.id_,
        title: chunk.metadata.title,
    })),
})

console.log('Upserted embeddings into Pinecone index.');