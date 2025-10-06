# 🧩 Community Feature + Username System Plan

A plan for implementing a simple, Slack-like community feature inside your **Next.js + Supabase** app Prompt Reviews, along with a streamlined username system that avoids collisions and guessable names. 

Phase 2 feature to be able to share a Monthly summary of reviews.

---

## 1. Overview

The goal is to provide a lightweight community space for users to share posts, comment, and react—without the complexity of direct messaging, deep threads, or image previews.  
Users will have clear identities (first name + business) but unique, non-guessable handles. Users do not need to participate if they don't want to.

---

## 2. Core Community Concept

### MVP Features
- Link to community in main nav
- 3 static **channels** (e.g., General, Strategy, Google-Business, Promote)
- **Posts**: text-only, optional link field. Editable/deleteable by user who posted or admin.
- **Comments** under each post. Editable/deleteable by user who posted or admin.
- **Reactions**: icon options (`thumbs up, star, celebrate, clap, laugh`)
- **Auth required** to post/comment/react
- **No image uploads or previews**
- **Realtime updates** (optional) via Supabase Realtime
Use @ symbol to tag user in a post or comment

---

## 3. Database Schema

### Channels
```sql
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamptz default now()
);