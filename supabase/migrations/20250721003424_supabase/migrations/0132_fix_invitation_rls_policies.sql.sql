create policy "Account owners can create invitations"
on "public"."account_invitations"
as permissive
for insert
to public
with check ((account_id IN ( SELECT account_users.account_id
   FROM account_users
  WHERE ((account_users.user_id = auth.uid()) AND (account_users.role = 'owner'::text)))));


create policy "Account owners can delete invitations"
on "public"."account_invitations"
as permissive
for delete
to public
using ((account_id IN ( SELECT account_users.account_id
   FROM account_users
  WHERE ((account_users.user_id = auth.uid()) AND (account_users.role = 'owner'::text)))));


create policy "Account owners can update invitations"
on "public"."account_invitations"
as permissive
for update
to public
using ((account_id IN ( SELECT account_users.account_id
   FROM account_users
  WHERE ((account_users.user_id = auth.uid()) AND (account_users.role = 'owner'::text)))));


create policy "Account owners can view invitations"
on "public"."account_invitations"
as permissive
for select
to public
using ((account_id IN ( SELECT account_users.account_id
   FROM account_users
  WHERE ((account_users.user_id = auth.uid()) AND (account_users.role = 'owner'::text)))));



