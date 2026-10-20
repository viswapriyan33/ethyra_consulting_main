import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

W, H = 1760, 1240
# Grand taller book geometry:
bx1, by1, bx2, by2 = 60, 100, 1700, 1140
bw = bx2 - bx1      # 1640 px
bh = by2 - by1      # 1040 px
mid_x = 880         # exactly 50%
radius = 28

page_w = mid_x - bx1  # 820 px
page_h = bh           # 1040 px

# Palette
NAVY_DEEP = (0, 44, 139)       # #002c8b
NAVY_DARK = (0, 24, 72)        # #001848
CYAN_VIVID = (0, 154, 224)     # #009ae0
CYAN_LIGHT = (56, 189, 248)    # #38bdf8
WHITE = (255, 255, 255)
PAPER_LIGHT = (252, 251, 248)  # Warm archival paper
PAPER_CREAM = (246, 243, 237)
INK_DARK = (15, 23, 42)
INK_MUTED = (71, 85, 105)
INK_FAINT = (148, 163, 184)

# Typography (scaled for 1040px height canvas)
font_serif_huge = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 50)
font_serif_title = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 36)
font_serif_sub = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 26)
font_serif_body = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 22)
font_serif_quote = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 24)

font_sans_kicker = ImageFont.truetype('C:/Windows/Fonts/calibrib.ttf', 18)
font_sans_head = ImageFont.truetype('C:/Windows/Fonts/calibrib.ttf', 25)
font_sans_sub = ImageFont.truetype('C:/Windows/Fonts/calibrib.ttf', 19)
font_sans_body = ImageFont.truetype('C:/Windows/Fonts/calibri.ttf', 20)
font_sans_small = ImageFont.truetype('C:/Windows/Fonts/calibri.ttf', 16)

# Outer Book Rounded Mask
book_mask = Image.new('L', (W, H), 0)
mdraw = ImageDraw.Draw(book_mask)
mdraw.rounded_rectangle([bx1, by1, bx2, by2], radius=radius, fill=255)

# Soft Realistic Desk Drop Shadow
book_shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(book_shadow)
sdraw.rounded_rectangle([bx1 + 10, by1 + 18, bx2 - 10, by2 + 32], radius=radius + 8, fill=(0, 20, 60, 95))
book_shadow = book_shadow.filter(ImageFilter.GaussianBlur(28))

def create_gutter_shading():
    spine = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(spine)
    # Left gradient toward spine (820 to 880)
    for x in range(820, 880):
        alpha = int(52 * ((x - 820) / 60.0) ** 1.8)
        sdraw.line([(x, by1), (x, by2)], fill=(0, 20, 55, alpha))
    # Right gradient away from spine (880 to 940)
    for x in range(880, 940):
        alpha = int(42 * ((940 - x) / 60.0) ** 1.8)
        sdraw.line([(x, by1), (x, by2)], fill=(0, 20, 55, alpha))
    # Spine center crease line
    sdraw.line([(mid_x, by1), (mid_x, by2)], fill=(0, 15, 45, 110), width=2)
    return spine

gutter_shading = create_gutter_shading()

def draw_wrapped_text(draw, text, x, y, font, fill, max_width, line_spacing=8):
    words = text.split()
    lines = []
    cur_line = []
    for word in words:
        test_line = ' '.join(cur_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            cur_line.append(word)
        else:
            if cur_line:
                lines.append(' '.join(cur_line))
                cur_line = [word]
            else:
                lines.append(word)
                cur_line = []
    if cur_line:
        lines.append(' '.join(cur_line))
    
    cur_y = y
    for line in lines:
        draw.text((x, cur_y), line, font=font, fill=fill)
        bbox = draw.textbbox((0, 0), line, font=font)
        h = bbox[3] - bbox[1]
        cur_y += h + line_spacing
    return cur_y

def load_hd_photo(key):
    path = f'exact-ethyra-site-code/assets/storybook/crops/{key}.jpg'
    if not os.path.exists(path):
        return Image.new('RGBA', (page_w, page_h), PAPER_LIGHT)
    
    img = Image.open(path).convert('RGBA')
    # Fit into page_w x page_h with center crop
    target_ratio = page_w / page_h
    img_ratio = img.width / img.height
    
    if img_ratio > target_ratio:
        new_w = int(img.height * target_ratio)
        offset = (img.width - new_w) // 2
        img = img.crop((offset, 0, offset + new_w, img.height))
    else:
        new_h = int(img.width / target_ratio)
        offset = (img.height - new_h) // 2
        img = img.crop((0, offset, img.width, offset + new_h))
        
    img = img.resize((page_w, page_h), Image.Resampling.LANCZOS)
    enh = ImageEnhance.Sharpness(img).enhance(1.2)
    return enh.convert('RGBA')

# Botanical leaf accent for page corners
def draw_leaf_watermark(draw, x, y, color):
    # Delicate botanical branch lines
    draw.arc([x, y, x + 60, y + 60], start=20, end=140, fill=color, width=2)
    draw.arc([x + 30, y - 20, x + 90, y + 40], start=40, end=160, fill=color, width=2)
    draw.arc([x + 60, y - 40, x + 120, y + 20], start=60, end=180, fill=color, width=2)

out_dir = 'exact-ethyra-site-code/assets/storybook'
os.makedirs(out_dir, exist_ok=True)

# =============================================================================
# SPREAD 1: 01 / 10 · Design. Deliver. Demonstrate.
# =============================================================================
def build_spread_1():
    book = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book)
    draw.rectangle([bx1, by1, mid_x, by2], fill=NAVY_DEEP)
    
    photo = load_hd_photo('hd_1')
    book.paste(photo, (mid_x, by1))
    
    lx = bx1 + 75
    draw.text((lx, by1 + 75), "01 / 10", font=font_sans_kicker, fill=CYAN_LIGHT)
    draw.text((lx, by1 + 115), "ETHYRA CONSULTING SERVICES", font=font_sans_head, fill=WHITE)
    draw.line([(lx, by1 + 160), (lx + 90, by1 + 160)], fill=CYAN_VIVID, width=3)
    
    draw.text((lx, by1 + 240), "Design.", font=font_serif_huge, fill=WHITE)
    draw.text((lx, by1 + 310), "Deliver.", font=font_serif_huge, fill=WHITE)
    draw.text((lx, by1 + 380), "Demonstrate.", font=font_serif_huge, fill=CYAN_LIGHT)
    
    sub = "Stronger programmes.\nClearer evidence.\nGreater social impact."
    draw.text((lx, by1 + 540), sub, font=font_serif_sub, fill=(224, 242, 254), spacing=14)
    
    draw.text((lx, by2 - 80), "Evidence-Based Impact Advisory · Singapore", font=font_sans_small, fill=CYAN_LIGHT)
    
    book.putalpha(book_mask)
    book.alpha_composite(gutter_shading)
    final_img = Image.alpha_composite(book_shadow, book)
    final_img.save(os.path.join(out_dir, 'spread_1.png'))
    print("Spread 1 generated.")

# =============================================================================
# SPREAD 2: 02 / 10 · Our Perspective
# =============================================================================
def build_spread_2():
    book = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book)
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    
    photo = load_hd_photo('hd_2')
    book.paste(photo, (mid_x, by1))
    
    lx = bx1 + 75
    mw = mid_x - lx - 55
    
    draw.text((lx, by1 + 70), "02 / 10", font=font_sans_kicker, fill=INK_FAINT)
    draw.text((lx, by1 + 105), "Our Perspective", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "An activity completed is not the same as a life changed.", lx, by1 + 160, font_serif_title, NAVY_DEEP, mw, line_spacing=10)
    
    draw.line([(lx, cy + 14), (lx + 80, cy + 14)], fill=CYAN_VIVID, width=2)
    cy += 36
    
    p1 = "A programme can meet its targets and still miss the problem it was meant to solve. A report can look impressive without telling the whole story. And numbers can show progress without explaining what made the difference."
    cy = draw_wrapped_text(draw, p1, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=8)
    cy += 20
    
    p2 = "At Ethyra, we work to close that gap. We connect community realities, practical strategy, and credible evidence to help organisations ask better questions, make informed decisions, and understand the outcomes of their social investments."
    cy = draw_wrapped_text(draw, p2, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=8)
    cy += 28
    
    draw.text((lx, cy), "Less assumption. More evidence.", font=font_serif_quote, fill=CYAN_VIVID)
    
    book.putalpha(book_mask)
    book.alpha_composite(gutter_shading)
    final_img = Image.alpha_composite(book_shadow, book)
    final_img.save(os.path.join(out_dir, 'spread_2.png'))
    print("Spread 2 generated.")

# =============================================================================
# SPREAD 3: 03 / 10 · What We Do
# =============================================================================
def build_spread_3():
    book = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book)
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    
    photo = load_hd_photo('hd_3')
    book.paste(photo, (mid_x, by1))
    
    lx = bx1 + 75
    mw = mid_x - lx - 55
    
    draw.text((lx, by1 + 70), "03 / 10", font=font_sans_kicker, fill=INK_FAINT)
    draw.text((lx, by1 + 105), "What We Do", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "Three ways to make social investment work harder.", lx, by1 + 160, font_serif_title, NAVY_DEEP, mw, line_spacing=10)
    
    draw.line([(lx, cy + 14), (lx + 80, cy + 14)], fill=CYAN_VIVID, width=2)
    cy += 32
    
    intro = "From understanding community needs to examining outcomes, we help organisations design programmes, learn from evidence, and make better social investment decisions."
    cy = draw_wrapped_text(draw, intro, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=7)
    cy += 24
    
    pillars = [
        ("01 / Programme Design", "Start with the right problem and evidence-based design."),
        ("02 / Monitoring, Evaluation & Learning", "Know what is working, while there is still time to improve it."),
        ("03 / Social Impact Assessment", "Look beyond what was delivered. Understand what changed.")
    ]
    
    for title, desc in pillars:
        draw.text((lx, cy), title, font=font_sans_head, fill=NAVY_DEEP)
        cy += 32
        cy = draw_wrapped_text(draw, desc, lx + 14, cy, font_sans_body, INK_MUTED, mw - 14, line_spacing=5)
        cy += 16
        
    draw.text((lx, by2 - 80), "Explore Our Services →", font=font_sans_head, fill=CYAN_VIVID)
    
    book.putalpha(book_mask)
    book.alpha_composite(gutter_shading)
    final_img = Image.alpha_composite(book_shadow, book)
    final_img.save(os.path.join(out_dir, 'spread_3.png'))
    print("Spread 3 generated.")

# =============================================================================
# SPREAD 4: 04 / 10 · The 4E Framework
# =============================================================================
def build_spread_4():
    book = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book)
    draw.rectangle([bx1, by1, bx2, by2], fill=NAVY_DEEP)
    
    # Right page botanical art
    draw.rectangle([mid_x, by1, bx2, by2], fill=NAVY_DARK)
    for i in range(5):
        draw_leaf_watermark(draw, mid_x + 120 + i*90, by1 + 180 + i*130, (0, 154, 224, 140))
        draw_leaf_watermark(draw, mid_x + 360 - i*60, by1 + 240 + i*110, (56, 189, 248, 120))
    
    lx = bx1 + 75
    mw = mid_x - lx - 55
    
    draw.text((lx, by1 + 70), "04 / 10", font=font_sans_kicker, fill=CYAN_LIGHT)
    draw.text((lx, by1 + 105), "Our Signature Methodology", font=font_sans_head, fill=WHITE)
    
    draw.text((lx, by1 + 160), "The 4E Framework", font=font_serif_huge, fill=WHITE)
    draw.text((lx, by1 + 225), "Explore. Establish. Evaluate. Evolve.", font=font_serif_sub, fill=CYAN_LIGHT)
    
    draw.line([(lx, by1 + 270), (lx + 80, by1 + 270)], fill=CYAN_VIVID, width=2)
    
    intro = "Meaningful social impact requires a connected approach — from understanding community needs to using evidence to improve what happens next."
    cy = draw_wrapped_text(draw, intro, lx, by1 + 295, font_serif_body, (224, 242, 254), mw, line_spacing=7)
    cy += 24
    
    stages = [
        ("01", "Explore", "Understand community realities, systemic barriers & true needs."),
        ("02", "Establish", "Design the response, target metrics & theory of change."),
        ("03", "Evaluate", "Examine credible evidence & measure real transformative shifts."),
        ("04", "Evolve", "Improve what comes next & scale sustainable change.")
    ]
    
    for num, title, desc in stages:
        draw.ellipse([lx, cy, lx + 36, cy + 36], outline=CYAN_LIGHT, width=2)
        draw.text((lx + 8, cy + 6), num, font=font_sans_sub, fill=WHITE)
        draw.text((lx + 52, cy + 6), title, font=font_sans_head, fill=WHITE)
        cy += 40
        cy = draw_wrapped_text(draw, desc, lx + 52, cy, font_sans_body, (186, 230, 253), mw - 52, line_spacing=4)
        cy += 14
        
    book.putalpha(book_mask)
    book.alpha_composite(gutter_shading)
    final_img = Image.alpha_composite(book_shadow, book)
    final_img.save(os.path.join(out_dir, 'spread_4.png'))
    print("Spread 4 generated.")

# =============================================================================
# SPREAD 5: 05 / 10 · Why Ethyra?
# =============================================================================
def build_spread_5():
    book = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book)
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    
    photo = load_hd_photo('hd_5')
    book.paste(photo, (mid_x, by1))
    
    lx = bx1 + 75
    mw = mid_x - lx - 55
    
    draw.text((lx, by1 + 70), "05 / 10", font=font_sans_kicker, fill=INK_FAINT)
    draw.text((lx, by1 + 105), "Why Ethyra?", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "Good work needs good thinking.", lx, by1 + 160, font_serif_title, NAVY_DEEP, mw, line_spacing=10)
    
    draw.line([(lx, cy + 14), (lx + 80, cy + 14)], fill=CYAN_VIVID, width=2)
    cy += 32
    
    p1 = "Social impact work operates in complex environments. Community needs evolve, implementation presents unexpected challenges, and outcomes are rarely explained by a single factor."
    cy = draw_wrapped_text(draw, p1, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=8)
    cy += 18
    
    p2 = "Our approach combines a foundation in social work, research-led practice, and a commitment to making evidence useful."
    cy = draw_wrapped_text(draw, p2, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=8)
    cy += 30
    
    badges = [
        ("Context before conclusions", "Evidence before claims"),
        ("People beyond numbers", "Learning beyond reporting")
    ]
    
    for row in badges:
        draw.rectangle([lx, cy, lx + 320, cy + 50], outline=CYAN_VIVID, fill=(240, 249, 255), width=1)
        draw.text((lx + 16, cy + 13), f"✓ {row[0]}", font=font_sans_sub, fill=NAVY_DEEP)
        draw.rectangle([lx + 340, cy, lx + 660, cy + 50], outline=CYAN_VIVID, fill=(240, 249, 255), width=1)
        draw.text((lx + 356, cy + 13), f"✓ {row[1]}", font=font_sans_sub, fill=NAVY_DEEP)
        cy += 64
        
    book.putalpha(book_mask)
    book.alpha_composite(gutter_shading)
    final_img = Image.alpha_composite(book_shadow, book)
    final_img.save(os.path.join(out_dir, 'spread_5.png'))
    print("Spread 5 generated.")

# =============================================================================
# SPREAD 6: 06 / 10 · Who We Work With
# =============================================================================
def build_spread_6():
    book = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book)
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    
    photo = load_hd_photo('hd_6')
    book.paste(photo, (mid_x, by1))
    
    lx = bx1 + 75
    mw = mid_x - lx - 55
    
    draw.text((lx, by1 + 70), "06 / 10", font=font_sans_kicker, fill=INK_FAINT)
    draw.text((lx, by1 + 105), "Who We Work With", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "Different organisations. A shared need for better evidence.", lx, by1 + 160, font_serif_title, NAVY_DEEP, mw, line_spacing=10)
    
    draw.line([(lx, cy + 14), (lx + 80, cy + 14)], fill=CYAN_VIVID, width=2)
    cy += 32
    
    intro = "We support organisations seeking to design relevant programmes, understand performance, and make informed decisions about social investment."
    cy = draw_wrapped_text(draw, intro, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=8)
    cy += 20
    
    groups = [
        ("Corporates & CSR Teams", "Strengthen programme design, monitor implementation, and assess real outcomes."),
        ("NGOs & Implementing Organisations", "Improve programme planning, monitoring systems, and outcome measurement."),
        ("Foundations & Development Funds", "Generate useful evidence, understand programme effectiveness, and scale success.")
    ]
    
    for title, desc in groups:
        draw.text((lx, cy), f"▪ {title}", font=font_sans_head, fill=NAVY_DEEP)
        cy += 32
        cy = draw_wrapped_text(draw, desc, lx + 18, cy, font_sans_body, INK_MUTED, mw - 18, line_spacing=5)
        cy += 16
        
    book.putalpha(book_mask)
    book.alpha_composite(gutter_shading)
    final_img = Image.alpha_composite(book_shadow, book)
    final_img.save(os.path.join(out_dir, 'spread_6.png'))
    print("Spread 6 generated.")

# =============================================================================
# SPREAD 7: 07 / 10 · Our Webinars
# =============================================================================
def build_spread_7():
    book = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book)
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    
    photo = load_hd_photo('hd_7')
    book.paste(photo, (mid_x, by1))
    
    lx = bx1 + 75
    mw = mid_x - lx - 55
    
    draw.text((lx, by1 + 70), "07 / 10", font=font_sans_kicker, fill=INK_FAINT)
    draw.text((lx, by1 + 105), "Our Webinars", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "Better questions lead to better change.", lx, by1 + 160, font_serif_title, NAVY_DEEP, mw, line_spacing=10)
    
    draw.line([(lx, cy + 14), (lx + 80, cy + 14)], fill=CYAN_VIVID, width=2)
    cy += 32
    
    p1 = "Social impact is an evolving conversation. From understanding community needs to measuring outcomes, there is always more to question, learn, and improve."
    cy = draw_wrapped_text(draw, p1, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=8)
    cy += 20
    
    p2 = "Ethyra's webinars bring ideas, evidence, and practical perspectives into conversations about social development and impact."
    cy = draw_wrapped_text(draw, p2, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=8)
    cy += 28
    
    draw.text((lx, cy), "Explore Upcoming Webinars →", font=font_sans_head, fill=CYAN_VIVID)
    cy += 48
    
    draw.text((lx, cy), "Less jargon. More insight. Knowledge you can use.", font=font_serif_quote, fill=NAVY_DEEP)
    
    book.putalpha(book_mask)
    book.alpha_composite(gutter_shading)
    final_img = Image.alpha_composite(book_shadow, book)
    final_img.save(os.path.join(out_dir, 'spread_7.png'))
    print("Spread 7 generated.")

# =============================================================================
# SPREAD 8: 08 / 10 · Get in Touch
# =============================================================================
def build_spread_8():
    book = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book)
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    
    photo = load_hd_photo('hd_8')
    book.paste(photo, (mid_x, by1))
    
    lx = bx1 + 75
    mw = mid_x - lx - 55
    
    draw.text((lx, by1 + 70), "08 / 10", font=font_sans_kicker, fill=INK_FAINT)
    draw.text((lx, by1 + 105), "Get in Touch", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "Every meaningful change starts with a conversation.", lx, by1 + 160, font_serif_title, NAVY_DEEP, mw, line_spacing=10)
    
    draw.line([(lx, cy + 14), (lx + 80, cy + 14)], fill=CYAN_VIVID, width=2)
    cy += 32
    
    p1 = "Have a programme to design, an initiative to evaluate, or a question about the impact you're creating? Tell us what you're working on. We'll explore how Ethyra can help."
    cy = draw_wrapped_text(draw, p1, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=8)
    cy += 28
    
    # CTA pill button
    draw.rounded_rectangle([lx, cy, lx + 260, cy + 52], radius=26, fill=NAVY_DEEP)
    draw.text((lx + 28, cy + 14), "Start a Conversation ↓", font=font_sans_sub, fill=WHITE)
    cy += 74
    
    contacts = [
        "📞   +65 8123 4567",
        "✉️   hello@ethyra.com",
        "📍   Singapore",
        "🌐   www.ethyra.com"
    ]
    for c in contacts:
        draw.text((lx, cy), c, font=font_sans_body, fill=INK_DARK)
        cy += 28
        
    draw.text((lx, by2 - 75), "Ethyra — Insights you can act on.", font=font_serif_quote, fill=CYAN_VIVID)
    
    book.putalpha(book_mask)
    book.alpha_composite(gutter_shading)
    final_img = Image.alpha_composite(book_shadow, book)
    final_img.save(os.path.join(out_dir, 'spread_8.png'))
    print("Spread 8 generated.")

build_spread_1()
build_spread_2()
build_spread_3()
build_spread_4()
build_spread_5()
build_spread_6()
build_spread_7()
build_spread_8()
print("All 8 perfect landscape spreads generated.")
