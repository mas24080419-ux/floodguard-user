CREATE OR REPLACE FUNCTION public.fg_community_review(p_admin uuid, p_report uuid, p_action text, p_note text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r public.fg_community_reports; v record; remaining integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('fg_community_review_points',0));
 select * into r from public.fg_community_reports where id=p_report for update;
 if not found then raise exception 'report_not_found'; end if;
 if p_action not in ('verified','rejected','resolved') then raise exception 'invalid_review_action'; end if;
 if r.status in ('rejected','resolved') or (r.status='verified' and p_action<>'resolved') then raise exception 'review_already_final'; end if;
 -- Approval of an archived photo never changes expires_at or reactivates the live feed.
 if p_action='verified' then
  if r.user_id is not null and r.photo is not null then
   perform pg_advisory_xact_lock(hashtextextended(r.user_id::text,0));
   select greatest(0,30-coalesce(sum(points),0))::integer into remaining from public.fg_community_points where user_id=r.user_id and created_at>now()-interval '24 hours';
   if remaining>0 then insert into public.fg_community_points(user_id,report_id,reason,points) values(r.user_id,r.id,'report',least(10,remaining)) on conflict do nothing; end if;
  end if;
  for v in select user_id from public.fg_community_votes where report_id=r.id and agrees order by user_id loop
   perform pg_advisory_xact_lock(hashtextextended(v.user_id::text,0));
   select greatest(0,30-coalesce(sum(points),0))::integer into remaining from public.fg_community_points where user_id=v.user_id and created_at>now()-interval '24 hours';
   if remaining>0 then insert into public.fg_community_points(user_id,report_id,reason,points) values(v.user_id,r.id,'confirmation',least(2,remaining)) on conflict do nothing; end if;
  end loop;
 end if;
 update public.fg_community_reports set status=p_action,reviewed_by=p_admin,reviewed_at=now(),review_note=left(coalesce(p_note,''),250) where id=p_report;
 return p_action;
end $function$;

REVOKE ALL ON FUNCTION public.fg_community_review(uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fg_community_review(uuid,uuid,text,text) TO service_role;
