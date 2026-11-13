#!/usr/bin/env python3
"""공유 미리보기(OG) 이미지 생성 — 1200x630, 한국어·영어.

    python3 scripts/generate-og.py

브랜드 이름은 src/lib/brand.ts 의 SERVICE_NAME / SERVICE_NAME_EN 과 맞춘다.
정렬 원칙: 한 줄에 놓인 아이콘·막대는 글자의 '잉크 윗선~기준선' 가운데에 맞춘다
(내림 글자 j·g·p 때문에 위로 떠 보이지 않게). 긴 줄은 칸 너비에 맞게 글자를 줄인다.
"""

from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
FONT_DIR = ROOT / "node_modules" / "pretendard" / "dist" / "public" / "static"
COIN = Image.open(PUBLIC / "favicon.png").convert("RGBA").crop((8, 8, 504, 504))

W, H = 1200, 630
BG = (10, 12, 16)
PANEL = (20, 23, 30)
PANEL_ROW = (29, 33, 42)
WHITE = (241, 243, 247)
SOFT = (208, 213, 222)
MUTED = (139, 147, 161)
RED = (225, 29, 72)
BLUE = (59, 130, 246)
AMBER = (247, 166, 0)

BRAND = {"ko": "찐투", "en": "jjintu"}
SITE = "jjindong.com"


def font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_DIR / f"Pretendard-{weight}.otf"), size)


def fit(text: str, weight: str, size: int, max_w: int, min_size: int = 20) -> ImageFont.FreeTypeFont:
    """max_w 안에 들어갈 때까지 글자 크기를 줄인다."""
    while size > min_size:
        f = font(weight, size)
        if f.getlength(text) <= max_w:
            return f
        size -= 1
    return font(weight, min_size)


def ink_top(f: ImageFont.FreeTypeFont, text: str) -> int:
    """기준선(0) 위로 올라간 잉크 높이 (음수)"""
    return f.getbbox(text, anchor="ls")[1]


def text_mid(draw: ImageDraw.ImageDraw, x: int, cy: float, text: str, f, fill) -> None:
    """잉크 윗선~기준선의 가운데를 cy 에 맞춰 그린다"""
    baseline = cy - ink_top(f, text) / 2
    draw.text((x, baseline), text, font=f, fill=fill, anchor="ls")


def background(glow: tuple[int, int, int], at: tuple[int, int], radius: int, strength: int) -> Image.Image:
    img = Image.new("RGB", (W, H), BG)
    layer = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(layer)
    cx, cy = at
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=glow)
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.55))
    return Image.blend(img, layer, strength / 100)


def paste_coin(img: Image.Image, x: int, cy: float, size: int) -> None:
    coin = COIN.resize((size, size), Image.LANCZOS)
    img.paste(coin, (x, round(cy - size / 2)), coin)


def brand_row(img: Image.Image, draw: ImageDraw.ImageDraw, locale: str, x: int, cy: float, coin: int, size: int) -> None:
    paste_coin(img, x, cy, coin)
    name = BRAND[locale]
    text_mid(draw, x + coin + round(coin * 0.28), cy, name, font("Bold", size), WHITE)


def url_row(draw: ImageDraw.ImageDraw, x: int, cy: float, text: str, accent, size: int = 30) -> None:
    f = font("Medium", size)
    bar_h = round(size * 1.2)
    draw.rounded_rectangle((x, round(cy - bar_h / 2), x + 7, round(cy + bar_h / 2)), radius=4, fill=accent)
    text_mid(draw, x + 26, cy, text, f, MUTED)


# ── 오른쪽 그림 ──────────────────────────────────────────


def chart_panel(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(box, radius=28, fill=PANEL)
    rng = random.Random(7)
    n, pad = 32, 30
    step = (x1 - x0 - pad * 2) / n
    price, closes = 0.0, []
    for i in range(n):
        drift = 0.9 if i < n * 0.8 else -0.2
        price += rng.uniform(-2.2, 2.6) + drift
        closes.append(price)
    lo, hi = min(closes) - 6, max(closes) + 6
    y = lambda v: y1 - pad - (v - lo) / (hi - lo) * (y1 - y0 - pad * 2)  # noqa: E731
    prev = closes[0] - 1
    for i, c in enumerate(closes):
        o = prev
        up = c >= o
        color = RED if up else BLUE  # 한국식: 상승 빨강, 하락 파랑
        cx = x0 + pad + step * i + step / 2
        wick_hi, wick_lo = max(o, c) + rng.uniform(0.5, 3), min(o, c) - rng.uniform(0.5, 3)
        draw.line((cx, y(wick_hi), cx, y(wick_lo)), fill=color, width=2)
        top, bot = y(max(o, c)), y(min(o, c))
        if bot - top < 3:
            bot = top + 3
        draw.rectangle((cx - step * 0.32, top, cx + step * 0.32, bot), fill=color)
        prev = c


def community_panel(draw: ImageDraw.ImageDraw, box, locale: str) -> None:
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(box, radius=28, fill=PANEL)
    boards = (
        [("코인분석", (234, 179, 8)), ("주식분석", (244, 63, 94)), ("해외주식", (129, 140, 248)), ("손익인증", (52, 211, 153)), ("뉴스·정보", (56, 189, 248))]
        if locale == "ko"
        else [("Crypto", (234, 179, 8)), ("Stocks", (244, 63, 94)), ("US Stocks", (129, 140, 248)), ("P&L Proof", (52, 211, 153)), ("News", (56, 189, 248))]
    )
    votes = [33, 78, 72, 19, 50]
    up_label = "추천" if locale == "ko" else "▲"
    rows, gap, pad = len(boards), 16, 24
    row_h = (y1 - y0 - pad * 2 - gap * (rows - 1)) / rows
    tag_f = font("Bold", 21)
    vote_f = font("SemiBold", 20)
    for i, (name, color) in enumerate(boards):
        ry0 = y0 + pad + i * (row_h + gap)
        ry1 = ry0 + row_h
        cy = (ry0 + ry1) / 2
        draw.rounded_rectangle((x0 + pad, ry0, x1 - pad, ry1), radius=16, fill=PANEL_ROW)
        tag_w = 118
        tx = x0 + pad + 18
        draw.rounded_rectangle((tx, cy - 18, tx + tag_w, cy + 18), radius=8, fill=tuple(int(c * 0.22 + 20) for c in color))
        tw = tag_f.getlength(name)
        text_mid(draw, round(tx + (tag_w - tw) / 2), cy, name, tag_f, color)
        lx = tx + tag_w + 22
        draw.rounded_rectangle((lx, cy - 13, lx + 190, cy - 3), radius=5, fill=(64, 70, 84))
        draw.rounded_rectangle((lx, cy + 6, lx + 118, cy + 13), radius=4, fill=(48, 53, 64))
        v = f"{up_label} {votes[i]}"
        vw = vote_f.getlength(v)
        text_mid(draw, round(x1 - pad - 22 - vw), cy, v, vote_f, (244, 63, 94))


def video_panel(draw: ImageDraw.ImageDraw, box, locale: str) -> None:
    """영상 모아보기 + AI 요약 + 채널·키워드 칩"""
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(box, radius=28, fill=PANEL)
    pad = 24
    chips = ["#비트코인", "#나스닥", "#엔비디아"] if locale == "ko" else ["#Bitcoin", "#Nasdaq", "#Nvidia"]
    chip_f = font("SemiBold", 20)
    cx, cy = x0 + pad, y0 + pad + 20
    for i, c in enumerate(chips):
        w = chip_f.getlength(c) + 28
        active = i == 0
        draw.rounded_rectangle((cx, cy - 20, cx + w, cy + 20), radius=20,
                               fill=(70, 18, 34) if active else PANEL_ROW, outline=RED if active else None, width=2)
        text_mid(draw, round(cx + 14), cy, c, chip_f, WHITE if active else SOFT)
        cx += w + 10
    channels = ["채널 A", "채널 B", "채널 C"] if locale == "ko" else ["Channel A", "Channel B", "Channel C"]
    badge = "AI 요약" if locale == "ko" else "AI summary"
    rows, gap = 3, 14
    top = cy + 20 + 18
    row_h = (y1 - pad - top - gap * (rows - 1)) / rows
    name_f = font("Medium", 18)
    badge_f = font("Bold", 17)
    for i in range(rows):
        ry0 = top + i * (row_h + gap)
        ry1 = ry0 + row_h
        draw.rounded_rectangle((x0 + pad, ry0, x1 - pad, ry1), radius=16, fill=PANEL_ROW)
        tx0, ty0 = x0 + pad + 14, ry0 + 14
        th = row_h - 28
        tw = th * 16 / 9
        draw.rounded_rectangle((tx0, ty0, tx0 + tw, ty0 + th), radius=10, fill=(52, 20, 30))
        mx, my = tx0 + tw / 2, ty0 + th / 2
        draw.polygon([(mx - 11, my - 14), (mx - 11, my + 14), (mx + 15, my)], fill=RED)
        lx = tx0 + tw + 18
        lw = x1 - pad - 16 - lx
        draw.rounded_rectangle((lx, ty0 + 4, lx + lw, ty0 + 16), radius=6, fill=(78, 84, 98))
        draw.rounded_rectangle((lx, ty0 + 26, lx + lw * 0.7, ty0 + 36), radius=5, fill=(58, 63, 76))
        text_mid(draw, round(lx), ty0 + th - 12, channels[i], name_f, MUTED)
        bw = badge_f.getlength(badge) + 22
        bx = x1 - pad - 16 - bw
        draw.rounded_rectangle((bx, ty0 + th - 28, bx + bw, ty0 + th + 4), radius=8, fill=(247, 166, 0, 255))
        text_mid(draw, round(bx + 11), ty0 + th - 12, badge, badge_f, (18, 18, 18))


# ── 이미지 종류 ──────────────────────────────────────────


def hero(locale: str, lines: list[str], panel: str, out: str) -> None:
    img = background((92, 18, 38), (60, 40), 420, 70)
    draw = ImageDraw.Draw(img)
    x, col_w = 76, 520
    brand_row(img, draw, locale, x, 152, 112, 96 if locale == "ko" else 86)
    ys = [298, 362, 424]
    for i, line in enumerate(lines):
        f = fit(line, "SemiBold" if i == 0 else "Medium", 40, col_w)
        text_mid(draw, x, ys[i], line, f, WHITE if i == 0 else SOFT)
    url_row(draw, x, 522, SITE, RED)
    box = (640, 70, 1140, 560)
    if panel == "chart":
        chart_panel(draw, box)
    elif panel == "video":
        video_panel(draw, box, locale)
    else:
        community_panel(draw, box, locale)
    img.save(PUBLIC / out, optimize=True)


def bybit(locale: str, out: str) -> None:
    ko = locale == "ko"
    img = background((86, 58, 8), (1080, 40), 440, 75)
    draw = ImageDraw.Draw(img)
    x, col_w = 72, 600
    brand_row(img, draw, locale, x, 96, 60, 36)
    eyebrow = "바이비트 가입 가이드" if ko else "Bybit sign-up guide"
    title = "바이비트 추천인 코드" if ko else "Bybit Referral Code"
    l1 = "가입 방법 7단계 · KYC · 입금 · 수수료" if ko else "Sign-up in 7 steps · KYC · Deposit · Fees"
    l2 = "레퍼럴 가입 시 AI 요약 하루 20회" if ko else "Referral sign-ups get 20 AI summaries a day"
    text_mid(draw, x, 192, eyebrow, font("Bold", 28), AMBER)
    text_mid(draw, x, 254, title, fit(title, "Bold", 62, col_w), WHITE)
    text_mid(draw, x, 340, l1, fit(l1, "Medium", 30, col_w), SOFT)
    text_mid(draw, x, 388, l2, fit(l2, "SemiBold", 30, col_w), AMBER)
    url_row(draw, x, 474, f"{SITE}/bybit" if ko else f"{SITE}/en/bybit", AMBER)

    card = (760, 150, 1130, 480)
    draw.rounded_rectangle(card, radius=30, fill=(18, 21, 28), outline=AMBER, width=3)
    cx = (card[0] + card[2]) / 2
    label = "Bybit 추천인 코드" if ko else "Bybit referral code"
    note = "계정 생성 전에 입력하세요" if ko else "Enter it before creating your account"

    def centered(text, f, cy, fill):
        w = f.getlength(text)
        text_mid(draw, round(cx - w / 2), cy, text, f, fill)

    centered(label, font("SemiBold", 26), 222, MUTED)
    centered("XQZZ6O", fit("XQZZ6O", "ExtraBold", 92, 310), 318, AMBER)
    draw.line((card[0] + 40, 385, card[2] - 40, 385), fill=(55, 60, 72), width=2)
    centered(note, fit(note, "Medium", 22, 320), 430, SOFT)
    img.save(PUBLIC / out, optimize=True)


def main() -> None:
    hero("ko", ["코인·주식 분석 영상 모아보기", "긴 영상은 AI가 핵심만 요약", "내 채널·키워드별로 골라 보기"], "video", "ogImage.png")
    hero("en", ["Analysis videos in one place", "AI sums up long videos fast", "Follow channels & keywords"], "video", "ogImage-en.png")
    hero("ko", ["비트코인·이더리움·리플·솔라나", "나스닥·S&P500·다우 실시간 차트", "15분봉부터 주봉까지"], "chart", "og-chart.png")
    hero("en", ["Bitcoin · Ethereum · XRP · Solana", "Nasdaq · S&P 500 · Dow live charts", "From 15-minute to weekly candles"], "chart", "og-chart-en.png")
    hero("ko", ["코인·주식 투자 커뮤니티", "코인분석 · 주식분석 · 해외주식", "손익인증 · 뉴스 · 질문"], "community", "og-community.png")
    hero("en", ["Crypto & stock investor community", "Crypto · Stocks · US Stocks", "P&L proof · News · Q&A"], "community", "og-community-en.png")
    bybit("ko", "og-bybit.png")
    bybit("en", "og-bybit-en.png")
    print("OG images written to public/")


if __name__ == "__main__":
    main()
