import { adminDB } from '@/lib/firebase/backend_config';
import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const [
            usersSnap,
            disabledUsersSnap,
            recipesSnap,
            postsSnap,
            verificationsSnap,
            pendingReportsSnap,
            activeChallengesSnap,
            recentReportsSnap,
            recentVerificationsSnap,
        ] = await Promise.all([
            adminDB.collection('users').count().get(),
            adminDB.collection('users').where('status', '==', 'disabled').count().get(),
            adminDB.collection('recipes').count().get(),
            adminDB.collection('forum_posts').count().get(),
            adminDB.collection('verification_requests')
                .where('status', 'in', ['pending', 'under_review'])
                .count()
                .get(),
            adminDB.collection('reports').where('status', '==', 'pending').count().get(),
            adminDB.collection('challenges').where('status', '==', 'active').count().get(),
            adminDB.collection('reports')
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get(),
            adminDB.collection('verification_requests')
                .where('status', 'in', ['pending', 'under_review'])
                .orderBy('submittedAt', 'desc')
                .limit(5)
                .get(),
        ]);

        const recentReports = recentReportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const recentVerifications = recentVerificationsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Enrich reports with reporter usernames
        const reporterIds = [...new Set(recentReports.map((r) => r.userId).filter(Boolean))];
        if (reporterIds.length) {
            const refs = reporterIds.map((id) => adminDB.collection('users').doc(id));
            const snaps = await adminDB.getAll(...refs);
            const map = {};
            snaps.forEach((s) => { if (s.exists) map[s.id] = s.data().username ?? s.id; });
            recentReports.forEach((r) => { r.reporterUsername = map[r.userId] ?? r.userId; });
        }

        // Enrich verifications with usernames
        const verifyUserIds = [...new Set(recentVerifications.map((v) => v.userId).filter(Boolean))];
        if (verifyUserIds.length) {
            const refs = verifyUserIds.map((id) => adminDB.collection('users').doc(id));
            const snaps = await adminDB.getAll(...refs);
            const map = {};
            snaps.forEach((s) => { if (s.exists) map[s.id] = s.data().username ?? s.id; });
            recentVerifications.forEach((v) => { v.username = map[v.userId] ?? v.userId; });
        }

        return NextResponse.json({
            users:                usersSnap.data().count,
            disabledUsers:        disabledUsersSnap.data().count,
            recipes:              recipesSnap.data().count,
            posts:                postsSnap.data().count,
            pendingVerifications: verificationsSnap.data().count,
            pendingReports:       pendingReportsSnap.data().count,
            activeChallenges:     activeChallengesSnap.data().count,
            recentReports,
            recentVerifications,
        });
    } catch (err) {
        console.error('[admin/stats]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
