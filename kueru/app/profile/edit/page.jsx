"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { IconCamera, IconUpload, IconShieldCheck, IconCircleCheck, IconArrowLeft } from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { updateUser, getUserByUsername } from "@/lib/db/userService";
import { storage, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { getInitials } from "@/app/profile/_components/getInitials";

import Navbar from "@/components/Navbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const BIO_MAX = 150;

export default function EditProfilePage() {
    const { user, userDoc, loading } = useAuth();
    const router = useRouter();

    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [verificationStatus, setVerificationStatus] = useState(null); // null | 'pending' | 'under_review' | 'rejected'
    const [rejectionReason, setRejectionReason] = useState("");

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (loading) return;
        if (!user) { router.push("/login"); return; }
        if (userDoc) {
            setDisplayName(userDoc.displayName ?? "");
            setUsername(userDoc.username ?? "");
            setBio(userDoc.bio ?? "");
            setImagePreview(userDoc.profileImage ?? null);
        }
        const q = query(
            collection(db, "verification_requests"),
            where("userId", "==", user.uid),
            where("status", "in", ["pending", "under_review", "rejected"]),
            limit(1)
        );
        getDocs(q).then(snap => {
            if (snap.empty) return;
            const data = snap.docs[0].data();
            setVerificationStatus(data.status);
            if (data.status === "rejected") setRejectionReason(data.rejectionReason ?? "");
        });
    }, [loading, user, userDoc, router]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        setError("");
        setSaving(true);
        try {
            if (username !== userDoc?.username) {
                const existing = await getUserByUsername(username);
                if (existing) {
                    setError("That username is already taken.");
                    setSaving(false);
                    return;
                }
            }

            let profileImage = userDoc?.profileImage ?? "";
            if (imageFile) {
                const storageRef = ref(storage, `profile-images/${user.uid}`);
                await uploadBytes(storageRef, imageFile);
                profileImage = await getDownloadURL(storageRef);
            }

            await updateUser(user.uid, { displayName, username, bio, profileImage });
            setSaved(true);
        } catch {
            setError("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
                    Loading...
                </div>
            </>
        );
    }

    return (
        <>
            <title>Edit Profile | Kueru</title>
            <Navbar />
            <main className="w-full px-8 sm:px-12 lg:px-20 py-8 space-y-6">

                {/* Page heading */}
                <div>
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Edit Profile</h1>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <IconArrowLeft className="size-4" /> Back
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Update your profile information and settings</p>
                </div>

                {/* Profile Picture */}
                <section className="space-y-3">
                    <Label className="text-sm font-semibold">Profile Picture</Label>
                    <div className="flex items-center gap-5">
                        <div
                            className="relative cursor-pointer shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Avatar className="size-24 text-2xl font-bold">
                                {imagePreview
                                    ? <AvatarImage src={imagePreview} alt={username} />
                                    : null}
                                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                                    {getInitials(username)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 rounded-full bg-amber-500 p-1.5 shadow">
                                <IconCamera className="size-3.5 text-white" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Button
                                type="button"
                                size="sm"
                                className="gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <IconUpload className="size-4" /> Upload New Photo
                            </Button>
                            <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB.</p>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        className="hidden"
                        onChange={handleImageChange}
                    />
                </section>

                <Separator />

                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-sm font-semibold">Full Name</Label>
                    <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your full name"
                    />
                </div>

                {/* Username */}
                <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
                    <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <span className="pl-3 text-sm text-muted-foreground select-none">@</span>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                            placeholder="username"
                            className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-1"
                        />
                    </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-semibold">Bio</Label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                        rows={4}
                        placeholder="Tell people about yourself..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">{bio.length} / {BIO_MAX} characters</p>
                </div>

                <Separator />

                {/* Verify as Professional Chef */}
                <div className="rounded-xl border border-amber-400 bg-amber-50/50 p-5 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-amber-100 p-2 shrink-0">
                            <IconShieldCheck className="size-5 text-amber-600" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="font-semibold text-sm">Professional Chef Verification</p>

                            {/* Already verified */}
                            {userDoc?.verified ? (
                                <p className="text-xs text-amber-700 font-medium">
                                    You are a verified chef.
                                </p>
                            ) : verificationStatus === "pending" || verificationStatus === "under_review" ? (
                                /* Pending / under review */
                                <p className="text-xs text-amber-700 font-medium">
                                    Request received. Outcome will be released after 3–5 working days.
                                </p>
                            ) : verificationStatus === "rejected" ? (
                                /* Rejected — show reason + allow re-submit */
                                <>
                                    <p className="text-xs text-destructive font-medium">Your verification request was not approved.</p>
                                    {rejectionReason && (
                                        <p className="text-xs text-muted-foreground mt-1">Reason: {rejectionReason}</p>
                                    )}
                                    <div className="mt-2">
                                        <Button
                                            size="sm"
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                                            onClick={() => router.push("/profile/verify")}
                                        >
                                            Submit New Request
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                /* No request yet */
                                <>
                                    <p className="text-xs text-muted-foreground">
                                        Get a verified badge to show you&apos;re a professional chef.
                                    </p>
                                    <ul className="mt-1 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                                        <li>Professional chef badge on your profile</li>
                                        <li>Priority in search results</li>
                                    </ul>
                                    <div className="mt-2">
                                        <Button
                                            size="sm"
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                                            onClick={() => router.push("/profile/verify")}
                                        >
                                            Request Verification
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error / Success */}
                {error && <p className="text-sm text-destructive">{error}</p>}
                {saved && (
                    <p className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                        <IconCircleCheck className="size-4" /> Profile saved successfully
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button
                        className="flex-1"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                </div>

            </main>
        </>
    );
}
