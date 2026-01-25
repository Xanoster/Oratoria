/**
 * Prisma seed script for Oratoria
 * Run with: pnpm db:seed
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';
import { A1_LESSONS } from './seeds/a1-lessons';

const prisma = new PrismaClient();

async function seedLessons() {
    console.log('🌱 Seeding A1 lessons...');

    for (const lesson of A1_LESSONS) {
        const existing = await prisma.lesson.findFirst({
            where: { title: lesson.title, level: lesson.level },
        });

        if (!existing) {
            await prisma.lesson.create({
                data: {
                    level: lesson.level,
                    title: lesson.title,
                    content: lesson.content as any,
                    createdBy: 'system',
                },
            });
            console.log(`  ✓ Created: ${lesson.title}`);
        } else {
            console.log(`  ⏭ Skipped (exists): ${lesson.title}`);
        }
    }

    console.log('✅ Lesson seeding complete!');
}

async function main() {
    try {
        await seedLessons();
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
