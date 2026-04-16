// Minimal layout for public-facing admin routes (e.g. /admin/login).
// Does NOT apply AdminGuard or the admin sidebar.
export default function AdminPublicLayout({ children }) {
    return children;
}
