import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getFilteredGames,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

async function seedFilterableGames(db: Database): Promise<void> {
    const [strategy] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'strategy' })
        .returning({ id: categories.id });
    const [puzzle] = await db
        .insert(categories)
        .values({ name: 'Puzzle', description: 'puzzle' })
        .returning({ id: categories.id });
    const [codeForge] = await db
        .insert(publishers)
        .values({ name: 'CodeForge Studios', description: 'code forge' })
        .returning({ id: publishers.id });
    const [githubGames] = await db
        .insert(publishers)
        .values({ name: 'GitHub Games', description: 'github' })
        .returning({ id: publishers.id });

    await db.insert(games).values([
        {
            title: 'DevOps Dominion',
            description: 'strategy game',
            starRating: 4.2,
            categoryId: strategy.id,
            publisherId: codeForge.id,
        },
        {
            title: 'Code Puzzle Chronicles',
            description: 'puzzle game',
            starRating: 4.4,
            categoryId: puzzle.id,
            publisherId: codeForge.id,
        },
        {
            title: 'Server Siege',
            description: 'strategy game',
            starRating: 4.6,
            categoryId: strategy.id,
            publisherId: githubGames.id,
        },
    ]);
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('returns no games for an empty database', async () => {
        expect(await getFilteredGames(db)).toEqual([]);
    });

    it('filters games by title, categories, and publisher together', async () => {
        await seedFilterableGames(db);
        const all = await getAllGames(db);
        const codeForgeId = all.find((game) => game.publisher?.name === 'CodeForge Studios')?.publisher?.id;
        const strategyId = all.find((game) => game.category?.name === 'Strategy')?.category?.id;

        const filtered = await getFilteredGames(db, {
            search: 'dominion',
            categoryIds: [strategyId!],
            publisherId: codeForgeId,
        });

        expect(filtered.map((game) => game.title)).toEqual(['DevOps Dominion']);
    });

    it('matches any selected category', async () => {
        await seedFilterableGames(db);
        const all = await getAllGames(db);
        const categoryIds = [...new Set(all.map((game) => game.category?.id).filter((id): id is number => id !== undefined))];

        const filtered = await getFilteredGames(db, { categoryIds });

        expect(filtered).toHaveLength(3);
    });
});
