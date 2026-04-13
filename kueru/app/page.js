"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-background px-16 py-32 sm:items-start">
        <Image
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <Card className="w-full max-w-2xl border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-10 pt-2">
            <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
              <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-foreground">
                To get started, edit the page.js file.
              </h1>
              <p className="max-w-md text-lg leading-8 text-muted-foreground">
                Looking for a starting point or more instructions? Head over to{" "}
                <a
                  href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  className="font-semibold text-primary transition-colors hover:text-accent"
                >
                  Templates
                </a>{" "}
                or the{" "}
                <a
                  href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  className="font-semibold text-secondary transition-colors hover:text-accent"
                >
                  Learning
                </a>{" "}
                center.
              </p>
            </div>
            <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
              <a
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:w-[158px]"
                href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/vercel.svg"
                  alt="Vercel logomark"
                  width={16}
                  height={16}
                />
                Deploy Now
              </a>
              <a
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-secondary bg-background px-5 text-secondary transition-colors hover:bg-secondary hover:text-secondary-foreground md:w-[158px]"
                href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
