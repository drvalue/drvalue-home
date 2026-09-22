-- 관리자는 IAM 이 정한다(PLATFORM_ADMIN). admin_users 는 그 판정을 로그인 때마다 받아 적는 거울이다.
--   enabled        IAM 이 관리자라고 한 동안 true. 관리자가 아니게 되면 다음 로그인 시도에 false.
--   role           이 CMS 안에서 고칠 수 있는 범위(admin 전부 · marketing · hr). 입장을 주지는 않는다.
--   iam_sub        IAM 사용자 id (토큰 sub)
--   last_login_on  마지막으로 IAM 을 거쳐 들어온 시각
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS iam_sub varchar(64);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_on timestamptz;
