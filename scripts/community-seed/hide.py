"""시드 글 숨기기/되살리기 (운영 DB에 직접 씀).

실행:  set -a && source .env.local && set +a && python3 -I scripts/community-seed/hide.py count|hide|unhide
- 시드 계정(@seed.raise.invalid)이 쓴 BOARD_POSTS 의 deleted_at 을 채우거나 비운다.
- 모든 조회(목록·글 페이지·사이트맵·API)가 deleted_at is null 만 보므로, hide 하면 어디에도 안 보이고 글 주소는 404.
- 2026-11-22: AdSense 심사(가치 낮은 콘텐츠) 때문에 시드 글 445개(ko 260 · en 185)를 전부 숨김.
  seed.py 를 다시 돌리면 시드 글이 새로 생기고 바로 보이니 주의.
"""
import json, os, sys, urllib.request
from collections import Counter
from datetime import datetime, timezone
URL=os.environ["NEXT_PUBLIC_SUPABASE_URL"]; KEY=os.environ["SUPABASE_SECRET_KEY"]
H={"apikey":KEY,"Authorization":f"Bearer {KEY}","Content-Type":"application/json"}
def req(m,p,b=None,prefer=None):
    h=dict(H)
    if prefer: h["Prefer"]=prefer
    r=urllib.request.Request(URL+p,method=m,headers=h,data=json.dumps(b).encode() if b is not None else None)
    with urllib.request.urlopen(r,timeout=60) as resp:
        t=resp.read(); return json.loads(t) if t else None
seed=[]; page=1
while True:
    us=req("GET",f"/auth/v1/admin/users?page={page}&per_page=200")["users"]
    seed+=[u["id"] for u in us if (u.get("email") or "").endswith("@seed.raise.invalid")]
    if len(us)<200: break
    page+=1
seedset=set(seed)
posts=req("GET","/rest/v1/BOARD_POSTS?select=id,author_auth_id,locale,deleted_at&limit=10000")
c=Counter(("seed" if p["author_auth_id"] in seedset else "real", p["locale"], "hidden" if p["deleted_at"] else "live") for p in posts)
print("seed accounts:",len(seed))
for k,v in sorted(c.items()): print(k,v)
mode=sys.argv[1]
if mode in("hide","unhide"):
    now=datetime.now(timezone.utc).isoformat()
    for i in range(0,len(seed),40):
        ch=",".join(seed[i:i+40])
        if mode=="hide":
            req("PATCH",f"/rest/v1/BOARD_POSTS?author_auth_id=in.({ch})&deleted_at=is.null",{"deleted_at":now},prefer="return=minimal")
        else:
            req("PATCH",f"/rest/v1/BOARD_POSTS?author_auth_id=in.({ch})&deleted_at=not.is.null",{"deleted_at":None},prefer="return=minimal")
    print(mode,"done")
