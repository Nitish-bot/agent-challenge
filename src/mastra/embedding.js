import { promises as fs } from 'fs';
import path from 'path';
import { MDocument } from '@mastra/rag';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

// Directory with your markdown files
const docsDir = '../../docs';
const allChunks = [];

async function getMarkdownFiles(dir) {
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

    // Prepend filename to each chunk's id
    chunks.forEach(chunk => {
        chunk.id_ = `${path.relative(docsDir, filePath)}:${chunk.id_}`;
    });

    allChunks.push(...chunks);
}

const pineconeRecords = allChunks.map(chunk => ({
    _id: chunk.id_,
    text: chunk.text,
    title: chunk.metadata.title,
}));

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
})

const index = pc.Index("nosana", process.env.PINECONE_HOST);

const BATCH_SIZE = 96;

for (let i = 0; i < pineconeRecords.length; i += BATCH_SIZE) {
  const batch = pineconeRecords.slice(i, i + BATCH_SIZE);
  await index.upsertRecords(batch);
  console.log(`✅ Uploaded batch ${i / BATCH_SIZE + 1}`);
}
