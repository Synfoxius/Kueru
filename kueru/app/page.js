"use client";

import Link from "next/link";
import Image from "next/image";
import {
    IconUsers, IconBook, IconRosetteFilled,
    IconCircleCheckFilled, IconArrowRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import ConditionalNavbar from "@/components/ConditionalNavbar";

/* ── Section image ─────────────────────────────────────────── */
function SectionImage({ src, alt, className = "", aspectClass = "aspect-[4/3]" }) {
    return (
        <div className={`${aspectClass} ${className} rounded-2xl overflow-hidden relative`}>
            <Image src={src} alt={alt} fill className="object-cover" />
        </div>
    );
}

/* ── Feature card ───────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, description }) {
    return (
        <div className="rounded-2xl border border-primary/30 bg-background p-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="size-5 text-primary" />
            </div>
            <p className="font-bold text-base">{title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
}

const features = [
    {
        icon: IconUsers,
        title: "Connect with Food Lovers",
        description: "Join a vibrant community of home cooks and professional chefs from around the world",
    },
    {
        icon: IconBook,
        title: "Share Your Recipes",
        description: "Post your favorite recipes, cooking tips, and culinary creations with beautiful photos",
    },
    {
        icon: IconRosetteFilled,
        title: "Get Verified",
        description: "Professional chefs can get verified badges and access exclusive features",
    },
];

const perks = [
    "Personalized recipe recommendations based on your taste",
    "Save and organize your favorite recipes",
    "Follow your favorite chefs and home cooks",
    "Dietary preferences and allergy filters",
    "Step-by-step cooking guides",
    "Interactive cooking community",
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background font-sans">

            {/* ── Navbar ─────────────────────────────────────────── */}
            <ConditionalNavbar />

            {/* ── Hero ───────────────────────────────────────────── */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="flex flex-col-reverse md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-6">
                        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                            Your Culinary<br />Journey<br />Starts Here
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-sm">
                            Join Kueru, the social platform where food lovers share recipes, cooking tips, and culinary adventures.
                        </p>
                        <Button size="lg" className="gap-2 rounded-full px-7" asChild>
                            <Link href="/register">
                                Get Started Free <IconArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="flex-1 w-full">
                        <SectionImage src="/home1.jpg" alt="Culinary dish" aspectClass="aspect-[4/3]" className="w-full shadow-lg" />
                    </div>
                </div>
            </section>

            {/* ── Why Choose Kueru ───────────────────────────────── */}
            <section className="bg-muted/40 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl md:text-4xl font-extrabold">Why Choose Kueru?</h2>
                        <p className="text-muted-foreground">Everything you need to elevate your cooking game</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {features.map(f => <FeatureCard key={f.title} {...f} />)}
                    </div>
                </div>
            </section>

            {/* ── Everything in One Place ─────────────────────────── */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 w-full">
                        <SectionImage src="/home2.jpg" alt="Chef in kitchen" aspectClass="aspect-square" className="w-full max-w-sm md:max-w-full shadow-lg" />
                    </div>
                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
                            Everything You<br />Love About Food,<br />All in One Place
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Kueru brings together passionate cooks, professional chefs, and food enthusiasts in one vibrant community.
                        </p>
                        <ul className="space-y-3">
                            {perks.map(perk => (
                                <li key={perk} className="flex items-start gap-3 text-sm">
                                    <IconCircleCheckFilled className="size-5 text-primary shrink-0 mt-0.5" />
                                    <span>{perk}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── Community ──────────────────────────────────────── */}
            <section className="bg-muted/40 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-5">
                            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
                                Join a Thriving<br />Food Community
                            </h2>
                            <p className="text-muted-foreground leading-relaxed max-w-sm">
                                Connect with thousands of food lovers who share your passion for cooking. From beginners to professional chefs, everyone has a place at the table.
                            </p>
                        </div>
                        <div className="flex-1 w-full">
                            <SectionImage src="/home3.jpg" alt="Food community" aspectClass="aspect-video" className="w-full shadow-lg" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ─────────────────────────────────────── */}
            <section className="bg-primary py-20 md:py-28">
                <div className="mx-auto max-w-3xl px-4 text-center space-y-7">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground leading-tight">
                        Ready to Start Your Culinary Adventure?
                    </h2>
                    <p className="text-primary-foreground/80 text-lg">
                        Join Kueru today and discover a world of flavors, recipes, and inspiration
                    </p>
                    <Button
                        size="lg"
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-12 py-6 text-base rounded-xl"
                        asChild
                    >
                        <Link href="/register">Sign Up - It&apos;s Free!</Link>
                    </Button>
                    <p className="text-primary-foreground/70 text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="underline font-medium text-primary-foreground hover:text-primary-foreground/90">
                            Log in here
                        </Link>
                    </p>
                </div>
            </section>

        </div>
    );
}
