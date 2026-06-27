import re
import os

def update_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Features Cards - these are often h2/h3 or div titles in cards.
    # The original template had things like "Feature 1", or maybe "Research Map" if I replaced it earlier but broke the text.
    # We will just replace the exact text instances.
    # Wait, earlier I might not have replaced them. Let's just do a blanket regex for the exact text if we know it.
    
    # Let's fix broken links first.
    html = html.replace('href="javascript:void(0)"', 'href="#"')
    html = html.replace('href="javascript:void(0);"', 'href="#"')
    # Update specific links
    html = re.sub(r'(>discover nagi →<|discover nagi\s*→)', r'>discover nagi →<', html)
    html = re.sub(r'href="[^"]*"([^>]*)>discover nagi →', r'href="#features"\1>discover nagi →', html)
    
    html = re.sub(r'href="[^"]*"([^>]*)>see all features →', r'href="#features"\1>see all features →', html)
    html = re.sub(r'href="[^"]*"([^>]*)>explore features →', r'href="#features"\1>see all features →', html)
    
    html = re.sub(r'href="[^"]*"([^>]*)>learn nagi workflow →', r'href="#workflow"\1>see how it works →', html)
    html = re.sub(r'href="[^"]*"([^>]*)>get in touch →', r'href="mailto:hello@nagiai.co"\1>get in touch →', html)
    
    # Top Nav Start/Pricing
    html = re.sub(r'href="[^"]*"([^>]*)>Start<', r'href="https://nagiai.vercel.app"\1>Start<', html)
    html = re.sub(r'href="[^"]*"([^>]*)>Pricing<', r'href="#pricing"\1>Pricing<', html)

    # Researchers captions
    researchers = {
        "Tesla": "Described 700+ patents with no tool to map how ideas connected",
        "Freud": "Built an entire field from papers no one had synthesized before",
        "Einstein": "Cited work most researchers never actually read or understood",
        "Curie": "Pioneered radioactivity with no structured way to navigate prior research",
        "Carver": "Revolutionised agriculture through trial and error — no gap detection existed",
        "Pasteur": "Proved germ theory against a field with no way to surface contradicting evidence",
        "Turing": "Built computing foundations while manually tracking every related paper",
        "Carson": "Sparked a movement from research most people couldn't access or understand"
    }
    for name, caption in researchers.items():
        # Find the name in a h3/p and replace the sibling text. This is safer with regex on the HTML.
        # Often the name is <h3...>Tesla</h3><p...>...</p>
        # Let's just regex replace whatever paragraph follows the name.
        html = re.sub(fr'(>{name}<.*?<p[^>]*>)[^<]*(</p>)', fr'\1{caption}\2', html, flags=re.DOTALL)
        # If the name is just text somewhere, we can try to find it.
        # The researchers section has captions, maybe we need to be more precise.

    # Quote
    html = re.sub(r'(<div[^>]*class="[^"]*quote[^"]*"[^>]*>[\s\S]*?)<p[^>]*>.*?</p>', 
                  r'\1<p style="font-size: 24px; line-height: 1.4;">"Research has never been the problem. Understanding it has. Nagi is built for everyone who has ever opened a paper and felt lost — and everyone who can\'t afford to."</p>', html, count=1)
    
    # We will refine social icons by finding the footer and replacing the social links container.
    footer_idx = html.rfind('<footer')
    if footer_idx == -1:
        footer_idx = html.rfind('footer')
    
    social_svgs = """
    <div class="footer-social-wrap" style="display: flex; gap: 16px;">
        <a href="https://x.com/nagiai" target="_blank" style="color: #fff;"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
        <a href="https://linkedin.com/company/nagiai" target="_blank" style="color: #fff;"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
        <a href="https://github.com/nagiai" target="_blank" style="color: #fff;"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg></a>
    </div>
    """
    if footer_idx != -1:
        html = html[:footer_idx] + re.sub(r'<div[^>]*class="[^"]*social[^"]*"[^>]*>[\s\S]*?</div>', social_svgs, html[footer_idx:], count=1)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
def update_download():
    with open('download.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Meta Title
    html = re.sub(r'<title>.*?</title>', '<title>Download Nagi — Web, macOS, Windows</title>', html)

    # Typewriter cycle
    html = re.sub(r'var dynamicText = \'.*?\';', 'var dynamicText = \'["Web", "macOS", "Windows"]\';', html)
    
    # "View changelog" button
    html = re.sub(r'href="[^"]*"([^>]*)>View changelog', r'href="/changelog.html"\1>View changelog', html)

    # "Open in browser" link
    html = re.sub(r'href="[^"]*"([^>]*)>Open in browser', r'href="https://nagiai.vercel.app"\1>Open in browser', html)

    # Notify me buttons
    html = re.sub(r'href="[^"]*"([^>]*)>Notify me', r'href="javascript:void(0);" onclick="alert(\'Enter your email to get notified when the desktop app launches →\')"\1>Notify me', html)

    with open('download.html', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == '__main__':
    update_index()
    update_download()
    print("Master update done.")
