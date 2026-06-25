create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    name text not null,
    dob date not null,
    picture text,
    current_study text,
    skills text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists current_study text;

alter table public.profiles
add column if not exists skills text[] not null default '{}';

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Authenticated users can read profiles" on public.profiles;

create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.posts (
    id bigint generated always as identity primary key,
    user_id uuid not null,
    email text not null,
    content text not null default '',
    photo text,
    created_at timestamptz not null default now()
);

alter table public.posts
drop constraint if exists posts_user_id_fkey;

alter table public.posts
drop constraint if exists posts_user_id_profiles_id_fkey;

alter table public.posts
add constraint posts_user_id_profiles_id_fkey
foreign key (user_id)
references public.profiles(id)
on delete cascade;

alter table public.posts enable row level security;

drop policy if exists "Authenticated users can read posts" on public.posts;

create policy "Authenticated users can read posts"
on public.posts
for select
to authenticated
using (true);

drop policy if exists "Users can create their own posts" on public.posts;

create policy "Users can create their own posts"
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.follows (
    follower_id uuid not null references public.profiles(id) on delete cascade,
    following_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (follower_id, following_id),
    constraint follows_no_self_follow check (follower_id <> following_id)
);

alter table public.follows enable row level security;

drop policy if exists "Authenticated users can read follows" on public.follows;

create policy "Authenticated users can read follows"
on public.follows
for select
to authenticated
using (true);

drop policy if exists "Users can follow profiles" on public.follows;

create policy "Users can follow profiles"
on public.follows
for insert
to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow profiles" on public.follows;

create policy "Users can unfollow profiles"
on public.follows
for delete
to authenticated
using (auth.uid() = follower_id);

create table if not exists public.messages (
    id bigint generated always as identity primary key,
    sender_id uuid not null,
    receiver_id uuid not null,
    content text not null,
    created_at timestamptz not null default now(),
    constraint messages_no_self_message check (sender_id <> receiver_id)
);

alter table public.messages
drop constraint if exists messages_sender_id_profiles_id_fkey;

alter table public.messages
add constraint messages_sender_id_profiles_id_fkey
foreign key (sender_id)
references public.profiles(id)
on delete cascade;

alter table public.messages
drop constraint if exists messages_receiver_id_profiles_id_fkey;

alter table public.messages
add constraint messages_receiver_id_profiles_id_fkey
foreign key (receiver_id)
references public.profiles(id)
on delete cascade;

alter table public.messages enable row level security;

drop policy if exists "Users can read their own messages" on public.messages;

create policy "Users can read their own messages"
on public.messages
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Followers can send messages" on public.messages;

create policy "Followers can send messages"
on public.messages
for insert
to authenticated
with check (
    auth.uid() = sender_id
    and exists (
        select 1
        from public.follows
        where follows.follower_id = auth.uid()
        and follows.following_id = messages.receiver_id
    )
);
