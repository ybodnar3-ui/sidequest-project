-- H2: idempotent XP award — at most one 'quest_done' ledger row per quest.
delete from public.xp_ledger a using public.xp_ledger b
  where a.reason = 'quest_done' and b.reason = 'quest_done'
    and a.quest_id = b.quest_id and a.ctid < b.ctid;
create unique index if not exists xp_ledger_quest_done_unique
  on public.xp_ledger (quest_id) where reason = 'quest_done';

-- H1: atomic reward redemption (balance check + debit + redemption in one tx,
-- serialized per-user via advisory lock so concurrent redeems can't overdraw).
create or replace function public.redeem_reward(p_reward_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_cost int;
  v_balance int;
begin
  if v_user is null then return 'not_authenticated'; end if;
  perform pg_advisory_xact_lock(hashtext(v_user::text));
  select cost_xp into v_cost from public.custom_rewards
    where id = p_reward_id and user_id = v_user;
  if v_cost is null then return 'not_found'; end if;
  select coalesce(sum(delta), 0) into v_balance from public.xp_ledger where user_id = v_user;
  if v_balance < v_cost then return 'insufficient'; end if;
  insert into public.xp_ledger (user_id, delta, reason) values (v_user, -v_cost, 'redeem');
  insert into public.redemptions (user_id, reward_id, cost_xp) values (v_user, p_reward_id, v_cost);
  return 'ok';
end;
$$;
grant execute on function public.redeem_reward(uuid) to authenticated;
