-- Remove duplicate quests (keep the earliest per user/date/source),
-- then enforce one quest per (user, date, source) to stop the regeneration race.
delete from public.quests
where id in (
  select id from (
    select id, row_number() over (
      partition by user_id, quest_date, source order by created_at
    ) as rn
    from public.quests
  ) t where rn > 1
);

alter table public.quests
  add constraint quests_one_per_day_source unique (user_id, quest_date, source);
