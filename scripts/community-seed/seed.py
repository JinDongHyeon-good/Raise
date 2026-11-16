"""커뮤니티 시드 데이터 생성 (운영 DB에 직접 씀).

실행:  set -a && source .env.local && set +a && python3 -I scripts/community-seed/seed.py [ko|en]
- content_*.py 의 LOCALE / POSTS 를 모두 읽는다.
- 시드 계정: 한국어 seed-NN@seed.raise.invalid, 영어 seed-en-NN@seed.raise.invalid (비밀번호 랜덤 → 로그인 불가)
- 다시 실행하면 시드 계정이 쓴 글을 전부 지우고 새로 만든다. 실제 회원 글은 건드리지 않는다.
- 시드 계정 일괄 삭제가 필요하면 auth.users 에서 email like '%@seed.raise.invalid' 를 지우면 된다 (cascade).
"""
import glob, importlib.util, json, os, random, secrets, sys, urllib.error, urllib.request
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
KEY = os.environ["SUPABASE_SECRET_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
DOMAIN = "seed.raise.invalid"
DAYS = 45
random.seed(20261116)


def load(path):
    spec = importlib.util.spec_from_file_location(os.path.basename(path)[:-3], path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def req(method, path, body=None, prefer=None):
    h = dict(H)
    if prefer:
        h["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(4):
        r = urllib.request.Request(URL + path, method=method, headers=h, data=data)
        try:
            with urllib.request.urlopen(r, timeout=30) as resp:
                t = resp.read()
                return json.loads(t) if t else None
        except urllib.error.HTTPError as e:
            if e.code >= 500 and attempt < 3:
                continue
            raise SystemExit(f"{method} {path} -> {e.code} {e.read().decode()[:400]}")
        except urllib.error.URLError:
            if attempt == 3:
                raise


modules = [load(p) for p in sorted(glob.glob(os.path.join(HERE, "content_*.py")))]
nicks = {"ko": [], "en": []}
posts = {"ko": [], "en": []}
for m in modules:
    if getattr(m, "NICKNAMES", None):
        nicks[m.LOCALE] += m.NICKNAMES
    posts[m.LOCALE] += m.POSTS

# 인자로 언어를 고를 수 있다: seed.py ko  /  seed.py en  (기본: 둘 다)
SELECTED = [a for a in sys.argv[1:] if a in ("ko", "en")] or ["ko", "en"]
nicks = {k: v for k, v in nicks.items() if k in SELECTED}
posts = {k: v for k, v in posts.items() if k in SELECTED}

# ── 1) 시드 계정 ─────────────────────────────────────────────
existing = {}
page = 1
while True:
    users = req("GET", f"/auth/v1/admin/users?page={page}&per_page=200")["users"]
    for u in users:
        if (u.get("email") or "").endswith("@" + DOMAIN):
            existing[u["email"]] = u["id"]
    if len(users) < 200:
        break
    page += 1

now = datetime.now(timezone.utc)
users_by_locale = {}
for loc, names in nicks.items():
    ids = []
    for i, nick in enumerate(names):
        email = f"seed-{i:02d}@{DOMAIN}" if loc == "ko" else f"seed-en-{i:02d}@{DOMAIN}"
        uid = existing.get(email)
        if not uid:
            uid = req("POST", "/auth/v1/admin/users", {
                "email": email, "password": secrets.token_urlsafe(24), "email_confirm": True,
                "user_metadata": {"seed": True, "nickname": nick}})["id"]
        joined = (now - timedelta(days=random.randint(DAYS + 5, 240))).isoformat()
        req("POST", "/rest/v1/USER_MST?on_conflict=auth_id",
            {"auth_id": uid, "nickname": nick, "created_at": joined, "updated_at": joined},
            prefer="resolution=merge-duplicates,return=minimal")
        ids.append(uid)
    users_by_locale[loc] = ids
    print(f"{loc} seed users: {len(ids)}")

# ── 2) 기존 시드 글 삭제 (댓글·좋아요는 cascade) ─────────────────
all_seed = [u for ids in users_by_locale.values() for u in ids]
for i in range(0, len(all_seed), 40):
    chunk = ",".join(all_seed[i:i + 40])
    req("DELETE", f"/rest/v1/BOARD_POSTS?author_auth_id=in.({chunk})&locale=in.({','.join(SELECTED)})",
        prefer="return=minimal")

# ── 3) 글·댓글·좋아요·조회수 ────────────────────────────────────
LIKE_RANGE = {"free": (1, 16), "analysis": (6, 34), "stock_analysis": (4, 24), "us_stock": (3, 26),
              "kr_stock": (2, 20), "news": (3, 22), "question": (0, 7), "profit": (5, 38)}
VIEW_MULT = {"free": 1.0, "analysis": 1.5, "stock_analysis": 1.3, "us_stock": 1.3, "kr_stock": 1.2,
             "news": 1.4, "question": 0.8, "profit": 1.6}
# 현지 시간대별 활동 가중치 (0~23시)
HOUR_W = [3, 2, 1, 1, 0.5, 0.5, 1, 3, 4, 3, 2, 2, 5, 4, 2, 2, 2, 3, 4, 5, 6, 7, 7, 5]
TZ_OFFSET = {"ko": [9], "en": [-5, -8, 0, 1]}  # 영어권은 미국 동·서부, 영국, 유럽 섞임
start = now - timedelta(days=DAYS)


def rand_time(lo, hi, loc):
    if hi <= lo:
        return lo
    off = random.choice(TZ_OFFSET[loc])
    for _ in range(60):
        t = lo + (hi - lo) * random.random()
        if random.random() < HOUR_W[(t + timedelta(hours=off)).hour] / 7:
            return t
    return lo + (hi - lo) * random.random()


def post_times(n, loc):
    """균등 배치 대신 실제 게시판처럼: 최근일수록 글이 많고, 날마다 들쭉날쭉하고, 몰려 올라오는 시간대가 있다."""
    off = random.choice(TZ_OFFSET[loc])
    day_w = []
    for d in range(DAYS):
        growth = 0.35 + (d / DAYS) ** 1.3 * 1.6           # 커뮤니티 성장
        noise = random.gammavariate(3.0, 1 / 3.0)          # 날마다 편차 큼
        if random.random() < 0.08:
            noise *= random.uniform(1.8, 2.6)                # 가끔 시장 이슈로 글 폭증
        if random.random() < 0.07:
            noise *= 0.1                                   # 거의 조용한 날
        day_w.append(growth * noise)
    times = []
    while len(times) < n:
        if times and random.random() < 0.15:
            # 앞 글 직후에 연달아 (같은 이슈로 몰림)
            t = random.choice(times) + timedelta(minutes=random.uniform(2, 95))
        else:
            d = random.choices(range(DAYS), weights=day_w)[0]
            local_day = (start + timedelta(days=d) + timedelta(hours=off)).replace(hour=0, minute=0, second=0, microsecond=0)
            h = random.choices(range(24), weights=HOUR_W)[0]
            t = local_day - timedelta(hours=off) + timedelta(hours=h, minutes=random.uniform(0, 60), seconds=random.uniform(0, 60))
        if start <= t <= now - timedelta(minutes=15):
            times.append(t)
    return sorted(times)


def html(lines):
    return "".join(f"<p>{l}</p>" for l in lines)


summary = []
for loc, plist in posts.items():
    uids = users_by_locale[loc]
    order = list(range(len(plist)))
    random.shuffle(order)
    # 활동량이 사람마다 다르다: 소수의 헤비 유저가 글을 많이 씀
    author_w = [random.paretovariate(1.4) for _ in uids]
    for idx, created in zip(order, post_times(len(plist), loc)):
        p = plist[idx]
        author = random.choices(uids, weights=author_w)[0]
        post = req("POST", "/rest/v1/BOARD_POSTS", {
            "author_auth_id": author, "title": p["title"][:120], "content_html": html(p["body"]),
            "post_type": p["type"], "locale": loc,
            "created_at": created.isoformat(), "updated_at": created.isoformat()},
            prefer="return=representation")[0]
        pid = post["id"]

        others = [u for u in uids if u != author]
        t = created
        root_id, root_author = None, None
        comment_rows = []
        for c in p["comments"]:
            kind = "root"
            if c.startswith("r:a:") or c.startswith("a:"):
                kind, c = "author", c.split("a:", 1)[1]
            elif c.startswith("r:"):
                kind, c = "reply", c[2:]
            if root_id is None:
                kind = "root"
            gap = random.expovariate(1 / 40) + 1
            if random.random() < 0.12:
                gap += random.uniform(180, 60 * 48)  # 한참 뒤에 달리는 댓글
            t = min(t + timedelta(minutes=gap), now - timedelta(minutes=1))
            if kind == "author":
                who = author
            elif kind == "reply":
                # 자기 댓글에 자기가 답글 다는 일은 없게
                who = random.choice([u for u in others if u != root_author])
            else:
                who = random.choice(others)
            body = {"post_id": pid, "author_auth_id": who, "content": c.strip(),
                    "created_at": t.isoformat(), "updated_at": t.isoformat()}
            if kind != "root":
                body["parent_id"] = root_id
            row = req("POST", "/rest/v1/BOARD_COMMENTS", body, prefer="return=representation")[0]
            if kind == "root":
                root_id, root_author = row["id"], who
            comment_rows.append((row["id"], who))

        lo_l, hi_l = LIKE_RANGE[p["type"]]
        n_like = min(len(others), int(random.triangular(lo_l, hi_l, lo_l + (hi_l - lo_l) * 0.3)))
        likers = random.sample(others, n_like)
        if likers:
            req("POST", "/rest/v1/BOARD_POST_LIKES", [
                {"post_id": pid, "user_auth_id": u,
                 "created_at": rand_time(created, created + (now - created) * 0.8, loc).isoformat()}
                for u in likers], prefer="return=minimal")

        cl = []
        for j, (cid, who) in enumerate(comment_rows):
            k = int(random.triangular(0, max(1, 9 - j * 1.4), 0))
            pool = [u for u in uids if u != who]
            cl += [{"comment_id": cid, "user_auth_id": u} for u in random.sample(pool, min(k, len(pool)))]
        if cl:
            req("POST", "/rest/v1/BOARD_COMMENT_LIKES", cl, prefer="return=minimal")

        days = max((now - created).total_seconds() / 86400, 0.05)
        base = n_like * random.uniform(14, 32) + len(comment_rows) * random.uniform(6, 14) + random.uniform(20, 110)
        views = int(base * VIEW_MULT[p["type"]] * min(1.0, 0.25 + days / 4))
        views = max(views, n_like * 3 + len(comment_rows) + random.randint(3, 15))
        req("PATCH", f"/rest/v1/BOARD_POSTS?id=eq.{pid}", {"view_count": views}, prefer="return=minimal")
        summary.append((loc, p["type"], n_like, len(comment_rows), views))
    print(f"{loc}: {len(plist)} posts done")

for loc in ("ko", "en"):
    rows = [s for s in summary if s[0] == loc]
    print(loc, "posts", len(rows), "comments", sum(r[3] for r in rows), "likes", sum(r[2] for r in rows),
          "views", sum(r[4] for r in rows))
