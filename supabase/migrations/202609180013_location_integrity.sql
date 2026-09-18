begin;
-- CHECK expressions must explicitly reject partial NULL coordinate triples.
alter table public.rescues add constraint rescue_location_complete check(
 (latest_volunteer_lat is null and latest_volunteer_lng is null and latest_location_at is null) or
 (latest_volunteer_lat is not null and latest_volunteer_lng is not null and latest_location_at is not null));
alter table public.rescues add constraint rescue_pickup_order check(
 pickup_started_at is null or picked_up_at is null or picked_up_at>=pickup_started_at);
commit;
