import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { getRecipe, updateRecipeStatus } from '@/lib/db/adminRecipeService';
import { adminDB } from '@/lib/firebase/backend_config';
import { NextResponse } from 'next/server';

const VALID_STATUSES = ['available', 'pending', 'deleted', 'archived'];

export async function GET(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { recipeId } = await params;
        const recipe = await getRecipe(recipeId);

        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        if (recipe.userId) {
            const userSnap = await adminDB.collection('users').doc(recipe.userId).get();
            if (userSnap.exists) {
                recipe.authorUsername =
                    userSnap.data().username ?? userSnap.data().displayName ?? recipe.userId;
            }
        }

        return NextResponse.json({ recipe });
    } catch (err) {
        console.error('[admin/recipes GET single]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { recipeId } = await params;
        const body = await request.json();
        const update = {};

        if (body.status !== undefined) {
            if (!VALID_STATUSES.includes(body.status)) {
                return NextResponse.json(
                    { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
                    { status: 400 }
                );
            }
            update.status = body.status;
        }

        if (body.tags !== undefined) {
            if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== 'string')) {
                return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 400 });
            }
            update.tags = body.tags;
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        if (update.status) {
            await updateRecipeStatus(recipeId, update.status);
            delete update.status;
        }
        if (Object.keys(update).length > 0) {
            await adminDB.collection('recipes').doc(recipeId).update(update);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/recipes PATCH]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Soft delete — sets status to 'deleted' rather than removing the document
export async function DELETE(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { recipeId } = await params;
        await updateRecipeStatus(recipeId, 'deleted');
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/recipes DELETE]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
