# Kueru

**A social recipe-sharing platform where home cooks and professional chefs connect, share recipes, and grow through a gamified community.**

Kueru is a full-stack web application built with Next.js and Firebase. It combines a social network, a discussion forum, AI-powered recipe creation, a gamification engine, and a complete admin/moderation back office into a single production-deployed product.

**Live site:** [kueru.org](https://kueru.org/)

> Built as part of NUS IS3108. Stack: **Next.js 16 (App Router) · React 19 · Firebase · Vertex AI (Gemini) · shadcn/ui · Tailwind CSS v4**
>
> The application source lives in the [`kueru/`](kueru/) directory.

---

## Key Features

### Accounts & Social
- Email/password **authentication** with password reset and a guided **onboarding** flow (dietary preferences, allergies, cooking skill, interests).
- **User profiles** with bios, avatars, follower/following counts, and created/saved recipes.
- **Follow system** and user discovery.
- **Chef verification** — users upload credentials (license, certificate, ID) for admin review and earn a verified badge.

### Recipes
- Create recipes **manually** or **automatically from a cooking video** using Vertex AI (Gemini) — the model returns a fully structured recipe (ingredients, per-step ingredient maps, timing, allergen/cuisine tags) via a constrained JSON schema.
- Browse via **Discover**, **Find**, and a personalized **For You** feed driven by the user's onboarding preferences.
- Per-step cooking guides, image galleries, upvotes, and saves.

### Community Forum
- **Discussion** and **Recipe** post types with categories, media, and embedded video.
- **Nested comments** with replies, voting, and per-thread permalink pages.
- **Save**, **hide** (persisted per-user), and **report** posts.
- A **reporting & moderation** pipeline with predefined reasons that feeds the admin dashboard.
- Soft-deletion of comments (`[Comment deleted]`) so discussion threads stay intact.

### Gamification
- **Achievements engine** supporting five tracking strategies — `count`, `unique_count`, `exact_match`, `streak`, and `weekly_streak` — via a pluggable handler pattern.
- **Community challenges** with progress tracking and participant counts.
- Real-time **notifications** (follows, upvotes, comments, achievement unlocks, verification results) with a live unread badge.

### Admin Back Office
- Dedicated admin area (separate route group + login) for managing **users, recipes, forum posts, reports, chef verifications, achievements, and challenges**, plus a stats **dashboard**.
- All privileged mutations run through **server-side API routes** protected by Firebase Admin SDK token verification and a role check.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, RSC), React 19 |
| **Language** | JavaScript (JSX) |
| **Styling** | Tailwind CSS v4, shadcn/ui (`radix-nova` style, Radix UI primitives) |
| **Icons** | Tabler Icons |
| **Backend / Data** | Firebase Firestore, Firebase Authentication, Firebase Storage |
| **Privileged backend** | Next.js Route Handlers + Firebase Admin SDK |
| **AI** | Firebase Vertex AI — Gemini 2.5 Pro with structured (schema-constrained) output |
| **Hosting** | Firebase App Hosting (region: `asia-southeast1`) |
| **Notable libs** | Sonner (toasts), Embla Carousel, react-dropzone, next-themes |

---

## Architecture

Kueru uses a **hybrid client/server data model**:

- **Client-side service layer** (`kueru/lib/db/*`) — 20+ focused modules (`recipeService`, `forumService`, `commentService`, `voteService`, `notificationService`, …) talk directly to Firestore from the browser for normal user operations.
- **Server-side admin API** (`kueru/app/api/admin/*`) — sensitive/privileged operations (moderation, user management, stats aggregation) run as Next.js Route Handlers using the **Firebase Admin SDK**. Every request passes through [`verifyAdminRequest`](kueru/lib/api/adminAuthMiddleware.js), which validates the caller's Firebase ID token and confirms `role === 'admin'`.
- **Real-time auth context** ([`AuthContext`](kueru/context/AuthContext.jsx)) — subscribes to the signed-in user's Firestore document with `onSnapshot`, so role/onboarding/disabled-status changes propagate instantly (e.g. an admin disabling an account immediately forces sign-out).
- **Route groups** isolate concerns and layouts: `(auth)`, `(onboarding)`, `(forum)`, `(admin)`, and `(admin-public)`.
- **Gamification handlers** ([`lib/achievements`](kueru/lib/achievements/)) implement a strategy/handler pattern so new achievement types can be added without touching the core tracking loop.

```
Browser (React/Next.js)
   │
   ├─ lib/db/*  ───────────────►  Firestore / Auth / Storage   (Security Rules)
   │                                     ▲
   ├─ lib/ai/*  ───────────────►  Vertex AI (Gemini)           video → structured recipe
   │
   └─ app/api/admin/*  ────────►  Firebase Admin SDK           (Bearer token + role check)
```

---

## Project Structure

```
kueru/
├── app/
│   ├── (auth)/            # login, register, forgot-password
│   ├── (onboarding)/      # first-run preference capture
│   ├── (forum)/           # forum feed, post details, comment threads, create
│   ├── (admin)/           # protected admin dashboard & management pages
│   ├── (admin-public)/    # admin login (unprotected)
│   ├── achievements/      # achievements browsing & detail
│   ├── challenges/        # community challenges
│   ├── recipes/           # discover, find, for-you, detail, create
│   ├── profile/           # profiles, edit, connections, chef verification
│   ├── users/             # discovery & notifications
│   ├── settings/          # account, preferences, activities
│   ├── api/admin/         # server-side admin Route Handlers
│   ├── layout.js          # root layout (AuthProvider + Toaster)
│   └── page.js            # marketing landing page
├── components/
│   ├── ui/                # shadcn/ui primitives
│   └── *.jsx              # shared app components (Navbar, RecipeCard, dialogs…)
├── context/               # AuthContext (real-time session + user doc)
├── lib/
│   ├── db/                # Firestore service layer (client + admin services)
│   ├── ai/                # Vertex AI recipe converter
│   ├── api/               # admin auth middleware & fetch helpers
│   ├── achievements/      # gamification tracking engine
│   └── firebase/          # client config, admin (backend) config, auth helpers
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
├── firestore.indexes.json # composite indexes
└── firebase.json          # Firestore/Storage/App Hosting/emulator config
```

---

*Disclamer* Setting up the source code includes creating your own firebase account with its api key. There is no guarentee that the code will work the same. Use the hosted site link for the best accurate representation. 

# Hosted Site Link
https://kueru.org/

# Setting Up Instruction 
- cd to `kueru` folder 
- install firebase cli
    - `npm install -g firebase-tools`
    - `firebase login`
- run `npm install` to download dependencies
- create a new firebase project 
- initialise app hosting, firestore, cloud storage, authentication, AI logic Vertex API
- Put firebase config under environmental variables under app hosting 
    - NEXT_PUBLIC_FIREBASE_API_KEY = "your_key"
    - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "your_key"
    - NEXT_PUBLIC_FIREBASE_PROJECT_ID = "your_key"
    - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "your_key"
    - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "your_key"
    - NEXT_PUBLIC_FIREBASE_APP_ID = "your_key"
    - NEXT_PUBLIC_MEASUREMENT_ID = "your_key"
    - FIREBASE_PRIVATE_KEY = "your_key"
    - FIREBASE_CLIENT_EMAIL = "your_key"
- run `firebase deploy` to deploy the code 
- to create an administrator account 
    - create a user manually through firebase 
    - alternatively, create a user through the production site, go to firebase to change the role of user to `admin`

---

## Local Development

The project is wired for the **Firebase Emulator Suite**, so you can develop without touching production data. [`config.js`](kueru/lib/firebase/config.js) automatically connects to local emulators when `NODE_ENV === "development"`.

```bash
# from the kueru/ directory

# 1. Install dependencies
npm install

# 2. Start the Firebase emulators (Firestore, Auth, Storage, App Hosting UI)
firebase emulators:start

# 3. In a second terminal, run the Next.js dev server
npm run dev
```

Default emulator ports (see [`firebase.json`](kueru/firebase.json)): Firestore `8080`, Auth `9099`, Storage `9199`, App Hosting `5002`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Data Model

Kueru's Firestore is organized around the following top-level collections:

| Collection | Purpose |
|-----------|---------|
| `users` | Profiles, roles, onboarding prefs, saved/hidden posts, follower counts. Has a `userAchievements` subcollection for per-user progress. |
| `recipes` | Recipe content — ingredients, per-step ingredient maps, tags, servings, timing, upvotes/saves. |
| `forum_posts` | Discussion & Recipe posts (title, body, category, media, vote/comment counts, status). |
| `comments` | Nested comments/replies (`parentCommentId`), soft-deletable. |
| `post_votes` | One document per user/target vote, enabling upvote/downvote toggling for posts **and** comments. |
| `follows` | Follower → following edges. |
| `notifications` | Per-recipient activity feed with read/unread state. |
| `reports` | Moderation reports across multiple target types (`post`, `recipe`, `comment`, `user`) with reason + status. |
| `verification_requests` | Chef verification submissions and their review state. |
| `achievements` / `userChallenges` | Gamification definitions and per-user challenge participation. |

---

## Engineering Highlights

A few decisions worth calling out for anyone reading the code:

- **AI with guaranteed structure** — instead of free-form prompting, the recipe converter ([`vertexRecipeConverter.js`](kueru/lib/ai/vertexRecipeConverter.js)) supplies Gemini a `responseSchema`, constraining the model to a strict ingredient/step shape and a whitelist of measurement units, so the output drops straight into Firestore without fragile parsing.
- **Defensive Firestore writes** — counters and cross-document updates (vote tallies, comment counts, report flags) check that the target document still exists before issuing `increment`/`update`, preventing crashes when content is deleted mid-action.
- **Soft vs. hard deletion** — comments are soft-deleted (content nulled, `deleted: true`) so reply threads remain readable, while posts hard-delete; UI components gracefully render `[deleted]` placeholders for missing posts, recipes, and comments.
- **Efficient batch reads** — saved/hidden posts and report enrichment fetch documents in batched `documentId() in` / `getAll(...)` queries (chunked to Firestore limits) instead of N round-trips.
- **Real-time everywhere it matters** — unread notification badges and account status use Firestore `onSnapshot` listeners rather than polling.
- **Server-authoritative sorting & pagination** — the forum feed sorts and paginates via Firestore (`orderBy` + cursor `startAfter`) so "load more" stays consistent across sort modes.

---

## Security

- **Server-guarded admin actions** — privileged operations are exposed only through server-side Route Handlers, each passing through [`verifyAdminRequest`](kueru/lib/api/adminAuthMiddleware.js), which verifies the caller's Firebase ID token with the Admin SDK and confirms an `admin` role before acting.
- **Real-time session enforcement** — Firebase Auth manages sessions, and the signed-in user's profile is streamed via `onSnapshot`, so account-status changes (e.g. an admin disabling an account) take effect immediately.
- **Environment-scoped secrets** — public `NEXT_PUBLIC_*` client config is kept separate from server-only Admin SDK credentials (`FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`).

---

## Roadmap & Future Enhancements

- Dedicated full-text search index (e.g. Algolia/Typesense) for richer, server-side recipe and forum discovery.
- Automated test suite (unit + integration) to support continuous delivery.
- Continued UI/UX polish and performance optimisation.
