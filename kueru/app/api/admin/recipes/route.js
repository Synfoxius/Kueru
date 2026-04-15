import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { getAllRecipes, getRecipesByStatus } from '@/lib/db/adminRecipeService';
import { adminDB } from '@/lib/firebase/backend_config';
import { NextResponse } from 'next/server';

const VALID_STATUSES = ['available', 'pending', 'deleted', 'archived'];

async function enrichWithUsernames(recipes) {
    const userIds = [...new Set(recipes.map((r) => r.userId).filter(Boolean))];
    if (!userIds.length) return recipes;

    const refs = userIds.map((id) => adminDB.collection('users').doc(id));
    const snaps = await adminDB.getAll(...refs);

    const usernameMap = {};
    snaps.forEach((snap) => {
        if (snap.exists) {
            usernameMap[snap.id] =
                snap.data().username ?? snap.data().displayName ?? snap.id;
        }
    });

    return recipes.map((r) => ({
        ...r,
        authorUsername: usernameMap[r.userId] ?? r.userId ?? '—',
    }));
}

export async function GET(request) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let recipes =
            status && VALID_STATUSES.includes(status)
                ? await getRecipesByStatus(status)
                : await getAllRecipes();

        recipes = await enrichWithUsernames(recipes);
        return NextResponse.json({ recipes });
    } catch (err) {
        console.error('[admin/recipes GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
