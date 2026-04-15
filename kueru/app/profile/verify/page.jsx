"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft, IconBriefcase, IconAward,
    IconWorld, IconFileDescription, IconUpload, IconFile, IconTrash,
} from "@tabler/icons-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase/config";

import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const inputClass = "border-primary/50 focus-visible:ring-primary/40";
const textareaClass = "w-full rounded-md border border-primary/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 resize-none";

const YEARS_OPTIONS = ["1-2", "3-5", "6-10", "11-15", "16-20", "20+"];

export default function ChefVerificationPage() {
    const { user } = useAuth();
    const router = useRouter();
    const docInputRef = useRef(null);

    // Professional Information
    const [legalName, setLegalName] = useState("");
    const [workplace, setWorkplace] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [yearsExp, setYearsExp] = useState("");

    // Education & Credentials
    const [culinarySchool, setCulinarySchool] = useState("");
    const [gradYear, setGradYear] = useState("");
    const [certifications, setCertifications] = useState("");

    // Professional Links
    const [website, setWebsite] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [instagram, setInstagram] = useState("");

    // Supporting Documents
    const [docFiles, setDocFiles] = useState([]);

    // Additional
    const [additionalInfo, setAdditionalInfo] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleDocChange = (e) => {
        const files = Array.from(e.target.files ?? []);
        setDocFiles(prev => [...prev, ...files]);
        e.target.value = "";
    };

    const removeDoc = (index) => {
        setDocFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!legalName || !workplace || !jobTitle || !yearsExp || docFiles.length === 0) {
            setError("Please fill in all required fields and upload at least one supporting document.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            // Upload documents
            const docUrls = await Promise.all(
                docFiles.map(async (file, i) => {
                    const storageRef = ref(storage, `verification-docs/${user.uid}/${Date.now()}_${i}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    return getDownloadURL(storageRef);
                })
            );

            await addDoc(collection(db, "verification_requests"), {
                userId: user.uid,
                status: "pending",
                submittedAt: serverTimestamp(),
                professional: { legalName, workplace, jobTitle, yearsExp },
                education: { culinarySchool, gradYear, certifications },
                links: { website, linkedin, instagram },
                documents: docUrls,
                additionalInfo,
            });

            router.push("/profile/edit?verified=pending");
        } catch {
            setError("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
                <div>
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Professional Chef Verification</h1>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <IconArrowLeft className="size-4" /> Back
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Please provide your professional credentials</p>
                </div>

                {/* Professional Information */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <IconBriefcase className="size-5 text-primary" />
                        <h2 className="text-lg font-bold">Professional Information</h2>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-semibold">
                            Full Legal Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            className={inputClass}
                            placeholder="As it appears on official documents"
                            value={legalName}
                            onChange={e => setLegalName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="font-semibold">
                            Current Workplace <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            className={inputClass}
                            placeholder="Restaurant, hotel, or catering company name"
                            value={workplace}
                            onChange={e => setWorkplace(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-semibold">
                                Job Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                className={inputClass}
                                placeholder="e.g., Executive Chef"
                                value={jobTitle}
                                onChange={e => setJobTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-semibold">
                                Years of Experience <span className="text-destructive">*</span>
                            </Label>
                            <select
                                value={yearsExp}
                                onChange={e => setYearsExp(e.target.value)}
                                className="w-full h-9 rounded-md border border-primary/50 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                            >
                                <option value="" disabled>Select years</option>
                                {YEARS_OPTIONS.map(y => <option key={y} value={y}>{y} years</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                <Separator />

                {/* Education & Credentials */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <IconAward className="size-5 text-amber-500" />
                        <h2 className="text-lg font-bold">Education &amp; Credentials</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-semibold">Culinary School/Institution</Label>
                            <Input
                                className={inputClass}
                                placeholder="e.g., Le Cordon Bleu"
                                value={culinarySchool}
                                onChange={e => setCulinarySchool(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-semibold">Graduation Year</Label>
                            <Input
                                className={inputClass}
                                placeholder="YYYY"
                                maxLength={4}
                                value={gradYear}
                                onChange={e => setGradYear(e.target.value.replace(/\D/g, ""))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-semibold">Professional Certifications</Label>
                        <textarea
                            rows={3}
                            className={textareaClass}
                            placeholder="List any professional certifications (e.g., ServSafe, Sommelier, etc.)"
                            value={certifications}
                            onChange={e => setCertifications(e.target.value)}
                        />
                    </div>
                </section>

                <Separator />

                {/* Professional Links */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <IconWorld className="size-5 text-primary" />
                        <h2 className="text-lg font-bold">Professional Links</h2>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-semibold">Restaurant/Business Website</Label>
                        <Input
                            className={inputClass}
                            placeholder="https://"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-semibold">LinkedIn Profile</Label>
                            <Input
                                className={inputClass}
                                placeholder="https://linkedin.com/in/..."
                                value={linkedin}
                                onChange={e => setLinkedin(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-semibold">Professional Instagram</Label>
                            <Input
                                className={inputClass}
                                placeholder="@username"
                                value={instagram}
                                onChange={e => setInstagram(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                <Separator />

                {/* Supporting Documents */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <IconFileDescription className="size-5 text-primary" />
                        <h2 className="text-lg font-bold">
                            Supporting Documents <span className="text-destructive">*</span>
                        </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Please upload proof of your professional credentials (diplomas, certificates, employment letter, etc.)
                    </p>

                    {/* Drop zone */}
                    <button
                        type="button"
                        onClick={() => docInputRef.current?.click()}
                        className="w-full rounded-xl border-2 border-dashed border-primary/50 py-10 flex flex-col items-center gap-3 hover:bg-primary/5 transition-colors"
                    >
                        <IconUpload className="size-8 text-primary" />
                        <span className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2 rounded-lg">
                            Upload Documents
                        </span>
                        <span className="text-xs text-muted-foreground">PDF, JPG, PNG. Max 10MB per file.</span>
                    </button>
                    <input
                        ref={docInputRef}
                        type="file"
                        multiple
                        accept=".pdf,image/jpeg,image/png"
                        className="hidden"
                        onChange={handleDocChange}
                    />

                    {/* File list */}
                    {docFiles.length > 0 && (
                        <ul className="space-y-2">
                            {docFiles.map((file, i) => (
                                <li key={i} className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <IconFile className="size-4 shrink-0 text-muted-foreground" />
                                        <span className="truncate">{file.name}</span>
                                    </div>
                                    <button onClick={() => removeDoc(i)} className="ml-2 text-muted-foreground hover:text-destructive shrink-0">
                                        <IconTrash className="size-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <Separator />

                {/* Additional Information */}
                <section className="space-y-2">
                    <Label className="font-semibold">Additional Information</Label>
                    <textarea
                        rows={4}
                        className={textareaClass}
                        placeholder="Any additional information that would help verify your professional chef status..."
                        value={additionalInfo}
                        onChange={e => setAdditionalInfo(e.target.value)}
                    />
                </section>

                {error && <p className="text-sm text-destructive">{error}</p>}

                {/* Footer actions */}
                <div className="flex gap-3 pb-8">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.back()}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? "Submitting..." : "Submit for Review"}
                    </Button>
                </div>

            </main>
        </>
    );
}
