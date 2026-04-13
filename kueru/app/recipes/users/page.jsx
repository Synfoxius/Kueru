"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getCertifiedChefs, getPopularUsers } from "@/lib/db/userService";
import UserResultsSection from "./_components/UserResultsSection";

const PAGE_SIZE = 12;

export default function UsersPage() {
    const searchParams = useSearchParams();
    const type = searchParams.get("type") === "chefs" ? "chefs" : "popular";

    const [users, setUsers] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const requestIdRef = useRef(0);

    const pageCopy = useMemo(() => {
        if (type === "chefs") {
            return {
                title: "Certified Chefs",
                description: "Verified chefs sorted by follower count.",
            };
        }

        return {
            title: "Popular Users",
            description: "Community members sorted by follower count.",
        };
    }, [type]);

    const fetchUsers = useCallback(
        async ({ append = false, cursor = null } = {}) => {
            const requestId = ++requestIdRef.current;
            setLoading(true);
            setError("");

            try {
                const fetchFn = type === "chefs" ? getCertifiedChefs : getPopularUsers;
                const response = await fetchFn(append ? cursor : null, PAGE_SIZE);

                if (requestId !== requestIdRef.current) {
                    return;
                }

                const nextUsers = response.users || [];
                setUsers((previousUsers) => {
                    if (!append) {
                        return nextUsers;
                    }

                    const seen = new Set(previousUsers.map((user) => user.id));
                    const merged = [...previousUsers];
                    nextUsers.forEach((user) => {
                        if (!seen.has(user.id)) {
                            merged.push(user);
                        }
                    });
                    return merged;
                });

                setLastDoc(response.lastDoc || null);
                setHasMore(Boolean(response.lastDoc) && nextUsers.length === PAGE_SIZE);
            } catch (fetchError) {
                if (requestId === requestIdRef.current) {
                    setError(fetchError?.message || "Unable to load users right now.");
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                }
            }
        },
        [type]
    );

    useEffect(() => {
        setUsers([]);
        setLastDoc(null);
        setHasMore(false);
        fetchUsers({ append: false });
    }, [type, fetchUsers]);

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <UserResultsSection
                    title={pageCopy.title}
                    description={pageCopy.description}
                    users={users}
                    loading={loading}
                    error={error}
                    hasMore={hasMore}
                    onLoadMore={() => fetchUsers({ append: true, cursor: lastDoc })}
                />
            </main>
        </div>
    );
}
