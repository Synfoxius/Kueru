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
        const { status } = await request.json();

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        await updateRecipeStatus(recipeId, status);
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
