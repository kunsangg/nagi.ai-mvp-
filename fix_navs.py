import re
from bs4 import BeautifulSoup

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    # 1. Top Announcement bar
    # Replace "Discover more on our new transformation strategy"
    for a in soup.find_all('a'):
        text = a.get_text(strip=True)
        if "Discover more on our new transformation strategy" in text or "transformation strategy" in text:
            a.string = "Nagi is now in early access — join the waitlist →"
            a['href'] = "#waitlist"  # Link to waitlist section
            # If it had an arrow inside a span, let's just keep it simple text or replace the entire inner HTML.
            # Actually, BS4 string=... replaces all inner elements. That's fine.

    # 2. Top Bar Marquee
    # Item 1: Research Map · Surface the papers that actually matter
    # Item 2: Structured Reader · Understand any paper in plain language
    # Item 3: Field Connections · See how ideas connect, contradict, and evolve
    marquee_texts = [
        "Research Map · Surface the papers that actually matter",
        "Structured Reader · Understand any paper in plain language",
        "Field Connections · See how ideas connect, contradict, and evolve"
    ]
    
    # We will find the marquee text items. In the template they are usually inside `.top-nav_marq-text`
    marq_items = soup.find_all(class_='top-nav_marq-text')
    if not marq_items:
        # fallback, find by some known text like LATEST NEWS (which we replaced to LATEST NEWS)
        # Actually it's probably "We have launched our transformation strategy" or similar.
        pass
    
    # If there's a list, we just empty the track and add 3 items.
    tracks = soup.find_all(class_=lambda c: c and 'marq' in c.lower() and 'track' in c.lower())
    for track in tracks:
        # Find the text containers.
        items = track.find_all('div')
        # This might be tricky if structure is complex. We'll use regex on html instead later if BS4 is too messy.
    
    # Let's do it directly: find elements that have text "We have launched" or similar
    for el in soup.find_all(text=re.compile(r'We have launched', re.I)):
        parent = el.find_parent()
        if parent:
            parent.string = "Research Map · Surface the papers that actually matter"
    
    # Actually, it's better to just replace the inner text of the marq-text elements.
    # Let's see the exact text using regex.

    # 3. Navigation - top nav (mobile/hamburger) & main nav (desktop)
    # The user says: Keep: Explore, The Gap, How it works, Who it's for, Download
    # But for mobile: Home, The Problem, Features, Workflow, Pricing, Start, Contact, Download
    # Wait, the user said for Top Nav (Mobile): "Keep: Home, The Problem, Features, Workflow, Pricing, Start, Contact. Add: Download -> links to /download.html"
    # And for Main Nav (Desktop): "Keep exactly: Explore, The Gap, How it works, Who it's for, Download. Remove the "Ar" language switcher"
    
    # Remove "Ar" language switcher
    for a in soup.find_all('a'):
        if a.get_text(strip=True) == "Ar":
            a.decompose()

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(str(soup))
        
process_file('index.html')
print("Processed index.html via BS4")
