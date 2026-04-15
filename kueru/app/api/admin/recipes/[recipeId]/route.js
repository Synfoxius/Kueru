import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { deleteRecipe } from '@/lib/db/adminRecipeService';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { recipeId } = await params;
        await deleteRecipe(recipeId);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/recipes DELETE]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
