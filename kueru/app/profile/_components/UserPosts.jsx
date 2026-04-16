"use client";

import { useEffect, useState } from "react";
import { getPostsByUser, getPostsByIds } from "@/lib/db/forumService";
import { getCommentsByUser } from "@/lib/db/commentService";
import PostCard from "@/app/(forum)/forum/_components/PostCard";
import UserCommentCard from "@/app/(forum)/forum/_components/UserCommentCard";
import { IconFileText, IconMessages, IconBookmark } from "@tabler/icons-react";

const ALL_TABS = [
    { key: "posts", label: "Posts", icon: IconFileText },
    { key: "comments", label: "Comments", icon: IconMessages },
    { key: "saved", label: "Saved", icon: IconBookmark },
];

function UserPosts({ userId, savedPostsId, hiddenPostIds = [], isOwnProfile = false }) {
    const [activeTab, setActiveTab] = useState("posts");
    const [posts, setPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [localHiddenIds, setLocalHiddenIds] = useState(hiddenPostIds);
    const [comments, setComments] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);
    const [loadingSaved, setLoadingSaved] = useState(true);

    useEffect(() => {
        if (!userId) { return; }
        getPostsByUser(userId)
            .then(({ posts }) => setPosts(posts))
            .finally(() => setLoadingPosts(false));
    }, [userId]);

    useEffect(() => {
        if (!userId) { return; }
        getCommentsByUser(userId)
            .then(setComments)
            .finally(() => setLoadingComments(false));
    }, [userId]);

    useEffect(() => {
        if (!userId) { return; }
        if (!savedPostsId?.length) { setLoadingSaved(false); return; }
        getPostsByIds(savedPostsId)
            .then(setSavedPosts)
            .finally(() => setLoadingSaved(false));
    }, [userId, savedPostsId]);

    const tabs = isOwnProfile ? ALL_TABS : ALL_TABS.filter((t) => t.key !== "saved");

    const isLoading = activeTab === "posts" ? loadingPosts : activeTab === "comments" ? loadingComments : loadingSaved;
    const isEmpty = activeTab === "posts" ? posts.length === 0 : activeTab === "comments" ? comments.length === 0 : savedPosts.length === 0;

    return (
        <div className="flex flex-col gap-4">

            <div className="flex border-b border-border">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                            activeTab === key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Icon className="size-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
            ) : isEmpty ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                    {activeTab === "posts" ? "No posts yet." : activeTab === "comments" ? "No comments yet." : "No saved posts yet."}
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    {activeTab === "posts" && posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isHidden={localHiddenIds.includes(post.id)}
                            onDeleted={(postId) => setPosts((prev) => prev.filter((p) => p.id !== postId))}
                            onHidden={(postId) => setLocalHiddenIds((prev) => [...prev, postId])}
                            onUnhidden={(postId) => setLocalHiddenIds((prev) => prev.filter((id) => id !== postId))}
                            onSaved={(p) => setSavedPosts((prev) => prev.some((s) => s.id === p.id) ? prev : [p, ...prev])}
                            onUnsaved={(postId) => setSavedPosts((prev) => prev.filter((s) => s.id !== postId))}
                        />
                    ))}
                    {activeTab === "comments" && comments.map((comment) => <UserCommentCard key={comment.id} comment={comment} />)}
                    {activeTab === "saved" && savedPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isHidden={localHiddenIds.includes(post.id)}
                            onDeleted={(postId) => setSavedPosts((prev) => prev.filter((p) => p.id !== postId))}
                            onHidden={(postId) => setLocalHiddenIds((prev) => [...prev, postId])}
                            onUnhidden={(postId) => setLocalHiddenIds((prev) => prev.filter((id) => id !== postId))}
                            onUnsaved={(postId) => setSavedPosts((prev) => prev.filter((p) => p.id !== postId))}
                        />
                    ))}
                </div>
            )}

        </div>
    );
}
export default UserPosts;
