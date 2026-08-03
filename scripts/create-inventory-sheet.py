from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "ウチの備瀬カフェ_在庫管理表.pdf"
LOGO = ROOT / "public" / "brand-logo.jpg"
W, H = landscape(A4)

INK = colors.HexColor("#231A17")
MUTED = colors.HexColor("#655F5A")
TEAL = colors.HexColor("#078E91")
GRID = colors.HexColor("#8A827D")
PAPER = colors.HexColor("#FFFDF8")

pdfmetrics.registerFont(TTFont("UchiBiseJP", "/System/Library/Fonts/STHeiti Medium.ttc", subfontIndex=0))
FONT = "UchiBiseJP"

GROUPS = {
    "コストコ｜フルーツ": {
        "color": "#DF5144", "tint": "#FFF1EE",
        "items": [("ストロベリー", "個", 1, 2), ("ラズベリー", "個", 1, 2), ("マンゴーチャンク", "個", 7, 20)],
    },
    "コストコ｜ジュース": {
        "color": "#DF5144", "tint": "#FFF1EE",
        "items": [("ベリー", "個", 2, 6), ("レモネード", "個", 2, 6), ("マンゴー", "個", 2, 10), ("パインジュース", "個", 2, 6)],
    },
    "コンビニ／Aプライス": {
        "color": "#3589B7", "tint": "#EFF8FD",
        "items": [("牛乳", "本", 2, 4), ("氷", "袋", 2, 4)],
    },
    "Aプライス": {
        "color": "#5B9D46", "tint": "#F0F8EC",
        "items": [("コーヒーミルク", "袋", 1, 3), ("コーヒー", "個", 1, 5), ("レモン輪切り 10枚", "個", 2, 6), ("ライム三日月 6枚", "個", 1, 2), ("ミント（タッパー残量）", "%", 25, 100), ("ガムシロップ", "袋", 1, 3), ("炭酸", "本", 1, 4)],
        "mint_scale": True,
    },
    "ドラッグストア": {
        "color": "#7561A8", "tint": "#F5F1FC",
        "items": [("食器用洗剤 ※大きめ", "個", 1, 2), ("ハンドソープ ※大きめ", "個", 1, 2), ("ハンドペーパー", "袋", 2, 1), ("ティッシュペーパー（5パック）", "袋", 1, 2), ("トイレットペーパー（12ロール）", "袋", 1, 2), ("ゴミ袋 大", "袋", 2, 5), ("ゴミ袋 小", "袋", 2, 5)],
    },
    "みつわ": {
        "color": "#D88D17", "tint": "#FFF7E8",
        "items": [("手袋", "箱", 1, 3), ("コップ", "個", 100, 500), ("蓋", "個", 100, 500), ("ストロー", "袋", 1, 4)],
    },
    "サンエー／ドンキ": {
        "color": "#287AA8", "tint": "#EEF7FC",
        "items": [("チャンダー", "箱", 1, 3)],
    },
}


def txt(c, value, x, y, size=8, color=INK, align="left"):
    c.setFont(FONT, size)
    c.setFillColor(color)
    if align == "center":
        c.drawCentredString(x, y, value)
    elif align == "right":
        c.drawRightString(x, y, value)
    else:
        c.drawString(x, y, value)


def checkbox(c, x, y, size=9, stroke=GRID):
    c.setStrokeColor(stroke)
    c.setLineWidth(0.8)
    c.rect(x, y, size, size, fill=0, stroke=1)


def operation_step(c, number, title, detail, x, y, width):
    c.setFillColor(colors.white)
    c.setStrokeColor(TEAL)
    c.setLineWidth(1)
    c.circle(x + 16, y + 18, 11, fill=0, stroke=1)
    txt(c, str(number), x + 16, y + 14, 10, TEAL, "center")
    txt(c, title, x + 34, y + 22, 8.5, INK)
    txt(c, detail, x + 34, y + 9, 6.2, MUTED)
    if number < 4:
        c.setStrokeColor(colors.HexColor("#B8D6D3"))
        c.line(x + width - 4, y + 4, x + width - 4, y + 32)


def draw_group(c, title, cfg, x, top, width):
    accent = colors.HexColor(cfg["color"])
    tint = colors.HexColor(cfg["tint"])
    items = cfg["items"]
    row_h = 18
    title_h = 25
    header_h = 21
    mint_h = 28 if cfg.get("mint_scale") else 0
    height = title_h + header_h + row_h * len(items) + mint_h
    bottom = top - height

    c.setFillColor(colors.white)
    c.setStrokeColor(accent)
    c.setLineWidth(1.1)
    c.roundRect(x, bottom, width, height, 7, fill=1, stroke=1)

    c.setFillColor(tint)
    c.roundRect(x, top - title_h, width, title_h, 7, fill=1, stroke=0)
    c.rect(x, top - title_h, width, 7, fill=1, stroke=0)
    c.setFillColor(accent)
    c.circle(x + 13, top - 12.5, 4.5, fill=1, stroke=0)
    txt(c, title, x + 24, top - 17, 11, accent)

    widths = [width * 0.43, width * 0.10, width * 0.11, width * 0.11, width * 0.16, width * 0.09]
    headers = ["商品名", "単位", "下限", "上限", "現在庫", "発注"]
    header_top = top - title_h
    c.setFillColor(colors.HexColor("#FAFAF8"))
    c.rect(x, header_top - header_h, width, header_h, fill=1, stroke=0)
    cursor = x
    for label, col_w in zip(headers, widths):
        txt(c, label, cursor + col_w / 2, header_top - 14, 5.8, MUTED, "center")
        cursor += col_w

    y_top = header_top - header_h
    for idx, (name, unit, minimum, target) in enumerate(items):
        y = y_top - (idx + 1) * row_h
        if idx % 2:
            c.setFillColor(tint)
            c.rect(x, y, width, row_h, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor("#CBC6C1"))
        c.setLineWidth(0.35)
        c.line(x, y, x + width, y)
        cursor = x
        for col_w in widths[:-1]:
            cursor += col_w
            c.line(cursor, y, cursor, y + row_h)
        name_size = 6.4 if len(name) < 15 else 5.3
        txt(c, name, x + 5, y + 6.2, name_size, INK)
        vals = [unit, str(minimum), str(target)]
        start = x + widths[0]
        for val, col_w in zip(vals, widths[1:4]):
            txt(c, val, start + col_w / 2, y + 6.2, 6.3, MUTED, "center")
            start += col_w
        if "ミント" in name:
            txt(c, "下で選択", start + widths[4] / 2, y + 6.2, 5.3, accent, "center")
        checkbox(c, x + sum(widths[:-1]) + (widths[-1] - 8) / 2, y + 5, 8, accent)

    if cfg.get("mint_scale"):
        y = bottom
        c.setFillColor(tint)
        c.rect(x, y, width, mint_h, fill=1, stroke=0)
        txt(c, "ミント残量", x + 7, y + 10, 6.2, accent)
        labels = [("空", "0"), ("少", "25"), ("半", "50"), ("多", "75"), ("満", "100")]
        start_x = x + 65
        gap = (width - 72) / 5
        for i, (label, pct) in enumerate(labels):
            px = start_x + i * gap
            checkbox(c, px, y + 10, 9, accent)
            txt(c, label, px + 13, y + 13, 5.7, INK)
            txt(c, f"{pct}%", px + 4.5, y + 3, 4.7, MUTED, "center")

    return bottom


def create_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("ウチの備瀬カフェ 在庫管理表")
    c.setAuthor("Uchi no Bise Cafe")
    c.setSubject("在庫アプリと同じ28品目の手書き在庫確認表")

    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # 元の用紙を踏襲したロゴ、中央タイトル、確認欄の3分割ヘッダー。
    if LOGO.exists():
        c.drawImage(str(LOGO), 24, H - 68, 47, 47, preserveAspectRatio=True, mask="auto")
    txt(c, "ウチの備瀬カフェ", 80, H - 37, 13, INK)
    txt(c, "Uchi no Bise Cafe", 80, H - 52, 7, MUTED)
    txt(c, "在 庫 管 理 表", W / 2, H - 45, 28, INK, "center")
    c.setFillColor(TEAL)
    c.roundRect(W / 2 + 116, H - 58, 112, 34, 16, fill=1, stroke=0)
    txt(c, "毎日チェック！", W / 2 + 172, H - 47, 13, colors.white, "center")
    txt(c, "確認日：       年    月    日（  ）", W - 196, H - 31, 8, INK)
    txt(c, "確認者：________________", W - 196, H - 50, 8, INK)

    # 4ステップの運用説明。
    ops_y = H - 112
    c.setFillColor(colors.white)
    c.setStrokeColor(TEAL)
    c.setLineWidth(1)
    c.roundRect(20, ops_y, W - 40, 44, 8, fill=1, stroke=1)
    c.setFillColor(TEAL)
    c.roundRect(20, ops_y, 55, 44, 8, fill=1, stroke=0)
    txt(c, "運用", 47.5, ops_y + 26, 9, colors.white, "center")
    txt(c, "方法", 47.5, ops_y + 12, 9, colors.white, "center")
    step_w = (W - 105) / 4
    operation_step(c, 1, "出勤時または閉店時", "棚・冷蔵庫を目で確認", 78, ops_y + 4, step_w)
    operation_step(c, 2, "現在庫だけを記入", "ミントのみ5段階で選択", 78 + step_w, ops_y + 4, step_w)
    operation_step(c, 3, "下限以下はチェック", "発注欄に ✓ を記入", 78 + step_w * 2, ops_y + 4, step_w)
    operation_step(c, 4, "アプリへ入力・保存", "発注が必要なものを共有", 78 + step_w * 3, ops_y + 4, step_w)

    top = H - 126
    gap = 10
    col_w = (W - 40 - gap * 2) / 3
    xs = [20, 20 + col_w + gap, 20 + (col_w + gap) * 2]

    y = top
    for key in ["コストコ｜フルーツ", "コストコ｜ジュース", "コンビニ／Aプライス"]:
        y = draw_group(c, key, GROUPS[key], xs[0], y, col_w) - 7

    y = top
    for key in ["Aプライス", "みつわ"]:
        y = draw_group(c, key, GROUPS[key], xs[1], y, col_w) - 7

    y = top
    for key in ["ドラッグストア", "サンエー／ドンキ"]:
        y = draw_group(c, key, GROUPS[key], xs[2], y, col_w) - 7

    memo_top = y
    memo_bottom = 55
    if memo_top - memo_bottom > 35:
        c.setFillColor(colors.white)
        c.setStrokeColor(colors.HexColor("#6CA8B8"))
        c.roundRect(xs[2], memo_bottom, col_w, memo_top - memo_bottom, 7, fill=1, stroke=1)
        txt(c, "MEMO／発注引き継ぎ", xs[2] + 9, memo_top - 17, 7, colors.HexColor("#287AA8"))
        c.setStrokeColor(colors.HexColor("#CBC6C1"))
        for line_y in range(int(memo_top - 31), int(memo_bottom + 7), -15):
            c.line(xs[2] + 9, line_y, xs[2] + col_w - 9, line_y)

    # 下部の使い方ポイントと確認欄。
    c.setFillColor(colors.HexColor("#F7F2E9"))
    c.roundRect(20, 14, W - 40, 32, 7, fill=1, stroke=0)
    txt(c, "使い方のポイント", 32, 34, 7, INK)
    txt(c, "● 現在庫は『今ある量』を記入　● ミントはタッパーの見た目で1つ選択　● 下限以下の商品だけ発注欄にチェック", 32, 21, 6.2, MUTED)
    txt(c, "確認  □ 全品目を確認  □ アプリへ入力  □ 保存完了", W - 31, 21, 6.2, INK, "right")

    c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    create_pdf()
