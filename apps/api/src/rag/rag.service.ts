import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RagService {
    constructor(private prisma: PrismaService) { }

    async index(embedding: number[], metadata: { docId: string; userId?: string; contentSnippet: string }) {
        // Store embedding in pgvector
        // Note: Prisma doesn't have native pgvector support yet
        // This would use raw SQL for vector operations

        await this.prisma.embedding.create({
            data: {
                id: uuidv4(),
                docId: metadata.docId,
                userId: metadata.userId,
                contentSnippet: metadata.contentSnippet,
                // embedding would be stored via raw query
            },
        });
    }

    async query(embedding: number[], topK: number = 5): Promise<Array<{ docId: string; similarity: number; content: string }>> {
        // In production, this would use:
        // SELECT * FROM embeddings ORDER BY embedding <-> $1 LIMIT $2

        // For now, return empty results
        // Vector search would be implemented with raw SQL
        return [];
    }

    async deleteUserEmbeddings(userId: string): Promise<void> {
        await this.prisma.embedding.deleteMany({
            where: { userId },
        });
    }
}
