import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    getRecipeInteractionState,
    setRecipeVote,
    toggleRecipeSaved,
} from "../_utils/recipeInteractionsClient";

export const useRecipeInteractions = ({ recipeId, initialUpvotes = 0, initialSaved = 0, shareTitle = "Recipe" }) => {
    const { user } = useAuth();
    const pathname = usePathname();

    const [upvotes, setUpvotes] = useState(Number(initialUpvotes) || 0);
    const [savedCount, setSavedCount] = useState(Number(initialSaved) || 0);
    const [voteValue, setVoteValue] = useState(0);
    const [hasSaved, setHasSaved] = useState(false);
    const [isWorking, setIsWorking] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    useEffect(() => {
        setUpvotes(Number(initialUpvotes) || 0);
    }, [initialUpvotes]);

    useEffect(() => {
        setSavedCount(Number(initialSaved) || 0);
    }, [initialSaved]);

    useEffect(() => {
        let isMounted = true;

        const loadState = async () => {
            if (!user?.uid || !recipeId) {
                if (isMounted) {
                    setVoteValue(0);
                    setHasSaved(false);
                }
                return;
            }

            try {
                const state = await getRecipeInteractionState(user.uid, recipeId);
                if (!isMounted) {
                    return;
                }
                setVoteValue(Number(state.voteValue) || 0);
                setHasSaved(state.hasSaved);
            } catch {
                if (isMounted) {
                    setFeedback("Unable to sync your vote/save status right now.");
                }
            }
        };

        loadState();

        return () => {
            isMounted = false;
        };
    }, [recipeId, user?.uid]);

    const loginHref = useMemo(() => {
        const target = pathname || "/recipes/discover";
        return `/login?returnTo=${encodeURIComponent(target)}`;
    }, [pathname]);

    const ensureAuthenticated = useCallback(() => {
        if (!user?.uid) {
            setShowLoginDialog(true);
            return false;
        }

        return true;
    }, [user?.uid]);

    const onVote = useCallback(async (requestedVoteValue) => {
        if (!ensureAuthenticated() || !recipeId || !user?.uid) {
            return;
        }

        setIsWorking(true);
        setFeedback("");

        try {
            const result = await setRecipeVote(user.uid, recipeId, requestedVoteValue);
            setVoteValue(result.voteValue);
            setUpvotes((previous) => previous + result.upvoteDelta);
        } catch (error) {
            setFeedback(error?.message || "Unable to update vote right now.");
        } finally {
            setIsWorking(false);
        }
    }, [ensureAuthenticated, recipeId, user?.uid]);

    const onUpvote = useCallback(() => onVote(1), [onVote]);
    const onDownvote = useCallback(() => onVote(-1), [onVote]);

    const onSave = useCallback(async () => {
        if (!ensureAuthenticated() || !recipeId || !user?.uid) {
            return;
        }

        setIsWorking(true);
        setFeedback("");

        try {
            const result = await toggleRecipeSaved(user.uid, recipeId);
            setHasSaved(result.hasSaved);
            setSavedCount((previous) => Math.max(0, previous + result.savedDelta));
        } catch (error) {
            setFeedback(error?.message || "Unable to update saved recipes right now.");
        } finally {
            setIsWorking(false);
        }
    }, [ensureAuthenticated, recipeId, user?.uid]);

    const onShare = useCallback(async () => {
        if (!ensureAuthenticated()) {
            return;
        }

        setIsWorking(true);
        setFeedback("");

        try {
            const url = window.location.href;
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    url,
                });
                setFeedback("Recipe link shared.");
                return;
            }

            await navigator.clipboard.writeText(url);
            setFeedback("Recipe link copied to clipboard.");
        } catch (error) {
            const isAbortError = error?.name === "AbortError";
            if (!isAbortError) {
                setFeedback("Unable to share this recipe right now.");
            }
        } finally {
            setIsWorking(false);
        }
    }, [ensureAuthenticated, shareTitle]);

    return {
        upvotes,
        savedCount,
        voteValue,
        hasSaved,
        isWorking,
        feedback,
        showLoginDialog,
        setShowLoginDialog,
        loginHref,
        onUpvote,
        onDownvote,
        onSave,
        onShare,
    };
};
