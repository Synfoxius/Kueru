import { auth } from '@/lib/firebase/config';

/**
 * Wrapper around fetch that automatically attaches the current user's
 * Firebase ID token as an `Authorization: Bearer` header.
 *
 * Use this for all client-side calls to /api/admin/* routes.
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function adminFetch(url, options = {}) {
    const token = await auth.currentUser?.getIdToken(true);
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
}
