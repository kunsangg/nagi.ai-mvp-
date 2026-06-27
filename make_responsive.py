import os
from bs4 import BeautifulSoup

def process_html(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # 1. HAMBURGER MENU & NAV
    nav = soup.find('nav')
    if nav and not soup.find(class_='hamburger-menu'):
        # Find the div containing the nav links (usually class nav-links or similar)
        # In this template, links might be direct children or in a wrapper.
        # Let's inject a hamburger button into the nav container.
        nav_container = nav.find(class_='w-container') or nav
        
        hamburger = soup.new_tag('div', attrs={'class': 'hamburger-menu'})
        hamburger.string = '☰'
        
        overlay = soup.new_tag('div', attrs={'class': 'mobile-nav-overlay'})
        overlay_close = soup.new_tag('div', attrs={'class': 'hamburger-close'})
        overlay_close.string = '✕'
        overlay.append(overlay_close)
        
        # Clone all nav links into overlay
        links = nav.find_all('a')
        for link in links:
            if 'button' not in link.get('class', []) and 'cta' not in link.get('class', []):
                new_link = soup.new_tag('a', href=link.get('href', '#'), attrs={'class': 'nav-link mobile-nav-link'})
                new_link.string = link.get_text(strip=True)
                overlay.append(new_link)
        
        nav_container.append(hamburger)
        soup.body.append(overlay)
        
        # Inject JS for hamburger
        js = soup.new_tag('script')
        js.string = """
        document.addEventListener('DOMContentLoaded', () => {
            const burger = document.querySelector('.hamburger-menu');
            const close = document.querySelector('.hamburger-close');
            const overlay = document.querySelector('.mobile-nav-overlay');
            if(burger && overlay) {
                burger.addEventListener('click', () => overlay.classList.add('active'));
                if(close) close.addEventListener('click', () => overlay.classList.remove('active'));
                overlay.querySelectorAll('.mobile-nav-link').forEach(link => {
                    link.addEventListener('click', () => overlay.classList.remove('active'));
                });
            }
        });
        """
        soup.body.append(js)

    # 2. MONOLOG MOBILE IMAGES (Only in index.html)
    if 'index' in filepath:
        monolog_list = soup.find(id='monolog-list')
        if monolog_list:
            items = monolog_list.find_all('li', class_='monolog-item')
            for item in items:
                # Add the corresponding image inside the item for mobile
                target_id = item.get('data-target')
                if target_id:
                    target_img = soup.find(id=target_id)
                    if target_img and not item.find('img', class_='monolog-mobile-img'):
                        mobile_img = soup.new_tag('img', src=target_img.get('src'), alt=target_img.get('alt', ''))
                        mobile_img['class'] = 'monolog-mobile-img'
                        item.append(mobile_img)

    # Ensure responsive.css is linked
    if not soup.find('link', href='responsive.css'):
        link = soup.new_tag('link', rel='stylesheet', href='responsive.css')
        soup.head.append(link)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    print(f"Processed {filepath}")

def generate_css():
    css = """
/* GLOBAL */
html, body { max-width: 100vw; overflow-x: hidden; }
* { box-sizing: border-box; }

/* MINIMUM TAP TARGETS */
@media screen and (max-width: 767px) {
    a, button, .button, .link--footer-wrap a {
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
}

/* CONTAINER PADDINGS */
@media screen and (max-width: 767px) {
    .w-container, .section, .c--section {
        padding-left: 16px !important;
        padding-right: 16px !important;
    }
}
@media screen and (min-width: 768px) and (max-width: 1023px) {
    .w-container, .section, .c--section {
        padding-left: 24px !important;
        padding-right: 24px !important;
    }
}

/* NAVIGATION */
.hamburger-menu {
    display: none;
    font-size: 28px;
    color: white;
    cursor: pointer;
    z-index: 1001;
}
.mobile-nav-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100vh;
    background-color: rgba(0,0,0,0.98);
    z-index: 1000;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    opacity: 0; pointer-events: none; transition: opacity 0.3s;
}
.mobile-nav-overlay.active { opacity: 1; pointer-events: auto; }
.hamburger-close {
    position: absolute; top: 24px; right: 24px;
    font-size: 32px; color: white; cursor: pointer;
    width: 44px; height: 44px; display: flex;
    align-items: center; justify-content: center;
}
.mobile-nav-link { font-size: 24px; margin: 16px 0; color: white; text-decoration: none; }

@media screen and (max-width: 767px) {
    /* Hide desktop nav */
    nav .nav__links-wrapper, nav .nav__links { display: none !important; }
    .hamburger-menu { display: flex !important; }
    nav .w-container { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .nav__button { padding: 8px 16px !important; }
}

/* HERO */
@media screen and (max-width: 1023px) {
    h1, .hero__title, .heading--hero { font-size: 40px !important; line-height: 1.05 !important; text-align: left !important; }
    .hero__subtitle, .txt--hero-sub { font-size: 16px !important; text-align: left !important; }
}
@media screen and (max-width: 767px) {
    h1, .hero__title, .heading--hero { font-size: 32px !important; }
    .hero__subtitle, .txt--hero-sub { font-size: 15px !important; }
    .video-bg, .hero-video { width: 100%; height: 100%; object-fit: cover; }
}

/* TYPEWRITER */
@media screen and (max-width: 1023px) {
    #typewriter-heading, h2 { font-size: 32px !important; line-height: 1.2 !important; }
}
@media screen and (max-width: 767px) {
    #typewriter-heading, h2 { font-size: 24px !important; white-space: normal !important; word-wrap: break-word; }
    .typewriter-container, #typewriter-heading { white-space: normal !important; }
}

/* GRIDS (Features, Researchers, etc) */
@media screen and (max-width: 1023px) {
    .grid--8-col, .grid--8-col-copy, .grid--8-col-copy-copy, .grid--news-cards, .grid--downloads, .download-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 20px !important;
    }
}
@media screen and (max-width: 767px) {
    .grid--8-col, .grid--8-col-copy, .grid--8-col-copy-copy, .grid--news-cards, .grid--downloads, .download-grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
    }
    .c--wrap__card, .feature-card, .card { padding: 16px !important; }
}

/* WORKFLOW (Cards scroll) */
@media screen and (max-width: 1023px) {
    .c--scroll-track, .workflow-track {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        width: 100% !important;
        transform: none !important;
        gap: 20px;
    }
    .c--scroll-wrapper { height: auto !important; position: static !important; }
}
@media screen and (max-width: 767px) {
    .c--scroll-track, .workflow-track { grid-template-columns: 1fr !important; }
    .card__img video { aspect-ratio: 16/9; object-fit: cover; position: static !important; }
    .card__img { position: relative !important; height: auto !important; }
    .card__img-wrap { height: 250px !important; position: relative !important; }
}

/* MONOLOG (Who It's For) */
.monolog-mobile-img { display: none; }
@media screen and (max-width: 767px) {
    .monolog-grid { display: flex !important; flex-direction: column !important; }
    .monolog-right { display: none !important; }
    .monolog-left { display: flex; flex-direction: column; }
    #quote-text { order: -1; margin-bottom: 24px; position: static !important; opacity: 1 !important; }
    .monolog-list { gap: 24px; display: flex; flex-direction: column; }
    .monolog-item { font-size: 24px !important; opacity: 1 !important; pointer-events: none; color: white !important; }
    .monolog-mobile-img { display: block !important; width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 8px; margin-top: 12px; }
}

/* FOOTER */
@media screen and (max-width: 1023px) {
    .footer__grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 32px; }
}
@media screen and (max-width: 767px) {
    .footer__grid { display: flex !important; flex-direction: column !important; gap: 24px; }
    .footer__grid > div { border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 24px; }
    .footer__grid > div:last-child { border-bottom: none; }
    .form--newsletter { display: flex !important; flex-direction: column !important; width: 100%; }
    .newsletter-text-field { width: 100% !important; margin-bottom: 12px; }
    .newsletter-submit-button { width: 100% !important; margin-top: 8px; }
    .footer-social-wrap { justify-content: center !important; }
    .footer__copyright-txt { text-align: center !important; }
}
"""
    with open('responsive.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("Generated responsive.css")

if __name__ == '__main__':
    generate_css()
    process_html('index.html')
    process_html('download.html')
