"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAllAchievements, getUserAchievementProgress } from "@/lib/db/achievementService";
import { Button } from "@/components/ui/button";
import AchievementSection from "./_components/AchievementSection";
import FilterSidebar from "./_components/FilterSidebar";
import Navbar from "@/components/Navbar";

/** Tab options for the status filter */
const STATUS_TABS = [
    { key: "all", label: "All Achievements" },
    { key: "completed", label: "Completed" },
    { key: "uncompleted", label: "Uncompleted" },
];

export default function AchievementsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // --- Data state ---
    const [achievements, setAchievements] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [loading, setLoading] = useState(true);

    // --- Filter state ---
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState(new Set());

    // Redirect unauthenticated users
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login");
        }
    }, [authLoading, user, router]);

    // Fetch achievement definitions + user progress in parallel
    useEffect(() => {
        if (!user) return;

        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const [allAchievements, progress] = await Promise.all([
                    getAllAchievements(),
                    getUserAchievementProgress(user.uid),
                ]);
                if (!isMounted) return;
                setAchievements(allAchievements);
                setProgressMap(progress);
            } catch (err) {
                console.error("Failed to load achievements:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load();
        return () => { isMounted = false; };
    }, [user]);

    // --- Handlers for filter sidebar ---
    const handleCategoryChange = (category, checked) => {
        setSelectedCategories((prev) => {
            const next = new Set(prev);
            checked ? next.add(category) : next.delete(category);
            return next;
        });
    };

    // --- Derived data: filter then group ---
    const groupedAchievements = (() => {
        const lowerSearch = searchQuery.toLowerCase();

        const filtered = achievements.filter((a) => {
            // Tab filter
            const status = progressMap[a.id]?.status ?? null;
            if (activeTab === "completed" && status !== "completed") return false;
            if (activeTab === "uncompleted" && status === "completed") return false;

            // Search filter
            if (lowerSearch) {
                const matchesTitle = a.title?.toLowerCase().includes(lowerSearch);
                const matchesDesc = a.description?.toLowerCase().includes(lowerSearch);
                if (!matchesTitle && !matchesDesc) return false;
            }

            // Category filter
            if (selectedCategories.size > 0 && !selectedCategories.has(a.category)) return false;

            return true;
        });

        // Group into { [category]: achievement[] }
        return filtered.reduce((groups, achievement) => {
            const cat = achievement.category || "Other";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(achievement);
            return groups;
        }, {});
    })();

    const categoryKeys = Object.keys(groupedAchievements);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-muted/30">
                <Navbar />
                <main className="mx-auto max-w-7xl px-4 py-8">
                    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                        Loading achievements...
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-8">
            {/* Page header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Achievements</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Track your cooking journey and earn badges for your accomplishments
                </p>
            </div>

            {/* Status tabs */}
            <div className="flex gap-2 mb-6">
                {STATUS_TABS.map(({ key, label }) => (
                    <Button
                        key={key}
                        variant={activeTab === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab(key)}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            {/* Main content: sections + sidebar */}
            <div className="flex items-start gap-6">
                {/* Achievement sections */}
                <div className="flex-1 space-y-10 min-w-0">
                    {categoryKeys.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No achievements match your filters.</p>
                    ) : (
                        categoryKeys.map((category) => (
                            <AchievementSection
                                key={category}
                                category={category}
                                achievements={groupedAchievements[category]}
                                progressMap={progressMap}
                            />
                        ))
                    )}
                </div>

                {/* Filter sidebar */}
                <FilterSidebar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedCategories={selectedCategories}
                    onCategoryChange={handleCategoryChange}
                />
            </div>
        </main>
        </div>
    );
}
