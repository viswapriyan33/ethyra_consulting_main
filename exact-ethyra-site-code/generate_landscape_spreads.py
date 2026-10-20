import os
import textwrap
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

W, H = 1760, 1240
bx1, by1, bx2, by2 = 90, 270, 1670, 970
bw = bx2 - bx1
bh = by2 - by1
mid_x = 880
radius = 24

# Palette
NAVY_DEEP = (0, 44, 139)       # #002c8b
NAVY_DARK = (0, 24, 72)        # #001848
CYAN_VIVID = (0, 154, 224)     # #009ae0
CYAN_LIGHT = (56, 189, 248)    # #38bdf8
WHITE = (255, 255, 255)
PAPER_LIGHT = (251, 250, 247)  # Warm paper
PAPER_BORDER = (235, 230, 222)
INK_DARK = (15, 23, 42)
INK_MUTED = (71, 85, 105)
INK_FAINT = (148, 163, 184)

# Typography
font_serif_huge = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 44)
font_serif_title = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 31)
font_serif_sub = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 24)
font_serif_body = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 20)
font_serif_quote = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 21)

font_sans_head = ImageFont.truetype('C:/Windows/Fonts/calibrib.ttf', 22)
font_sans_sub = ImageFont.truetype('C:/Windows/Fonts/calibrib.ttf', 16)
font_sans_body = ImageFont.truetype('C:/Windows/Fonts/calibri.ttf', 18)
font_sans_small = ImageFont.truetype('C:/Windows/Fonts/calibri.ttf', 15)

# Mask for book
book_mask = Image.new('L', (W, H), 0)
mdraw = ImageDraw.Draw(book_mask)
mdraw.rounded_rectangle([bx1, by1, bx2, by2], radius=radius, fill=255)

# Soft shadow underneath
book_shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(book_shadow)
sdraw.rounded_rectangle([bx1+12, by1+24, bx2-12, by2+38], radius=radius+8, fill=(0, 20, 60, 85))
book_shadow = book_shadow.filter(ImageFilter.GaussianBlur(24))

def create_gutter_shading():
    spine = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(spine)
    for x in range(830, 880):
        alpha = int(48 * ((x - 830) / 50.0) ** 1.8)
        sdraw.line([(x, by1), (x, by2)], fill=(0, 20, 55, alpha))
    for x in range(880, 930):
        alpha = int(38 * ((930 - x) / 50.0) ** 1.8)
        sdraw.line([(x, by1), (x, by2)], fill=(0, 20, 55, alpha))
    sdraw.line([(mid_x, by1), (mid_x, by2)], fill=(0, 15, 45, 95), width=2)
    return spine

gutter_shading = create_gutter_shading()

def draw_wrapped_text(draw, text, x, y, font, fill, max_width, line_spacing=6):
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

def load_right_crop(index):
    crop_path = f'exact-ethyra-site-code/assets/storybook/crops/right_{index}.png'
    if os.path.exists(crop_path):
        return Image.open(crop_path).convert('RGBA')
    img = Image.new('RGBA', (790, 700), PAPER_LIGHT)
    return img

os.makedirs('exact-ethyra-site-code/assets/storybook', exist_ok=True)

# =============================================================================
# SPREAD 1: 01 / 10 · Design. Deliver. Demonstrate.
# =============================================================================
def build_spread_1():
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # Left page: Deep Royal Navy #002c8b
    # Right page: Marina Bay Sands Photo
    book_content = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book_content)
    
    # Fill left page
    draw.rectangle([bx1, by1, mid_x, by2], fill=NAVY_DEEP)
    
    # Place right page photo
    right_photo = load_right_crop(1)
    book_content.paste(right_photo, (mid_x, by1))
    
    # Draw left page text
    lx = bx1 + 65
    
    draw.text((lx, by1 + 60), "01 / 10", font=font_sans_sub, fill=CYAN_LIGHT)
    draw.text((lx, by1 + 92), "ETHYRA CONSULTING SERVICES", font=font_sans_head, fill=WHITE)
    
    # Divider accent line
    draw.line([(lx, by1 + 130), (lx + 80, by1 + 130)], fill=CYAN_VIVID, width=3)
    
    # Main Headline
    draw.text((lx, by1 + 195), "Design.", font=font_serif_huge, fill=WHITE)
    draw.text((lx, by1 + 255), "Deliver.", font=font_serif_huge, fill=WHITE)
    draw.text((lx, by1 + 315), "Demonstrate.", font=font_serif_huge, fill=CYAN_LIGHT)
    
    # Subheading
    sub_text = "Stronger programmes.\nClearer evidence.\nGreater social impact."
    draw.text((lx, by1 + 440), sub_text, font=font_serif_sub, fill=(224, 242, 254), spacing=10)
    
    # Subtle tagline
    draw.text((lx, by2 - 65), "Evidence-Based Impact Advisory · Singapore", font=font_sans_small, fill=CYAN_LIGHT)
    
    # Apply book mask and shading
    book_content.putalpha(book_mask)
    book_content.alpha_composite(gutter_shading)
    
    final_img = Image.alpha_composite(book_shadow, book_content)
    final_img.save('exact-ethyra-site-code/assets/storybook/spread_1.png')
    print("Spread 1 generated.")

# =============================================================================
# SPREAD 2: 02 / 10 · Our Perspective
# =============================================================================
def build_spread_2():
    book_content = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book_content)
    
    # Left page: Warm Paper
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    
    # Right page: Smiling girl
    right_photo = load_right_crop(2)
    book_content.paste(right_photo, (mid_x, by1))
    
    lx = bx1 + 60
    mw = mid_x - lx - 45
    
    draw.text((lx, by1 + 55), "02 / 10", font=font_sans_sub, fill=INK_FAINT)
    draw.text((lx, by1 + 82), "Our Perspective", font=font_sans_head, fill=CYAN_VIVID)
    
    # Title
    cy = draw_wrapped_text(draw, "An activity completed is not the same as a life changed.", lx, by1 + 130, font_serif_title, NAVY_DEEP, mw, line_spacing=8)
    
    # Divider
    draw.line([(lx, cy + 12), (lx + 60, cy + 12)], fill=CYAN_VIVID, width=2)
    cy += 30
    
    # Paragraph 1
    p1 = "A programme can meet its targets and still miss the problem it was meant to solve. A report can look impressive without telling the whole story. And numbers can show progress without explaining what made the difference."
    cy = draw_wrapped_text(draw, p1, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=6)
    cy += 14
    
    # Paragraph 2
    p2 = "At Ethyra, we work to close that gap. We connect community realities, practical strategy, and credible evidence to help organisations ask better questions, make informed decisions, and understand the outcomes of their social investments."
    cy = draw_wrapped_text(draw, p2, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=6)
    cy += 18
    
    # Kicker
    draw.text((lx, cy), "Less assumption. More evidence.", font=font_serif_quote, fill=CYAN_VIVID)
    
    book_content.putalpha(book_mask)
    book_content.alpha_composite(gutter_shading)
    
    final_img = Image.alpha_composite(book_shadow, book_content)
    final_img.save('exact-ethyra-site-code/assets/storybook/spread_2.png')
    print("Spread 2 generated.")

# =============================================================================
# SPREAD 3: 03 / 10 · What We Do
# =============================================================================
def build_spread_3():
    book_content = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book_content)
    
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    right_photo = load_right_crop(3)
    book_content.paste(right_photo, (mid_x, by1))
    
    lx = bx1 + 60
    mw = mid_x - lx - 45
    
    draw.text((lx, by1 + 55), "03 / 10", font=font_sans_sub, fill=INK_FAINT)
    draw.text((lx, by1 + 82), "What We Do", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "Three ways to make social investment work harder.", lx, by1 + 130, font_serif_title, NAVY_DEEP, mw, line_spacing=8)
    
    draw.line([(lx, cy + 10), (lx + 60, cy + 10)], fill=CYAN_VIVID, width=2)
    cy += 25
    
    intro = "From understanding community needs to examining outcomes, we help organisations design programmes, learn from evidence, and make better social investment decisions."
    cy = draw_wrapped_text(draw, intro, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=5)
    cy += 18
    
    # 3 Pillars
    pillars = [
        ("01 / Programme Design", "Start with the right problem and evidence-based design."),
        ("02 / Monitoring, Evaluation & Learning", "Know what is working, while there is still time to improve it."),
        ("03 / Social Impact Assessment", "Look beyond what was delivered. Understand what changed.")
    ]
    
    for num_title, desc in pillars:
        draw.text((lx, cy), num_title, font=font_sans_head, fill=NAVY_DEEP)
        cy += 26
        cy = draw_wrapped_text(draw, desc, lx + 12, cy, font_sans_body, INK_MUTED, mw - 12, line_spacing=4)
        cy += 12
    
    draw.text((lx, by2 - 60), "Explore Our Services →", font=font_sans_head, fill=CYAN_VIVID)
    
    book_content.putalpha(book_mask)
    book_content.alpha_composite(gutter_shading)
    
    final_img = Image.alpha_composite(book_shadow, book_content)
    final_img.save('exact-ethyra-site-code/assets/storybook/spread_3.png')
    print("Spread 3 generated.")

# =============================================================================
# SPREAD 4: 04 / 10 · The 4E Framework
# =============================================================================
def build_spread_4():
    book_content = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book_content)
    
    # Both pages deep navy
    draw.rectangle([bx1, by1, bx2, by2], fill=NAVY_DEEP)
    
    right_photo = load_right_crop(4)
    book_content.paste(right_photo, (mid_x, by1))
    
    lx = bx1 + 60
    mw = mid_x - lx - 45
    
    draw.text((lx, by1 + 55), "04 / 10", font=font_sans_sub, fill=CYAN_LIGHT)
    draw.text((lx, by1 + 82), "Our Signature Methodology", font=font_sans_head, fill=WHITE)
    
    draw.text((lx, by1 + 130), "The 4E Framework", font=font_serif_huge, fill=WHITE)
    draw.text((lx, by1 + 185), "Explore. Establish. Evaluate. Evolve.", font=font_serif_sub, fill=CYAN_LIGHT)
    
    draw.line([(lx, by1 + 225), (lx + 60, by1 + 225)], fill=CYAN_VIVID, width=2)
    
    intro = "Meaningful social impact requires a connected approach — from understanding community needs to using evidence to improve what happens next."
    cy = draw_wrapped_text(draw, intro, lx, by1 + 245, font_serif_body, (224, 242, 254), mw, line_spacing=6)
    cy += 16
    
    stages = [
        ("01", "Explore", "Understand community realities, systemic barriers & true needs."),
        ("02", "Establish", "Design the response, target metrics & theory of change."),
        ("03", "Evaluate", "Examine credible evidence & measure real transformative shifts."),
        ("04", "Evolve", "Improve what comes next & scale sustainable change.")
    ]
    
    for num, title, desc in stages:
        # circle badge
        draw.ellipse([lx, cy, lx + 30, cy + 30], outline=CYAN_LIGHT, width=2)
        draw.text((lx + 6, cy + 4), num, font=font_sans_small, fill=WHITE)
        draw.text((lx + 42, cy + 4), title, font=font_sans_head, fill=WHITE)
        cy += 32
        cy = draw_wrapped_text(draw, desc, lx + 42, cy, font_sans_body, (186, 230, 253), mw - 42, line_spacing=4)
        cy += 10
    
    book_content.putalpha(book_mask)
    book_content.alpha_composite(gutter_shading)
    
    final_img = Image.alpha_composite(book_shadow, book_content)
    final_img.save('exact-ethyra-site-code/assets/storybook/spread_4.png')
    print("Spread 4 generated.")

# =============================================================================
# SPREAD 5: 05 / 10 · Why Ethyra?
# =============================================================================
def build_spread_5():
    book_content = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book_content)
    
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    right_photo = load_right_crop(5)
    book_content.paste(right_photo, (mid_x, by1))
    
    lx = bx1 + 60
    mw = mid_x - lx - 45
    
    draw.text((lx, by1 + 55), "05 / 10", font=font_sans_sub, fill=INK_FAINT)
    draw.text((lx, by1 + 82), "Why Ethyra?", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "Good work needs good thinking.", lx, by1 + 130, font_serif_title, NAVY_DEEP, mw, line_spacing=8)
    
    draw.line([(lx, cy + 10), (lx + 60, cy + 10)], fill=CYAN_VIVID, width=2)
    cy += 25
    
    p1 = "Social impact work operates in complex environments. Community needs evolve, implementation presents unexpected challenges, and outcomes are rarely explained by a single factor."
    cy = draw_wrapped_text(draw, p1, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=6)
    cy += 14
    
    p2 = "Our approach combines a foundation in social work, research-led practice, and a commitment to making evidence useful."
    cy = draw_wrapped_text(draw, p2, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=6)
    cy += 24
    
    # 4 Badges in a 2x2 grid
    badges = [
        ("Context before conclusions", "Evidence before claims"),
        ("People beyond numbers", "Learning beyond reporting")
    ]
    
    for row in badges:
        # col 1
        draw.rectangle([lx, cy, lx + 280, cy + 44], outline=CYAN_VIVID, fill=(240, 249, 255), width=1)
        draw.text((lx + 12, cy + 11), f"✓ {row[0]}", font=font_sans_sub, fill=NAVY_DEEP)
        # col 2
        draw.rectangle([lx + 300, cy, lx + 580, cy + 44], outline=CYAN_VIVID, fill=(240, 249, 255), width=1)
        draw.text((lx + 312, cy + 11), f"✓ {row[1]}", font=font_sans_sub, fill=NAVY_DEEP)
        cy += 56
        
    book_content.putalpha(book_mask)
    book_content.alpha_composite(gutter_shading)
    
    final_img = Image.alpha_composite(book_shadow, book_content)
    final_img.save('exact-ethyra-site-code/assets/storybook/spread_5.png')
    print("Spread 5 generated.")

# =============================================================================
# SPREAD 6: 06 / 10 · Who We Work With
# =============================================================================
def build_spread_6():
    book_content = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book_content)
    
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    right_photo = load_right_crop(6)
    book_content.paste(right_photo, (mid_x, by1))
    
    lx = bx1 + 60
    mw = mid_x - lx - 45
    
    draw.text((lx, by1 + 55), "06 / 10", font=font_sans_sub, fill=INK_FAINT)
    draw.text((lx, by1 + 82), "Who We Work With", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "Different organisations. A shared need for better evidence.", lx, by1 + 130, font_serif_title, NAVY_DEEP, mw, line_spacing=8)
    
    draw.line([(lx, cy + 10), (lx + 60, cy + 10)], fill=CYAN_VIVID, width=2)
    cy += 25
    
    intro = "We support organisations seeking to design relevant programmes, understand performance, and make informed decisions about social investment."
    cy = draw_wrapped_text(draw, intro, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=6)
    cy += 16
    
    groups = [
        ("Corporates and CSR Teams", "Strengthen programme design, monitor implementation, and assess real outcomes."),
        ("NGOs & Implementing Organisations", "Improve programme planning, monitoring systems, outcome measurement, and reporting."),
        ("Foundations & Development Funds", "Generate useful evidence, understand programme effectiveness, and scale success.")
    ]
    
    for title, desc in groups:
        draw.text((lx, cy), f"▪ {title}", font=font_sans_head, fill=NAVY_DEEP)
        cy += 26
        cy = draw_wrapped_text(draw, desc, lx + 16, cy, font_sans_body, INK_MUTED, mw - 16, line_spacing=4)
        cy += 14
        
    book_content.putalpha(book_mask)
    book_content.alpha_composite(gutter_shading)
    
    final_img = Image.alpha_composite(book_shadow, book_content)
    final_img.save('exact-ethyra-site-code/assets/storybook/spread_6.png')
    print("Spread 6 generated.")

# =============================================================================
# SPREAD 7: 07 / 10 · Our Webinars
# =============================================================================
def build_spread_7():
    book_content = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book_content)
    
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    right_photo = load_right_crop(7)
    book_content.paste(right_photo, (mid_x, by1))
    
    lx = bx1 + 60
    mw = mid_x - lx - 45
    
    draw.text((lx, by1 + 55), "07 / 10", font=font_sans_sub, fill=INK_FAINT)
    draw.text((lx, by1 + 82), "Our Webinars", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "Better questions lead to better change.", lx, by1 + 130, font_serif_title, NAVY_DEEP, mw, line_spacing=8)
    
    draw.line([(lx, cy + 10), (lx + 60, cy + 10)], fill=CYAN_VIVID, width=2)
    cy += 25
    
    p1 = "Social impact is an evolving conversation. From understanding community needs to measuring outcomes, there is always more to question, learn, and improve."
    cy = draw_wrapped_text(draw, p1, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=6)
    cy += 16
    
    p2 = "Ethyra's webinars bring ideas, evidence, and practical perspectives into conversations about social development and impact."
    cy = draw_wrapped_text(draw, p2, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=6)
    cy += 24
    
    draw.text((lx, cy), "Explore Upcoming Webinars →", font=font_sans_head, fill=CYAN_VIVID)
    cy += 40
    
    draw.text((lx, cy), "Less jargon. More insight. Knowledge you can use.", font=font_serif_quote, fill=NAVY_DEEP)
    
    book_content.putalpha(book_mask)
    book_content.alpha_composite(gutter_shading)
    
    final_img = Image.alpha_composite(book_shadow, book_content)
    final_img.save('exact-ethyra-site-code/assets/storybook/spread_7.png')
    print("Spread 7 generated.")

# =============================================================================
# SPREAD 8: 08 / 10 · Get in Touch
# =============================================================================
def build_spread_8():
    book_content = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(book_content)
    
    draw.rectangle([bx1, by1, mid_x, by2], fill=PAPER_LIGHT)
    right_photo = load_right_crop(8)
    book_content.paste(right_photo, (mid_x, by1))
    
    lx = bx1 + 60
    mw = mid_x - lx - 45
    
    draw.text((lx, by1 + 55), "08 / 10", font=font_sans_sub, fill=INK_FAINT)
    draw.text((lx, by1 + 82), "Get in Touch", font=font_sans_head, fill=CYAN_VIVID)
    
    cy = draw_wrapped_text(draw, "Every meaningful change starts with a conversation.", lx, by1 + 130, font_serif_title, NAVY_DEEP, mw, line_spacing=8)
    
    draw.line([(lx, cy + 10), (lx + 60, cy + 10)], fill=CYAN_VIVID, width=2)
    cy += 25
    
    p1 = "Have a programme to design, an initiative to evaluate, or a question about the impact you're creating? Tell us what you're working on. We'll explore how Ethyra can help."
    cy = draw_wrapped_text(draw, p1, lx, cy, font_serif_body, INK_DARK, mw, line_spacing=6)
    cy += 24
    
    # CTA pill button
    draw.rounded_rectangle([lx, cy, lx + 220, cy + 46], radius=23, fill=NAVY_DEEP)
    draw.text((lx + 24, cy + 12), "Start a Conversation ↓", font=font_sans_sub, fill=WHITE)
    cy += 64
    
    # Contact info list
    contacts = [
        "📞   +65 8123 4567",
        "✉️   hello@ethyra.com",
        "📍   Singapore",
        "🌐   www.ethyra.com"
    ]
    for c in contacts:
        draw.text((lx, cy), c, font=font_sans_body, fill=INK_DARK)
        cy += 24
        
    draw.text((lx, by2 - 55), "Ethyra — Insights you can act on.", font=font_serif_quote, fill=CYAN_VIVID)
    
    book_content.putalpha(book_mask)
    book_content.alpha_composite(gutter_shading)
    
    final_img = Image.alpha_composite(book_shadow, book_content)
    final_img.save('exact-ethyra-site-code/assets/storybook/spread_8.png')
    print("Spread 8 generated.")

build_spread_1()
build_spread_2()
build_spread_3()
build_spread_4()
build_spread_5()
build_spread_6()
build_spread_7()
build_spread_8()
print("All 8 landscape spreads generated in high clarity.")
