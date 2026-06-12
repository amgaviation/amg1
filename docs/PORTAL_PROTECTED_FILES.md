# Portal Protected Files

Base commit: `f9afe26848e62e39d431b51ca61793a643bd7a48`

These files are protected during the public-site remediation. They include portal routes, portal UI, portal server actions, Supabase integration, auth callbacks, portal-adjacent public auth pages, middleware, and database documentation. At the end of the remediation, compare this manifest against the working branch to confirm portal files were not changed.

## Protected Areas

- `app/portal/**`
- `components/portal/**`
- `lib/portal/**`
- `lib/portal-data.ts`
- `lib/supabase/**`
- `app/api/portal/**`
- `app/auth/**`
- `proxy.ts`
- `app/(public)/login`, `/forgot-password`, `/reset-password`, `/signup`, `/pending-approval`, `/access-denied`
- `components/site/portal-login.tsx`
- Portal database and architecture docs

## Manifest

```text
6dff832bb343090e2684beff16d6b04f82698708  PORTAL_WORKFLOW_AUDIT.md
4d71b2902f6355c4401539a9c60706a694d6d540  app/(public)/access-denied/page.tsx
e356416a653d3afe19ada156075468fe2f1133a4  app/(public)/forgot-password/page.tsx
5977b133f44f3b593003f9fc7db07bd4d3e267da  app/(public)/login/page.tsx
085787d0c8da9f854494e364b722e05f13812d9e  app/(public)/pending-approval/page.tsx
d1433a0e37295efb01fd08a905196f00ed61b2a7  app/(public)/reset-password/page.tsx
004e6afd5cdae0d6bdca4514ff9316bdb21e0ec4  app/(public)/signup/page.tsx
0b6aa66e5de6ae8c97f4c62106feb61827d1a8ea  app/api/portal/documents/[id]/download/route.ts
bcfe3e802f35ab384481e38a7c27db395abfd865  app/auth/callback/route.ts
7a928149ce8a9bbb47462e0064ada655ccf6db4b  app/portal/actions/_helpers.ts
ff5e3bbb0e9e2cc2417742a2f479e38f50ef9c86  app/portal/actions/admin.ts
d90dae104a7b61ae9d256af53b83f60e4fde18d4  app/portal/actions/auth.ts
75c935f3303467fba4a3e236b1ac2bdeffe5eecb  app/portal/actions/crew.ts
c80d91c7df618e95641a19abef3d77167cd43661  app/portal/actions/documents.ts
b06bf5942521585b534784549f974d2b44174209  app/portal/actions/invoices.ts
5bedd8ec44a730abe198c0c876450a64581f9a81  app/portal/actions/messages.ts
41e43f5e9a99a30a8663512d0d34f6859c157cec  app/portal/actions/missions.ts
c356ae91aa52173f8f506351d6733e40f28cc528  app/portal/actions/partner.ts
7e0126b5a7a5c3dff9bccfe524dee4447bcb7418  app/portal/actions/quotes.ts
68eefdec048fefb3cf4e21737d9e19affd175281  app/portal/admin/aircraft/page.tsx
9c698699c60a7110ec3a7b45b492e1d066bed9f3  app/portal/admin/audit-log/page.tsx
2307bae51a9e1c398a7cc7829a48629b3a4c14cc  app/portal/admin/clients/page.tsx
d337f255f346677fd6c26c26e3623a5f5fd04de0  app/portal/admin/communications/page.tsx
3b32063a3145b44359110f9b7684ac365b0a4680  app/portal/admin/crew/page.tsx
58a1c8334ca4012f1c2912d7e8027c461f32aae5  app/portal/admin/dashboard/page.tsx
ec7d9beff0b465ca0308deabeb646e48bb3fda42  app/portal/admin/documents/page.tsx
3211987c8294a602e79c84f16e1d4ac2a2cea1b2  app/portal/admin/expenses/page.tsx
bf73d268e0fc62f3ee255ffb848dfbda9b9d3bb2  app/portal/admin/invoices/[id]/page.tsx
220fb26f5b770558a288d285be569f5c0f61c09b  app/portal/admin/invoices/page.tsx
4923bea94b910359630fefa4c8253ff9adef409e  app/portal/admin/mission-control/page.tsx
28c946656d21c517c4de01578965bf1f5f620ade  app/portal/admin/missions/[id]/page.tsx
9b066b94a1f9ac5729dd091cf2b170665c8ba6ce  app/portal/admin/missions/page.tsx
c7b4cf6d339343d240893f97983cc728488bfcc5  app/portal/admin/notifications/page.tsx
a3f8ecb0e9b62b23851f737f746585a7b0a39652  app/portal/admin/page.tsx
70149ce23b3d98210428aa361f360f040db3dee5  app/portal/admin/partners/page.tsx
573ba818b5d7fbd0a3342585d2eb3a6cb1559104  app/portal/admin/quotes/page.tsx
f67412617ca76d6c9b43fb6d32ec1a919c48fcb2  app/portal/admin/settings/page.tsx
1d48eadb54aa107b9f73ff7fb0edd378577712fe  app/portal/admin/system-health/page.tsx
47613016e826cf535389bb290e7b6f3877bd85d9  app/portal/admin/trips/[id]/page.tsx
25311aa4f9899130da51fc53166533fd652741bd  app/portal/admin/trips/page.tsx
1ab89387daaafbec1f33ff126e321d8132d6c116  app/portal/admin/user-approvals/page.tsx
aae5b97729c7ca57f18e0c46f971d2647df4564f  app/portal/admin/users/page.tsx
20e83677b7b6213d919cdd570f2293cad132967f  app/portal/client/aircraft/page.tsx
6f1eee5b62115d3b05c117c921a52c8bb9b16541  app/portal/client/billing/[id]/page.tsx
a657480f6a40fef10f38ad47dc1759cd2afbf341  app/portal/client/billing/page.tsx
cd9b077f6c886c088083ea9fb1bfcce595a321b0  app/portal/client/dashboard/page.tsx
d53ea53c758835a28a22b468a35832a6593af2c4  app/portal/client/documents/page.tsx
61c3c115a1a4eab740fca98c867f3a479433cac7  app/portal/client/invoices/page.tsx
fdf8493b76a4c844b82c2b034e25a3b87342a924  app/portal/client/messages/[id]/page.tsx
d7cc9ee6cad8ecb12bf467f84d6d441963c89106  app/portal/client/messages/page.tsx
a353a9417c0ef064bac16d7158f11cd09c78a13e  app/portal/client/notifications/page.tsx
ffb21832869f723e39a1e605e74e3bf457ff11a0  app/portal/client/page.tsx
44920b902ba621a13c461effb4ffef10698cd3de  app/portal/client/quotes/[id]/page.tsx
bfd21fc6622bbba3f706d3f6bb51453c38dc9a9f  app/portal/client/quotes/page.tsx
0e3e477686004fc85834b5604ab734f9e91f8d08  app/portal/client/settings/page.tsx
6b59579829bcbd0878468df5c3e269105679a953  app/portal/client/trips/[id]/page.tsx
3202e06c7644ff83684c66616e9d8b33e16f1df6  app/portal/client/trips/new/page.tsx
454066e3be955354cbb8bf8a663a042f373ec45e  app/portal/client/trips/page.tsx
f5a45aef361ece23f4bc5141816f3f0ed85393cc  app/portal/crew/assignments/page.tsx
dc33a7d5c13d7b9a4834c415048b2d804d246645  app/portal/crew/availability/page.tsx
fdc06fdc77522c3e941016ea3460dca6f3d7a691  app/portal/crew/credentials/page.tsx
3d7f5e2df51a7d0f64ff4e48a86e951c8869ba56  app/portal/crew/dashboard/page.tsx
150dd42bb14cfd402af67068d043677ea81a70a2  app/portal/crew/documents/page.tsx
15f7284014a3f903b82598b9a141a669ee9528f5  app/portal/crew/expenses/page.tsx
c4485552c83767dbe16b23b078069302f56367cc  app/portal/crew/messages/[id]/page.tsx
237a1a3e6818c76a85fcfbb76b2982e50ed8578c  app/portal/crew/messages/page.tsx
06639f90958f279f8988b8ea1cc1ce907fa5d37c  app/portal/crew/missions/[id]/page.tsx
3e9abeb34ff53aff384089972b8f01e91cdf965d  app/portal/crew/missions/page.tsx
481d9eee881ba8661604af2d129d928b3325ac95  app/portal/crew/notifications/page.tsx
831b888ed265d22548cea209a7dfb1c071870c94  app/portal/crew/page.tsx
d024a44c0bb48b1fc5797b3d1a642ea880e83392  app/portal/crew/profile/page.tsx
6e998e4fb71699d2160629bc6b17ce581e78ca50  app/portal/crew/settings/page.tsx
2f70284374dad08fc24f318231303aab65d0d277  app/portal/page.tsx
dd85042416aef3bfd24f9eff5be1399054ef2c9e  app/portal/partner/dashboard/page.tsx
efbaea2f96532fbb4dfd6126d78bee036d62f397  app/portal/partner/documents/page.tsx
48f19ca4540a513db7926fcd8eb0a718956d098f  app/portal/partner/messages/[id]/page.tsx
aaf674ee495f7703ccbbe0bb5bb7f425f1393484  app/portal/partner/messages/page.tsx
101210c3a9e2cafbcaf5a32fbbae9871ed5b6cff  app/portal/partner/milestones/page.tsx
5d984e2d5bce6166ff5d667b11ecea4b65858fe6  app/portal/partner/notifications/page.tsx
7d131368dbc6df8ff3f0e9eee4e325e0ba9d4708  app/portal/partner/page.tsx
98c945aa37d39242355f21527d3cab956b73b951  app/portal/partner/profile/page.tsx
57dc21eadd9cecda1b72e2e01fdd1ba77848217b  app/portal/partner/quotes/page.tsx
cbbfe679a155c78f0f42171f3a38ffe89ea18409  app/portal/partner/requests/[id]/page.tsx
a6913479eb44cc5de737b1ce25541cabe06744f9  app/portal/partner/requests/page.tsx
4eee6299dbc0e051cf2ffbac47e7412fd26313d8  app/portal/partner/settings/page.tsx
f1c4e78cf26d725881dcf536bf907e94607aac75  components/portal/account-security-form.tsx
e62aa4f471941b5aedb54466e3ee0cac5a36bfa3  components/portal/shell/portal-shell.tsx
e9da5c0e71b02e34767b49171fff35ec054f6565  components/portal/ui/data-table.tsx
1d654d95d445f0a374495d1fd183e3bc29082f89  components/portal/ui/fields.tsx
a48a925e6bf890c25810f379b14c25f2bad699e0  components/portal/ui/icon.tsx
566e02cf5bf59d57b63bde2c73563def3e65f664  components/portal/ui/primitives.tsx
8a4b12b73ba9f41feabc4445016f97ae100de501  components/portal/ui/status-badge.tsx
896b33a8b1cecae22c9445efb1fbff7efd097aea  components/portal/ui/submit-button.tsx
b1d2512a90485c4e83b62c3c5b1b42f61f6c5401  components/site/portal-login.tsx
816e69883c34f59dc2a767e808a60d7fec3d50ac  docs/AMG_PORTAL_DATA_MODEL.sql
200ecf6b735d97fe0ea55ad127ec20c8773a3fa6  docs/AMG_PORTAL_SYSTEM_ARCHITECTURE.md
ae3bd80137a8cc7d3968e01f9ffc83554b7d5633  docs/AMG_PRODUCTION_DATABASE_PATCHES.sql
171c1e3bea159a7cb1a6b2b3a8b08d4aae0c236f  lib/portal-data.ts
48347ffd5093eb790788e34448cda73dd4fd4f49  lib/portal/audit.ts
bc827a9326474db24c2f241dbce864765737ce1b  lib/portal/constants.ts
ce1c184f927f816370548739b5007ee69f23f4ca  lib/portal/format.ts
1e21164f4445a0931a27f2697224c53e347300e5  lib/portal/notification-delivery.ts
a9e8177558cd91dbb1cb8843e8da07931dcc5500  lib/portal/queries.ts
1a2d6f4061a7351dbf1533a1be1f60f5a4d3b032  lib/portal/session.ts
56d6862b4590e3568c4da01466f62f751cadeb3e  lib/supabase/client.ts
f30f7f3a0f8db85015d3503856513cf1d9424e74  lib/supabase/database.types.ts
4bdd0bcc6a9d017890134e54776849c7f48eed38  lib/supabase/middleware.ts
848ab1a4ab1755cce1edf08baa400929fa8b2832  lib/supabase/server.ts
b24d311996ac12808a80bb171fe91246b3a0760b  proxy.ts
```
