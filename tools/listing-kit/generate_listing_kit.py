#!/usr/bin/env python3
"""Generate a Listing Launch Kit from one JSON file.

Outputs:
  listings/<slug>.html
  listings/<slug>-flyer.html
  images/qr-<slug>.png

The generated files are static. Review them before deploying.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=False)


def attr(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def digits(value: object) -> str:
    return re.sub(r"\D+", "", str(value or ""))


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "listing"


def web_path(path: str, prefix: str = "/") -> str:
    value = str(path or "").replace("\\", "/").strip()
    if value.startswith("http://") or value.startswith("https://") or value.startswith("#"):
        return value
    if value.startswith("../") or value.startswith("/"):
        return value
    return prefix + value


def root_web_path(path: str) -> str:
    value = str(path or "").replace("\\", "/").strip()
    if value.startswith("http://") or value.startswith("https://") or value.startswith("#"):
        return value
    if value.startswith("/"):
        return value.lstrip("/")
    return value


def short_price(value: str) -> str:
    clean = digits(value)
    if not clean:
        return esc(value)
    amount = int(clean)
    if amount >= 1_000_000:
        return f"${amount / 1_000_000:.1f}M".replace(".0M", "M")
    if amount >= 1000:
        return f"${round(amount / 1000)}K"
    return f"${amount}"


def link_card(title: str, copy: str, label: str, href: str, primary: bool = False) -> str:
    if not href:
        return ""
    cls = "btn btn-gold" if primary else "btn btn-outline-gold"
    return f"""
                    <div class="marketing-card">
                        <strong>{esc(title)}</strong>
                        <p>{esc(copy)}</p>
                        <a class="{cls}" href="{attr(href)}">{esc(label)}</a>
                    </div>"""


def generate_qr(data: dict, slug: str, target_url: str) -> str:
    try:
        import qrcode  # type: ignore
    except ImportError:
        fail(
            "Missing Python package: qrcode. Install it with:\n"
            "  python -m pip install qrcode[pil]\n"
            "Then rerun this generator."
        )

    qr_name = f"qr-{slug}.png"
    output = PROJECT_ROOT / "images" / qr_name
    output.parent.mkdir(parents=True, exist_ok=True)

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=12,
        border=4,
    )
    qr.add_data(target_url)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    image.save(output)
    return qr_name


def render_property_page(data: dict, slug: str, qr_name: str, live_url: str) -> str:
    address = data.get("address", "123 Showcase Lane")
    city = data.get("city_state_zip", "")
    status = data.get("status", "Just Listed")
    agent_name = data.get("agent_name", "Your Name")
    brokerage = data.get("brokerage", "Your Brokerage")
    phone = data.get("agent_phone", "")
    email = data.get("agent_email", "")
    phone_digits = digits(phone)
    hero = web_path(data.get("hero_image", "images/portfolio-exterior.jpg"), "../")
    gallery = data.get("gallery_images") or [data.get("hero_image", "images/portfolio-exterior.jpg")]
    gallery = gallery[:6]
    sample = bool(data.get("sample", False))

    details = [
        ("Price", data.get("price", "")),
        ("Beds / Baths", f"{data.get('beds', '')} / {data.get('baths', '')}".strip(" /")),
        ("Living Area", f"{data.get('sqft', '')} sq ft".strip()),
        ("Lot Size", data.get("lot_size", "")),
        ("Year Built", data.get("year_built", "")),
        ("MLS", data.get("mls", "")),
    ]
    detail_items = "\n".join(
        f'                    <div class="detail-item"><span>{esc(label)}</span><strong>{esc(value)}</strong></div>'
        for label, value in details
        if value
    )

    stat_items = [
        (short_price(data.get("price", "")), "Price"),
        (data.get("beds", ""), "Beds"),
        (data.get("baths", ""), "Baths"),
        (data.get("sqft", ""), "Sq Ft"),
        (data.get("lot_size", ""), "Lot"),
    ]
    stat_pills = "\n".join(
        f'                        <span class="property-stat-pill">{esc(value)} {esc(label)}</span>'
        for value, label in stat_items
        if value
    )

    thumbs = "\n".join(
        f"""                <button class="media-thumb" type="button" data-full="{attr(web_path(image, '../'))}">
                    <img src="{attr(web_path(image, '../'))}" alt="{attr(address)} listing media">
                    <span>{esc(label)}</span>
                </button>"""
        for image, label in zip(gallery[:4], ["Exterior", "Interior", "Aerial", "Kitchen"])
    )

    tour_cards = "\n".join(
        f"""                    <article class="tour-card{' wide' if i % 3 == 0 else ''}">
                        <img src="{attr(web_path(image, '../'))}" alt="{attr(address)} media preview">
                        <div class="tour-card-body">
                            <h3>{esc(title)}</h3>
                            <p>{esc(copy)}</p>
                        </div>
                    </article>"""
        for i, (image, title, copy) in enumerate(
            zip(
                gallery[:4],
                ["Photo Gallery", "Drone Context", "3D / Video Ready", "Buyer Highlights"],
                [
                    "High-resolution images organized around the spaces buyers care about most.",
                    "Show the lot, nearby streets, roofline, yard, access, and neighborhood context.",
                    "Add video, Zillow 3D, Matterport, or floor plan links when available.",
                    "Feature the details that get lost inside standard portal pages.",
                ],
            )
        )
    )

    link_cards = "".join(
        [
            link_card("View On Zillow / MLS", "Send buyers to the public listing after they see the clean media presentation.", "Open Listing", data.get("zillow_url", "")),
            link_card("Open Flyer", "Open-house guests can save the flyer directly from the QR page.", "Open Flyer", f"{slug}-flyer.html"),
            link_card("Request Showing", "Give buyers the highest-value next action: a direct agent conversation.", "Text Agent", f"sms:{phone_digits}", True) if phone_digits else "",
            link_card("Watch Video", "Link to a branded listing video or social-ready reel.", "Watch Video", data.get("video_url", "")),
            link_card("3D Tour", "Help remote buyers walk through the home before scheduling.", "Open Tour", data.get("tour_url", "")),
            link_card("Floor Plan", "Let buyers understand layout before they arrive.", "View Plan", data.get("floor_plan_url", "")),
        ]
    )

    sample_ribbon = '<div class="sample-ribbon">Sample</div>' if sample else ""
    robots = "noindex, nofollow" if sample else "index, follow"
    qr_block = f"""
                    <a class="qr-mini" href="{attr(live_url)}" aria-label="Open QR destination">
                        <img src="../images/{attr(qr_name)}" alt="QR code for {attr(address)}">
                        <span>QR-ready property page</span>
                    </a>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(address)} | Property Showcase</title>
    <meta name="robots" content="{robots}">
    <meta name="description" content="{attr(address)} property media showcase with photos, drone views, listing links, and agent contact.">
    <link rel="icon" type="image/png" href="../images/logo.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css">
    <style>
        :root {{ --listing-ink:#111827; --listing-muted:#667085; --listing-line:#e7ebf2; --listing-paper:#f6f7fa; }}
        body {{ background:var(--white); color:var(--listing-ink); }}
        .listing-topbar {{ position:fixed; top:0; left:0; right:0; z-index:20; background:rgba(5,7,12,.86); border-bottom:1px solid rgba(255,255,255,.08); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }}
        .listing-topbar-inner {{ max-width:1240px; margin:0 auto; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:18px; }}
        .listing-brand {{ display:flex; align-items:center; gap:12px; color:var(--white); min-width:0; }}
        .listing-brand img {{ width:42px; height:42px; object-fit:contain; flex:0 0 auto; }}
        .listing-brand strong {{ display:block; font-family:'Montserrat',sans-serif; font-size:.92rem; line-height:1.15; white-space:nowrap; }}
        .listing-brand-sub {{ display:block; color:rgba(255,255,255,.54); font-family:'Montserrat',sans-serif; font-size:.62rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; margin-top:2px; }}
        .listing-top-actions {{ display:flex; align-items:center; gap:10px; flex:0 0 auto; }}
        .listing-top-actions .btn {{ padding:10px 18px; font-size:.72rem; }}
        .property-hero {{ min-height:92vh; position:relative; display:flex; align-items:flex-end; background:linear-gradient(180deg,rgba(5,7,12,.15) 0%,rgba(5,7,12,.28) 40%,rgba(5,7,12,.86) 100%),url("{attr(hero)}") center/cover no-repeat; color:var(--white); padding:140px 24px 46px; }}
        .property-hero-inner {{ max-width:1240px; width:100%; margin:0 auto; display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:32px; align-items:end; }}
        .sample-ribbon {{ position:fixed; top:76px; right:-54px; z-index:25; width:220px; transform:rotate(35deg); background:var(--gold); color:#fff; font-family:'Montserrat',sans-serif; font-size:.72rem; font-weight:900; letter-spacing:.14em; text-align:center; text-transform:uppercase; padding:8px 0; }}
        .property-kicker {{ display:inline-flex; align-items:center; gap:10px; color:var(--gold); font-family:'Montserrat',sans-serif; font-size:.72rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; margin-bottom:14px; }}
        .property-kicker::before {{ content:""; width:34px; height:1px; background:var(--gold); }}
        .property-hero h1 {{ font-family:'Montserrat',sans-serif; font-size:clamp(2.5rem,6vw,5.6rem); font-weight:900; line-height:.95; max-width:850px; margin-bottom:18px; color:var(--white); }}
        .property-location {{ color:rgba(255,255,255,.76); font-size:clamp(1rem,2vw,1.3rem); margin-bottom:24px; }}
        .property-quick-stats {{ display:flex; flex-wrap:wrap; gap:10px; }}
        .property-stat-pill {{ border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.1); border-radius:8px; padding:10px 14px; color:rgba(255,255,255,.86); font-family:'Montserrat',sans-serif; font-size:.78rem; font-weight:800; letter-spacing:.04em; text-transform:uppercase; }}
        .agent-panel {{ background:rgba(5,7,12,.74); border:1px solid rgba(255,255,255,.14); border-radius:8px; padding:22px; backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }}
        .agent-eyebrow {{ color:var(--gold); font-family:'Montserrat',sans-serif; font-size:.68rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; margin-bottom:12px; }}
        .agent-panel h2 {{ font-family:'Montserrat',sans-serif; font-size:1.28rem; font-weight:900; color:var(--white); margin-bottom:6px; }}
        .agent-panel p {{ color:rgba(255,255,255,.62); font-size:.88rem; line-height:1.6; margin-bottom:18px; }}
        .agent-contact-row {{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }}
        .agent-contact-row .btn {{ text-align:center; padding-left:14px; padding-right:14px; }}
        .qr-mini {{ display:flex; align-items:center; gap:10px; border-top:1px solid rgba(255,255,255,.12); padding-top:14px; color:rgba(255,255,255,.72); font-family:'Montserrat',sans-serif; font-size:.72rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }}
        .qr-mini img {{ width:54px; height:54px; border-radius:6px; background:#fff; padding:4px; }}
        .media-strip {{ background:var(--white); border-bottom:1px solid var(--listing-line); }}
        .media-strip-inner {{ max-width:1240px; margin:0 auto; padding:24px; display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }}
        .media-thumb {{ position:relative; border:0; border-radius:8px; overflow:hidden; cursor:pointer; background:#0f172a; aspect-ratio:4/3; }}
        .media-thumb img {{ width:100%; height:100%; object-fit:cover; transition:transform .35s ease; }}
        .media-thumb:hover img {{ transform:scale(1.04); }}
        .media-thumb span {{ position:absolute; left:12px; bottom:10px; color:var(--white); font-family:'Montserrat',sans-serif; font-size:.68rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; text-shadow:0 2px 12px rgba(0,0,0,.8); }}
        .property-section {{ padding:78px 24px; }}
        .property-section.light {{ background:var(--listing-paper); }}
        .property-inner {{ max-width:1120px; margin:0 auto; }}
        .property-split {{ display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:54px; align-items:start; }}
        .property-label {{ color:var(--gold); font-family:'Montserrat',sans-serif; font-size:.72rem; font-weight:900; letter-spacing:.16em; text-transform:uppercase; margin-bottom:12px; }}
        .property-section h2 {{ color:var(--listing-ink); font-family:'Montserrat',sans-serif; font-size:clamp(1.75rem,4vw,3rem); font-weight:900; line-height:1.08; margin-bottom:18px; }}
        .property-copy {{ color:#465064; font-size:1.02rem; line-height:1.85; max-width:720px; }}
        .detail-list {{ border:1px solid var(--listing-line); border-radius:8px; background:var(--white); }}
        .detail-item {{ display:flex; justify-content:space-between; gap:18px; padding:16px 18px; border-bottom:1px solid var(--listing-line); }}
        .detail-item:last-child {{ border-bottom:0; }}
        .detail-item span {{ color:var(--listing-muted); font-size:.85rem; }}
        .detail-item strong {{ font-family:'Montserrat',sans-serif; color:var(--listing-ink); font-size:.9rem; text-align:right; }}
        .tour-grid {{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }}
        .tour-card {{ border:1px solid var(--listing-line); border-radius:8px; overflow:hidden; background:var(--white); }}
        .tour-card.wide {{ grid-column:span 2; }}
        .tour-card img {{ width:100%; aspect-ratio:16/10; object-fit:cover; }}
        .tour-card-body {{ padding:18px; }}
        .tour-card h3 {{ font-family:'Montserrat',sans-serif; font-size:1rem; font-weight:900; margin-bottom:6px; color:var(--listing-ink); }}
        .tour-card p {{ color:var(--listing-muted); font-size:.88rem; line-height:1.65; }}
        .marketing-row {{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }}
        .marketing-card {{ border:1px solid var(--listing-line); border-radius:8px; background:var(--white); padding:24px; }}
        .marketing-card strong {{ display:block; color:var(--listing-ink); font-family:'Montserrat',sans-serif; font-size:1rem; font-weight:900; margin-bottom:8px; }}
        .marketing-card p {{ color:var(--listing-muted); font-size:.9rem; line-height:1.65; margin-bottom:16px; }}
        .property-cta-band {{ background:linear-gradient(90deg,rgba(5,7,12,.92),rgba(5,7,12,.72)),url("{attr(web_path(gallery[-1] if gallery else data.get('hero_image', 'images/portfolio-drone.jpg'), '../'))}") center/cover no-repeat; color:var(--white); }}
        .property-cta-inner {{ max-width:1120px; margin:0 auto; padding:72px 24px; display:flex; align-items:center; justify-content:space-between; gap:32px; }}
        .property-cta-inner h2 {{ color:var(--white); font-family:'Montserrat',sans-serif; font-size:clamp(1.8rem,4vw,3.2rem); font-weight:900; line-height:1.08; margin-bottom:10px; }}
        .property-cta-inner p {{ color:rgba(255,255,255,.72); max-width:620px; line-height:1.7; }}
        .property-footer {{ background:#05070c; color:rgba(255,255,255,.56); padding:26px 24px; text-align:center; font-size:.82rem; }}
        .property-footer a {{ color:var(--gold); font-weight:700; }}
        .mobile-action-bar {{ display:none; }}
        .lightbox {{ position:fixed; inset:0; z-index:100; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,.86); padding:24px; }}
        .lightbox.is-open {{ display:flex; }}
        .lightbox img {{ max-width:min(100%,1120px); max-height:82vh; border-radius:8px; object-fit:contain; }}
        .lightbox button {{ position:absolute; top:18px; right:18px; width:42px; height:42px; border:1px solid rgba(255,255,255,.28); border-radius:50%; background:rgba(255,255,255,.08); color:var(--white); font-size:24px; cursor:pointer; }}
        @media (max-width:900px) {{ .property-hero {{ min-height:86vh; }} .property-hero-inner,.property-split {{ grid-template-columns:1fr; }} .agent-panel {{ max-width:460px; }} .media-strip-inner {{ grid-template-columns:repeat(2,1fr); }} .tour-grid,.marketing-row {{ grid-template-columns:1fr; }} .tour-card.wide {{ grid-column:auto; }} .property-cta-inner {{ align-items:flex-start; flex-direction:column; }} }}
        @media (max-width:640px) {{ html,body {{ overflow-x:hidden; }} .property-hero-inner,.agent-panel {{ max-width:100%; min-width:0; }} .property-quick-stats {{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }} .property-stat-pill {{ text-align:center; font-size:.7rem; padding:9px 8px; }} .agent-panel p {{ overflow-wrap:break-word; }} }}
        @media (max-width:640px) {{ .listing-topbar-inner {{ padding:10px 16px; }} .listing-brand img {{ width:36px; height:36px; }} .listing-brand strong {{ font-size:.82rem; }} .listing-brand-sub {{ font-size:.5rem; letter-spacing:.1em; }} .listing-top-actions {{ display:none; }} .property-hero {{ min-height:88vh; padding:112px 18px 34px; }} .property-hero h1 {{ font-size:clamp(2.35rem,15vw,4rem); }} .agent-contact-row {{ grid-template-columns:1fr; }} .media-strip-inner {{ padding:18px; gap:10px; }} .media-thumb span {{ font-size:.58rem; left:9px; bottom:8px; }} .property-section {{ padding:58px 18px; }} .detail-item {{ align-items:flex-start; flex-direction:column; gap:4px; }} .detail-item strong {{ text-align:left; }} .property-cta-inner {{ padding:58px 18px 84px; }} .mobile-action-bar {{ position:fixed; left:0; right:0; bottom:0; z-index:30; display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:10px; background:rgba(5,7,12,.92); border-top:1px solid rgba(255,255,255,.12); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); }} .mobile-action-bar .btn {{ padding:12px 8px; text-align:center; font-size:.68rem; }} }}
    </style>
</head>
<body>
    {sample_ribbon}
    <header class="listing-topbar">
        <div class="listing-topbar-inner">
            <a class="listing-brand" href="../index.html" aria-label="Flying Ace's homepage">
                <img src="../images/logo.png" alt="Flying Ace's logo">
                <span>
                    <strong>Flying <span class="gold">Ace's</span></strong>
                    <span class="listing-brand-sub">Property Showcase</span>
                </span>
            </a>
            <div class="listing-top-actions">
                <a class="btn btn-outline" href="#gallery">View Gallery</a>
                <a class="btn btn-gold" href="tel:{attr(phone_digits)}">Call Agent</a>
            </div>
        </div>
    </header>

    <main>
        <section class="property-hero">
            <div class="property-hero-inner">
                <div>
                    <p class="property-kicker">{esc(status)}</p>
                    <h1>{esc(address)}</h1>
                    <p class="property-location">{esc(city)}</p>
                    <div class="property-quick-stats" aria-label="Property summary">
{stat_pills}
                    </div>
                </div>

                <aside class="agent-panel" aria-label="Listing agent contact">
                    <p class="agent-eyebrow">Presented By</p>
                    <h2>{esc(agent_name)}</h2>
                    <p>{esc(brokerage)}. Schedule a showing, request disclosures, or ask for the full property packet.</p>
                    <div class="agent-contact-row">
                        <a class="btn btn-gold" href="tel:{attr(phone_digits)}">Call</a>
                        <a class="btn btn-outline-gold" href="sms:{attr(phone_digits)}">Text</a>
                    </div>
{qr_block}
                </aside>
            </div>
        </section>

        <section class="media-strip" id="gallery" aria-label="Featured media">
            <div class="media-strip-inner">
{thumbs}
            </div>
        </section>

        <section class="property-section">
            <div class="property-inner property-split">
                <div>
                    <p class="property-label">Property Overview</p>
                    <h2>Polished listing media, one scan away.</h2>
                    <p class="property-copy">{esc(data.get('description', ''))}</p>
                </div>
                <div class="detail-list" aria-label="Property details">
{detail_items}
                </div>
            </div>
        </section>

        <section class="property-section light">
            <div class="property-inner">
                <p class="property-label">Media Tour</p>
                <h2>Everything a buyer needs before they schedule.</h2>
                <div class="tour-grid">
{tour_cards}
                </div>
            </div>
        </section>

        <section class="property-section">
            <div class="property-inner">
                <p class="property-label">Quick Links</p>
                <h2>Useful links without sending buyers away first.</h2>
                <div class="marketing-row">
{link_cards}
                </div>
            </div>
        </section>

        <section class="property-cta-band">
            <div class="property-cta-inner">
                <div>
                    <h2>Want to see it in person?</h2>
                    <p>Contact {esc(agent_name)} for availability, disclosures, showing times, and offer instructions.</p>
                </div>
                <a class="btn btn-gold" href="tel:{attr(phone_digits)}">Call Agent</a>
            </div>
        </section>
    </main>

    <footer class="property-footer">
        <p>Listing media by <a href="../index.html">Flying Ace's Photography &amp; Drone Services</a> &middot; <a href="mailto:pilot@acesdroneservice.com">pilot@acesdroneservice.com</a></p>
    </footer>

    <div class="mobile-action-bar" aria-label="Quick contact actions">
        <a class="btn btn-outline" href="#gallery">Gallery</a>
        <a class="btn btn-gold" href="tel:{attr(phone_digits)}">Call Agent</a>
    </div>

    <div class="lightbox" id="lightbox" aria-hidden="true">
        <button type="button" aria-label="Close gallery">&times;</button>
        <img src="{attr(web_path(gallery[0] if gallery else data.get('hero_image', ''), '../'))}" alt="">
    </div>

    <script>
        var lightbox = document.getElementById("lightbox");
        var lightboxImage = lightbox.querySelector("img");
        var closeButton = lightbox.querySelector("button");
        document.querySelectorAll(".media-thumb").forEach(function(button) {{
            button.addEventListener("click", function() {{
                lightboxImage.src = button.getAttribute("data-full");
                lightboxImage.alt = button.querySelector("img").alt;
                lightbox.classList.add("is-open");
                lightbox.setAttribute("aria-hidden", "false");
            }});
        }});
        function closeLightbox() {{
            lightbox.classList.remove("is-open");
            lightbox.setAttribute("aria-hidden", "true");
        }}
        closeButton.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", function(event) {{
            if (event.target === lightbox) closeLightbox();
        }});
        document.addEventListener("keydown", function(event) {{
            if (event.key === "Escape") closeLightbox();
        }});
    </script>
</body>
</html>
"""


def render_flyer_page(data: dict, slug: str, qr_name: str) -> str:
    address = data.get("address", "123 Showcase Lane")
    city = data.get("city_state_zip", "")
    status = data.get("status", "Just Listed")
    agent_name = data.get("agent_name", "Your Name")
    brokerage = data.get("brokerage", "Your Brokerage")
    phone = data.get("agent_phone", "")
    email = data.get("agent_email", "")
    hero = web_path(data.get("hero_image", "images/portfolio-exterior.jpg"), "../")
    gallery = data.get("gallery_images") or [data.get("hero_image", "images/portfolio-exterior.jpg")]
    highlights = data.get("highlights") or []
    sample = bool(data.get("sample", False))
    sample_ribbon = '<div class="sample-ribbon">Sample</div>' if sample else ""
    robots = "noindex, nofollow" if sample else "index, follow"

    stat_items = [
        (short_price(data.get("price", "")), "Price"),
        (data.get("beds", ""), "Beds"),
        (data.get("baths", ""), "Baths"),
        (data.get("sqft", ""), "Sq Ft"),
        (data.get("lot_size", ""), "Acres" if "acre" in str(data.get("lot_size", "")).lower() else "Lot"),
    ]
    stat_html = "\n".join(
        f'                <div class="stat"><strong>{esc(value)}</strong><span>{esc(label)}</span></div>'
        for value, label in stat_items
        if value
    )
    highlight_html = "\n".join(f"                        <li>{esc(item)}</li>" for item in highlights[:8])
    strip_images = "\n".join(
        f'                <img src="{attr(web_path(image, "../"))}" alt="{attr(address)} listing preview">'
        for image in gallery[1:4]
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Listing Flyer | {esc(address)}</title>
    <meta name="robots" content="{robots}">
    <link rel="icon" type="image/png" href="../images/logo.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{ --ink:#101828; --muted:#667085; --gold:#c4911c; --line:#dde3ed; --paper:#ffffff; --soft:#f4f6fa; }}
        * {{ box-sizing:border-box; margin:0; padding:0; }}
        body {{ background:#d8dee8; color:var(--ink); font-family:'Open Sans',Arial,sans-serif; line-height:1.5; padding:24px; }}
        .flyer-sheet {{ position:relative; width:min(8.5in,100%); min-height:11in; margin:0 auto; background:var(--paper); box-shadow:0 24px 70px rgba(16,24,40,.24); overflow:hidden; }}
        .sample-ribbon {{ position:absolute; top:22px; right:-52px; z-index:4; width:220px; transform:rotate(35deg); background:var(--gold); color:#fff; font-family:'Montserrat',sans-serif; font-size:.7rem; font-weight:900; letter-spacing:.14em; text-align:center; text-transform:uppercase; padding:7px 0; }}
        .flyer-hero {{ position:relative; height:4.85in; background:linear-gradient(180deg,rgba(5,7,12,.08),rgba(5,7,12,.84)),url("{attr(hero)}") center/cover no-repeat; color:#fff; display:flex; align-items:flex-end; padding:.46in; }}
        .flyer-brand {{ position:absolute; top:.28in; left:.38in; display:flex; align-items:center; gap:.12in; color:#fff; font-family:'Montserrat',sans-serif; font-size:.15in; font-weight:900; letter-spacing:.02em; text-transform:uppercase; text-shadow:0 2px 12px rgba(0,0,0,.55); }}
        .flyer-brand img {{ width:.48in; height:.48in; object-fit:contain; }}
        .flyer-brand span {{ display:block; color:rgba(255,255,255,.72); font-size:.095in; letter-spacing:.15em; margin-top:.02in; }}
        .hero-copy {{ width:100%; display:grid; grid-template-columns:minmax(0,1fr) 1.56in; gap:.3in; align-items:end; }}
        .eyebrow {{ color:var(--gold); font-family:'Montserrat',sans-serif; font-size:.11in; font-weight:900; letter-spacing:.18em; text-transform:uppercase; margin-bottom:.08in; }}
        h1 {{ font-family:'Montserrat',sans-serif; font-size:.63in; font-weight:900; line-height:.95; letter-spacing:0; margin-bottom:.12in; }}
        .location {{ color:rgba(255,255,255,.82); font-size:.17in; font-weight:600; }}
        .qr-card {{ background:#fff; border-radius:.08in; padding:.12in; color:var(--ink); text-align:center; }}
        .qr-card img {{ width:1.28in; height:1.28in; display:block; margin:0 auto .08in; }}
        .qr-card strong {{ display:block; font-family:'Montserrat',sans-serif; font-size:.11in; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }}
        .qr-card span {{ display:block; color:var(--muted); font-size:.085in; line-height:1.3; margin-top:.035in; }}
        .flyer-body {{ padding:.34in .42in .38in; }}
        .stats-row {{ display:grid; grid-template-columns:repeat(5,1fr); gap:.1in; margin-bottom:.3in; }}
        .stat {{ border:1px solid var(--line); border-radius:.08in; padding:.12in .08in; text-align:center; background:var(--soft); }}
        .stat strong {{ display:block; font-family:'Montserrat',sans-serif; font-size:.17in; font-weight:900; line-height:1; color:var(--ink); }}
        .stat span {{ display:block; color:var(--muted); font-family:'Montserrat',sans-serif; font-size:.075in; font-weight:800; letter-spacing:.12em; text-transform:uppercase; margin-top:.05in; }}
        .content-grid {{ display:grid; grid-template-columns:1fr 2.25in; gap:.32in; align-items:start; }}
        h2 {{ font-family:'Montserrat',sans-serif; font-size:.28in; font-weight:900; line-height:1.08; margin-bottom:.12in; }}
        .description {{ color:#475467; font-size:.118in; line-height:1.72; margin-bottom:.16in; }}
        .feature-list {{ display:grid; grid-template-columns:1fr 1fr; gap:.07in .14in; list-style:none; color:#344054; font-size:.105in; font-weight:700; }}
        .feature-list li::before {{ content:""; display:inline-block; width:.06in; height:.06in; border-radius:50%; background:var(--gold); margin-right:.06in; vertical-align:middle; }}
        .agent-box {{ border:1px solid var(--line); border-radius:.08in; overflow:hidden; background:#fff; }}
        .agent-box-header {{ background:#080b12; color:#fff; padding:.18in; }}
        .agent-box-header span {{ display:block; color:var(--gold); font-family:'Montserrat',sans-serif; font-size:.08in; font-weight:900; letter-spacing:.16em; text-transform:uppercase; margin-bottom:.045in; }}
        .agent-box-header strong {{ display:block; font-family:'Montserrat',sans-serif; font-size:.2in; font-weight:900; line-height:1; }}
        .agent-details {{ padding:.18in; }}
        .agent-details p {{ color:var(--muted); font-size:.105in; line-height:1.55; margin-bottom:.14in; }}
        .contact-line {{ border-top:1px solid var(--line); padding-top:.12in; font-family:'Montserrat',sans-serif; font-size:.105in; font-weight:800; line-height:1.75; overflow-wrap:anywhere; }}
        .photo-strip {{ display:grid; grid-template-columns:repeat(3,1fr); gap:.08in; margin-top:.28in; }}
        .photo-strip img {{ width:100%; height:1.06in; object-fit:cover; border-radius:.07in; }}
        .flyer-footer {{ position:absolute; left:.42in; right:.42in; bottom:.25in; display:flex; justify-content:space-between; gap:.2in; color:var(--muted); border-top:1px solid var(--line); padding-top:.14in; font-size:.095in; }}
        .flyer-footer strong {{ color:var(--ink); font-family:'Montserrat',sans-serif; font-weight:900; }}
        .gold {{ color:var(--gold); }}
        @media print {{ @page {{ size:letter; margin:0; }} body {{ background:#fff; padding:0; }} .flyer-sheet {{ width:8.5in; height:11in; min-height:11in; box-shadow:none; }} }}
        @media (max-width:760px) {{ html,body {{ overflow-x:hidden; }} body {{ padding:0; background:#fff; }} .flyer-sheet {{ width:100%; max-width:100vw; min-width:0; min-height:0; box-shadow:none; }} .flyer-hero {{ height:auto; min-height:560px; padding:92px 18px 24px; }} .flyer-brand {{ top:20px; left:18px; right:18px; }} .hero-copy,.content-grid {{ grid-template-columns:minmax(0,1fr); gap:22px; width:100%; max-width:354px; }} h1 {{ max-width:100%; font-size:2.05rem; line-height:1.06; overflow-wrap:break-word; }} h2 {{ width:100%; max-width:354px; font-size:1.55rem; line-height:1.1; overflow-wrap:break-word; }} .description {{ max-width:354px; font-size:.94rem; }} .tagline {{ font-size:.92rem; }} .qr-card {{ width:100%; max-width:190px; padding:14px; }} .qr-card img {{ width:142px; height:142px; }} .qr-card strong {{ font-size:.78rem; }} .stats-row {{ grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; width:100%; max-width:354px; }} .stat,.agent-box {{ min-width:0; max-width:100%; }} .feature-list,.photo-strip {{ grid-template-columns:1fr; max-width:354px; }} .photo-strip img {{ height:210px; }} .flyer-body {{ padding:24px 18px 72px; }} .flyer-footer {{ position:static; display:block; margin:28px 18px 0; padding-bottom:24px; }} }}
    </style>
</head>
<body>
    <main class="flyer-sheet">
        {sample_ribbon}
        <section class="flyer-hero">
            <div class="flyer-brand">
                <img src="../images/logo.png" alt="Flying Ace's logo">
                <div>Flying <span class="gold">Ace's</span><span>Listing Media</span></div>
            </div>
            <div class="hero-copy">
                <div>
                    <p class="eyebrow">{esc(status)}</p>
                    <h1>{esc(address)}</h1>
                    <p class="location">{esc(city)}</p>
                </div>
                <div class="qr-card">
                    <img src="../images/{attr(qr_name)}" alt="QR code for {attr(address)}">
                    <strong>Scan For Media</strong>
                    <span>Full gallery, drone views, 3D tour, floor plan, and showing info</span>
                </div>
            </div>
        </section>

        <section class="flyer-body">
            <div class="stats-row" aria-label="Property summary">
{stat_html}
            </div>
            <div class="content-grid">
                <div>
                    <h2>Open-house ready media, one scan away.</h2>
                    <p class="description">{esc(data.get('description', ''))}</p>
                    <ul class="feature-list">
{highlight_html}
                    </ul>
                </div>
                <aside class="agent-box">
                    <div class="agent-box-header">
                        <span>Presented By</span>
                        <strong>{esc(agent_name)}</strong>
                    </div>
                    <div class="agent-details">
                        <p>{esc(brokerage)}. Schedule a showing or request the full property packet.</p>
                        <div class="contact-line">
                            Call/Text: {esc(phone)}<br>
                            {esc(email)}
                        </div>
                    </div>
                </aside>
            </div>
            <div class="photo-strip" aria-label="Featured listing photos">
{strip_images}
            </div>
        </section>

        <footer class="flyer-footer">
            <span><strong>Listing Launch Kit Flyer</strong> for open houses and listing presentations</span>
            <span>Media by Flying Ace's Photography &amp; Drone Services</span>
        </footer>
    </main>
</body>
</html>
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Listing Launch Kit static files.")
    parser.add_argument("json_file", nargs="?", default=str(Path(__file__).with_name("listing-sample.json")))
    args = parser.parse_args()

    source = Path(args.json_file)
    if not source.is_absolute():
        source = (Path.cwd() / source).resolve()
    if not source.exists():
        fail(f"JSON file not found: {source}")

    data = json.loads(source.read_text(encoding="utf-8"))
    slug = slugify(data.get("slug") or data.get("address") or "listing")
    live_url = data.get("live_url") or f"https://flyingacesmedia.com/listings/{slug}.html"
    qr_target = data.get("qr_target_url") or live_url
    qr_name = generate_qr(data, slug, qr_target)

    listings_dir = PROJECT_ROOT / "listings"
    listings_dir.mkdir(parents=True, exist_ok=True)

    property_page = listings_dir / f"{slug}.html"
    flyer_page = listings_dir / f"{slug}-flyer.html"
    property_page.write_text(render_property_page(data, slug, qr_name, live_url), encoding="utf-8", newline="\n")
    flyer_page.write_text(render_flyer_page(data, slug, qr_name), encoding="utf-8", newline="\n")

    print("Generated Listing Launch Kit:")
    print(f"  {property_page.relative_to(PROJECT_ROOT)}")
    print(f"  {flyer_page.relative_to(PROJECT_ROOT)}")
    print(f"  images/{qr_name}")
    print(f"QR target: {qr_target}")


if __name__ == "__main__":
    main()
