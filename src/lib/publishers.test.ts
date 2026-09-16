import { describe, expect, it, beforeEach } from 'vitest';
import { publishers } from '../../db/schema';
import { createTestDatabase } from '../../db/test-helpers';
import type { Database } from './db';
import { getAllPublishers } from './publishers';

describe('getAllPublishers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns publishers ordered by name', async () => {
        await db.insert(publishers).values([
            { name: 'GitHub Games', description: 'github' },
            { name: 'CodeForge Studios', description: 'code forge' },
        ]);

        const result = await getAllPublishers(db);

        expect(result.map((publisher) => publisher.name)).toEqual([
            'CodeForge Studios',
            'GitHub Games',
        ]);
        expect(result[0]).toEqual({ id: expect.any(Number), name: 'CodeForge Studios' });
    });

    it('returns an empty list when no publishers exist', async () => {
        expect(await getAllPublishers(db)).toEqual([]);
    });
});
