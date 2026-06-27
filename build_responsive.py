import os

RESPONSIVE_CSS = """
/* ==========================================================================
   RESPONSIVE OVERRIDES
   ========================================================================== */

/* GLOBAL & GENERAL RULES */
html, body {
    max-width: 100vw;
    overflow-x: hidden;
}

/* Ensure all interactive elements have minimum touch targets */
@media screen and (max-width: 767px) {
    a, button, .link--footer-wrap {
        min-height: 44px;
        min-width: 44px;
    }
    
    /* Ensure containers have consistent padding */
    .w-container, .section, .nav-container, .footer_container {
        padding-left: 16px !important;
        padding-right: 16px !important;
    }
}

@media screen and (min-width: 768px) and (max-width: 1023px) {
    .w-container, .section, .nav-container, .footer_container {
        padding-left: 24px !important;
        padding-right: 24px !important;
    }
}

/* NAVIGATION */
@media screen and (max-width: 767px) {
    .nav-links {
        display: none !important;
    }
    .hamburger-menu {
        display: flex !important;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        cursor: pointer;
        z-index: 1001;
    }
    
    /* Nav overlay for mobile */
    .mobile-nav-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.95);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }
    .mobile-nav-overlay.active {
        opacity: 1;
        pointer-events: auto;
    }
    .mobile-nav-overlay .nav-link {
        font-size: 24px;
        margin: 16px 0;
        color: white;
        text-decoration: none;
        min-height: 44px;
        display: flex;
        align-items: center;
    }

    /* Keep CTA visible but adjust padding */
    .nav-cta {
        padding: 8px 16px !important;
        font-size: 14px;
    }
    
    .nav-container {
        justify-content: space-between;
    }
}

/* HERO SECTION */
@media screen and (max-width: 1023px) {
    .hero__title {
        font-size: 40px !important;
        line-height: 1.05 !important;
        text-align: left !important;
    }
    .hero__subtitle {
        font-size: 16px !important;
        text-align: left !important;
    }
}

@media screen and (max-width: 767px) {
    .hero__title {
        font-size: 32px !important;
    }
    .hero__subtitle {
        font-size: 15px !important;
    }
    .hero-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

/* TYPEWRITER SECTION */
@media screen and (max-width: 1023px) {
    #typewriter-heading {
        font-size: 32px !important;
    }
}

@media screen and (max-width: 767px) {
    #typewriter-heading {
        font-size: 24px !important;
        white-space: normal !important;
        word-wrap: break-word;
    }
    .tw-container {
        white-space: normal !important;
    }
}

/* FEATURES SECTION */
@media screen and (max-width: 1023px) {
    .features__grid, .feature-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 20px !important;
    }
}

@media screen and (max-width: 767px) {
    .features__grid, .feature-grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
    }
    .feature-card, .c--wrap__card {
        padding: 16px !important;
    }
}

/* WORKFLOW SECTION */
@media screen and (max-width: 1023px) {
    /* If it's a flex/scroll container normally */
    .workflow-container, .cards-scroll, .c--scroll-track {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        overflow-x: hidden !important;
        width: 100% !important;
        gap: 20px;
    }
    /* We might need to override width 400vw etc */
    .c--scroll-track {
        width: auto !important;
        transform: none !important;
    }
}

@media screen and (max-width: 767px) {
    .workflow-container, .cards-scroll, .c--scroll-track {
        grid-template-columns: 1fr !important;
    }
    .card__img video {
        aspect-ratio: 16/9;
        object-fit: cover;
    }
}

/* RESEARCHERS SECTION */
@media screen and (max-width: 1023px) {
    .researchers-grid, .researchers-list {
        display: grid !important;
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 16px;
    }
}

@media screen and (max-width: 767px) {
    .researchers-grid, .researchers-list {
        grid-template-columns: repeat(2, 1fr) !important;
    }
    .researcher-img {
        width: 100% !important;
        aspect-ratio: 1/1;
        object-fit: cover;
    }
    .researcher-name, .researcher-caption {
        white-space: normal !important;
        word-wrap: break-word;
    }
}

/* WHO ITS FOR SECTION (MONOLOG) */
@media screen and (max-width: 767px) {
    .monolog-grid {
        display: flex !important;
        flex-direction: column !important;
    }
    
    .monolog-right {
        position: static !important;
        display: none; /* Hide the sticky right track on mobile */
    }
    
    .monolog-list {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }
    
    .monolog-item {
        font-size: 24px !important;
        opacity: 1 !important;
        color: white !important;
        pointer-events: none; /* disable hover logic */
    }
    
    /* Reveal images under labels on mobile */
    .monolog-mobile-img {
        display: block !important;
        width: 100%;
        border-radius: 8px;
        margin-top: 12px;
        aspect-ratio: 16/9;
        object-fit: cover;
    }

    /* Move quote above list */
    .monolog-left {
        display: flex;
        flex-direction: column;
    }
    #quote-text {
        order: -1;
        margin-bottom: 24px;
    }
}

/* Desktop hide mobile imgs */
@media screen and (min-width: 768px) {
    .monolog-mobile-img {
        display: none !important;
    }
}

/* DOWNLOAD PAGE */
@media screen and (max-width: 1023px) {
    .download-grid {
        grid-template-columns: 1fr 1fr !important;
    }
    /* Third child spanning full width */
    .download-grid > :nth-child(3) {
        grid-column: 1 / -1;
    }
}

@media screen and (max-width: 767px) {
    .download-grid {
        grid-template-columns: 1fr !important;
    }
    .download-card {
        padding: 16px !important;
    }
    .dl-btn {
        width: 100% !important;
    }
    .pill-changelog {
        position: static !important;
        display: inline-block;
        margin-top: 16px;
    }
}

/* FOOTER */
@media screen and (max-width: 1023px) {
    .footer__grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 32px;
    }
}

@media screen and (max-width: 767px) {
    .footer__grid {
        display: flex !important;
        flex-direction: column !important;
        gap: 24px;
    }
    
    .c--wrap {
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 24px;
    }
    
    .footer__newsletter {
        width: 100%;
    }
    
    .form--newsletter {
        flex-direction: column !important;
    }
    
    .newsletter-text-field {
        width: 100% !important;
        margin-bottom: 12px;
    }
    
    .newsletter-submit-button {
        width: 100% !important;
    }
    
    .footer-social-wrap {
        justify-content: center !important;
    }
    
    .footer__copyright-txt {
        text-align: center !important;
    }
}
"""

def append_to_css():
    with open('style.css', 'a', encoding='utf-8') as f:
        f.write('\n' + RESPONSIVE_CSS)
    print("Appended responsive CSS to style.css")

if __name__ == '__main__':
    append_to_css()
