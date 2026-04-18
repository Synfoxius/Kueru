"use client";

import { useEffect, useState } from "react";
import { getPostsByUser } from "@/lib/db/forumService";
import { getCommentsByUser } from "@/lib/db/commentService";
import PostCard from "@/app/(forum)/forum/_components/PostCard";
import UserCommentCard from "@/app/(forum)/forum/_components/UserCommentCard";
import { IconFileText, IconMessages } from "@tabler/icons-react";

const ALL_TABS = [
    { key: "posts", label: "Posts", icon: IconFileText },
    { key: "comments", label: "Comments", icon: IconMessages },
];

function UserPosts({ userId, hiddenPostIds = [] }) {
    const [activeTab, setActiveTab] = useState("posts");
    const [posts, setPosts] = useState([]);
    const [localHiddenIds, setLocalHiddenIds] = useState(hiddenPostIds);
    const [comments, setComments] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);

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

    const tabs = ALL_TABS;

    const isLoading = activeTab === "posts" ? loadingPosts : loadingComments;
    const isEmpty = activeTab === "posts" ? posts.length === 0 : comments.length === 0;

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
                    {activeTab === "posts" ? "No posts yet." : "No comments yet."}
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
                        />
                    ))}
                    {activeTab === "comments" && comments.map((comment) => <UserCommentCard key={comment.id} comment={comment} />)}
                </div>
            )}

        </div>
    );
}
export default UserPosts;
