"use client";

import AdminGuard from "./_components/AdminGuard";
import AdminSidebar from "./_components/AdminSidebar";

export default function AdminLayout({ children }) {
    return (
        <AdminGuard>
            <div className="flex h-screen bg-background">
                <AdminSidebar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}
