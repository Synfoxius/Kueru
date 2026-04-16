/**
 * Seed logic moved to a client-side page at /dev/seed-achievements.
 * API routes run server-side and can have unreliable emulator connections.
 * The client-side page uses the browser's Firebase SDK which reliably connects
 * to the emulator when running in development.
 *
 * DELETE this file (and the /dev route) before deploying to production.
 */
export async function GET() {
    return Response.json(
        { message: "Use /dev/seed-achievements in your browser instead." },
        { status: 301 }
    );
}
