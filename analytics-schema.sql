-- Only the trusted backend can read/write analytics; no client table access.
create table if not exists public.street_interest_events (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 street text not null check(length(street) between 1 and 120),
 bucket bigint not null,
 created_at timestamptz not null default now(),
 unique(user_id,street,bucket)
);
create index if not exists street_interest_events_created_idx on public.street_interest_events(created_at);
alter table public.street_interest_events enable row level security;
revoke all on public.street_interest_events from anon,authenticated;
grant all on public.street_interest_events to service_role;
grant usage,select on sequence public.street_interest_events_id_seq to service_role;
create table if not exists public.street_flood_observations (
 street_key text primary key,
 street text not null check(length(street) between 1 and 120),
 depth_cm numeric not null check(depth_cm>=0 and depth_cm<=500),
 observed_at timestamptz not null,
 source_url text not null check(source_url ~ '^https?://'),
 note text not null default '' check(length(note)<=500),
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now()
);
alter table public.street_flood_observations enable row level security;
revoke all on public.street_flood_observations from anon,authenticated;
grant all on public.street_flood_observations to service_role;
create or replace function public.fg_street_analytics(p_days integer default 30)
returns jsonb language sql stable security invoker set search_path='' as $$
with bounds as (select (now() at time zone 'Asia/Ho_Chi_Minh')::date as today, greatest(1,least(90,p_days)) as days),
events as (
 select user_id,created_at,'analysis'::text as kind,id::text as event_key,array[street] as streets
 from public.street_interest_events,bounds where created_at >= ((today-days+1)::timestamp at time zone 'Asia/Ho_Chi_Minh')
 union all
 select user_id,created_at,'route',id::text, array(select jsonb_array_elements_text(case when jsonb_typeof(payload->'streets')='array' then payload->'streets' else '[]'::jsonb end))
 from public.user_activity,bounds where kind='route' and created_at >= ((today-days+1)::timestamp at time zone 'Asia/Ho_Chi_Minh')
), expanded as (
 select e.user_id,e.created_at,e.kind,e.event_key,s.street,lower(regexp_replace(btrim(s.street),'\s+',' ','g')) as street_key
 from events e cross join lateral (select distinct btrim(x) as street from unnest(e.streets) x where length(btrim(x))>0) s
), street_counts as (
 select street_key,min(street) as street,count(distinct(kind,event_key)) as events,count(distinct user_id) as users,
 count(distinct(kind,event_key)) filter(where kind='analysis') as analyses,
 count(distinct(kind,event_key)) filter(where kind='route') as routes
 from expanded group by street_key
), merged as (
 select coalesce(c.street_key,o.street_key) as street_key,coalesce(o.street,c.street) as street,coalesce(c.events,0) as events,coalesce(c.users,0) as users,
 coalesce(c.analyses,0) as analyses,coalesce(c.routes,0) as routes,
 o.depth_cm,o.observed_at,o.source_url,o.note,
 coalesce(o.observed_at>=now()-interval '72 hours',false) as fresh
 from street_counts c full join public.street_flood_observations o using(street_key)
), daily as (
 select day::date as date,count(e.event_key) as events,count(distinct e.user_id) as users,
 count(e.event_key) filter(where e.kind='route') as routes,count(e.event_key) filter(where e.kind='analysis') as analyses
 from bounds cross join lateral generate_series((today-days+1)::timestamp,today::timestamp,interval '1 day') day
 left join events e on (e.created_at at time zone 'Asia/Ho_Chi_Minh')::date=day::date group by day
)
select jsonb_build_object('generated_at',now(),'days',(select days from bounds),'timezone','Asia/Ho_Chi_Minh',
 'stats',jsonb_build_object('events',(select count(*) from events),'users',(select count(distinct user_id) from events),'streets',(select count(*) from street_counts),'fresh_flooded',(select count(*) from merged where fresh and depth_cm>0)),
 'streets',coalesce((select jsonb_agg(to_jsonb(m) order by events desc,users desc,street) from merged m),'[]'::jsonb),
 'daily',coalesce((select jsonb_agg(to_jsonb(d) order by date) from daily d),'[]'::jsonb));
$$;
revoke all on function public.fg_street_analytics(integer) from public,anon,authenticated;
grant execute on function public.fg_street_analytics(integer) to service_role;
