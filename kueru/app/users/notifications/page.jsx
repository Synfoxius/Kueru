"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    IconBell, IconBellOff, IconCheck,
    IconUserPlus, IconThumbUp, IconMessageCircle, IconAward,
} from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { getNotifications, markNotificationRead, markAllRead } from "@/lib/db/notificationService";
import { getUser } from "@/lib/db/userService";

import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(username = "") {
    if (!username) return "";
    const parts = username.trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : username.slice(0, 2).toUpperCase();
}

const TYPE_META = {
    follow:                 { icon: IconUserPlus,      color: "text-primary",         label: (s) => `${s} started following you`,                                                        getUrl: (_n, sender) => sender ? `/profile/${sender.username}` : null },
    post_upvote:            { icon: IconThumbUp,        color: "text-amber-500",       label: (s, n) => `${s} upvoted your post "${n.postTitle ?? 'a post'}"`,                           getUrl: (n) => n.targetId ? `/forum/${n.targetId}` : null },
    comment_upvote:         { icon: IconThumbUp,        color: "text-amber-500",       label: (s, n) => `${s} upvoted your comment on "${n.postTitle ?? 'a post'}"`,                     getUrl: (n) => n.postId && n.targetId ? `/forum/${n.postId}#comment-${n.targetId}` : (n.targetId ? `/forum/${n.targetId}` : null) },
    comment:                { icon: IconMessageCircle,  color: "text-blue-500",        label: (s, n) => `${s} commented on "${n.postTitle ?? 'your post'}"`,                          getUrl: (n) => n.targetId ? `/forum/${n.targetId}` : null },
    recipe_upvote:          { icon: IconThumbUp,        color: "text-amber-500",       label: (s, n) => `${s} upvoted your recipe "${n.recipeName ?? 'a recipe'}"`,                      getUrl: (n) => n.targetId ? `/recipes/${n.targetId}` : null },
    verification_approved:  { icon: IconAward,          color: "text-green-500",       label: () => "Your chef verification was approved!",                                                getUrl: () => '/profile/edit' },
    verification_rejected:  { icon: IconAward,          color: "text-destructive",     label: () => "Your chef verification was not approved.",                                            getUrl: () => '/profile/edit' },
};

function timeAgo(ts) {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 60) return "just now";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [senderMap, setSenderMap] = useState({});
    const [pageLoading, setPageLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [markingAll, setMarkingAll] = useState(false);

    // Fetch sender profiles for any senderIds not yet in the map
    const fetchNewSenders = useCallback(async (notifs, existingMap) => {
        const newIds = [...new Set(notifs.map(n => n.senderId).filter(id => id && !existingMap[id]))];
        if (newIds.length === 0) return existingMap;
        const profiles = await Promise.all(newIds.map(id => getUser(id)));
        const updated = { ...existingMap };
        profiles.forEach((p, i) => { if (p) updated[newIds[i]] = p; });
        return updated;
    }, []);

    const loadNotifications = useCallback(async () => {
        if (!user) return;
        setPageLoading(true);
        const { notifications: notifs, lastDoc: cursor, hasMore: more } = await getNotifications(user.uid);
        setNotifications(notifs);
        setLastDoc(cursor);
        setHasMore(more);

        const map = await fetchNewSenders(notifs, {});
        setSenderMap(map);
        setPageLoading(false);
    }, [user, fetchNewSenders]);

    const loadMore = async () => {
        if (!user || !lastDoc || loadingMore) return;
        setLoadingMore(true);
        const { notifications: more, lastDoc: cursor, hasMore: stillMore } = await getNotifications(user.uid, lastDoc);
        setNotifications(prev => [...prev, ...more]);
        setLastDoc(cursor);
        setHasMore(stillMore);
        const updated = await fetchNewSenders(more, senderMap);
        setSenderMap(updated);
        setLoadingMore(false);
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push("/login"); return; }
        loadNotifications();
    }, [authLoading, user, loadNotifications, router]);

    const handleMarkRead = async (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        await markNotificationRead(id);
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await markAllRead(user.uid);
        setMarkingAll(false);
    };

    if (authLoading || pageLoading) {
        return (
            <>
                <ConditionalNavbar />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm">
                    Loading...
                </div>
            </>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <title>Notifications | Kueru</title>
            <ConditionalNavbar />
            <main className="mx-auto w-full max-w-2xl px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <IconBell className="size-6 text-foreground" />
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-white">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllRead}
                            disabled={markingAll}
                            className="gap-1.5 text-xs"
                        >
                            <IconCheck className="size-3.5" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                <Separator className="mb-4" />

                {/* Notification list */}
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
                        <IconBellOff className="size-12" strokeWidth={1.2} />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <>
                        <ul className="space-y-1">
                            {notifications.map((notif) => {
                                const meta = TYPE_META[notif.type] ?? TYPE_META.follow;
                                const Icon = meta.icon;
                                const sender = notif.senderId ? senderMap[notif.senderId] : null;
                                const senderName = sender?.username ?? "Someone";
                                const message = meta.label(senderName, notif);

                                const url = meta.getUrl?.(notif, sender) ?? null;

                                return (
                                    <li key={notif.id}>
                                        <button
                                            className={`w-full flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/60 ${!notif.read ? "bg-primary/5" : ""}`}
                                            onClick={async () => {
                                                if (!notif.read) await handleMarkRead(notif.id);
                                                if (url) router.push(url);
                                            }}
                                        >
                                            {/* Sender avatar or system icon */}
                                            <div className="relative shrink-0 mt-0.5">
                                                {sender ? (
                                                    <Avatar className="size-10">
                                                        {sender.profileImage
                                                            ? <AvatarImage src={sender.profileImage} alt={sender.username} />
                                                            : null}
                                                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                                                            {getInitials(sender.username)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ) : (
                                                    <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                                                        <Icon className={`size-5 ${meta.color}`} />
                                                    </div>
                                                )}
                                                {sender && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-background ring-1 ring-border">
                                                        <Icon className={`size-2.5 ${meta.color}`} />
                                                    </span>
                                                )}
                                            </div>

                                            {/* Message + time */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-snug ${!notif.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                                    {message}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {timeAgo(notif.createdAt)}
                                                </p>
                                            </div>

                                            {/* Unread dot */}
                                            {!notif.read && (
                                                <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Load more */}
                        {hasMore && (
                            <div className="mt-4 flex justify-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? "Loading..." : "Load more"}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </>
    );
}
