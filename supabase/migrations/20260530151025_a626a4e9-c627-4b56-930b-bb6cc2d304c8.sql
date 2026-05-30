
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_user_id_number() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_owner_role_delete() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_owner_ban() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_newbie_props(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_xp(uuid, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_daily_login(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.start_game(uuid, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_prop(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_vip(uuid, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.send_gift(uuid, uuid, uuid, uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.seller_send_coins(uuid, uuid, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_send_coins(uuid, uuid, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_any_admin_role(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_daily_login(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_game(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_prop(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_vip(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_gift(uuid, uuid, uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seller_send_coins(uuid, uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_send_coins(uuid, uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_admin_role(uuid) TO authenticated;
