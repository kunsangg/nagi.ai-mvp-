import os
from bs4 import BeautifulSoup

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    # 1. Remove OUR BRANDS section
    # Search for text "OUR BRANDS" or an element that has it
    for el in soup.find_all(text=lambda text: text and "OUR BRANDS" in text):
        # Find the parent section. It's likely a div with class section--white
        section = el.find_parent('div', class_='section--white')
        if section:
            section.decompose()

    # 2. Remove Nav Links (Investor Relations and CSR)
    for a in soup.find_all('a'):
        text = a.get_text(strip=True)
        if text == "Investor Relations" or text == "CSR":
            li = a.find_parent('li')
            if li:
                li.decompose()
            else:
                a.decompose()

    # 3. Typewriter fallback text
    # In index.html, there is: <div class="typing-wrap en heading--long"...>
    typing_wraps = soup.find_all('div', class_=lambda c: c and 'typing-wrap' in c)
    for wrap in typing_wraps:
        # Check if it has empty or no text
        if not wrap.text.strip():
            wrap.string = "understanding"
            # It might have a data attribute somewhere near or in JS. The user says: 
            # "Ensure the typewriter word has a visible fallback text — use "understanding"... The animation itself should cycle: understanding -> orientation -> synthesis -> loop."
            # The JS might be looking for `data-type` on another element or this element.
            # Let's check parent elements.
            parent = wrap.find_parent('span', class_='typewrite')
            if parent and 'data-type' in parent.attrs:
                parent['data-type'] = '[ "understanding", "orientation", "synthesis" ]'
    
    # Wait, the user specifically mentioned a blank where the animated word should appear. 
    # Let's also check for any script containing the words if it's hardcoded in JS.
    
    # 4. Footer SRMG logo
    for img in soup.find_all('img'):
        if img.get('src') and 'logo-white.svg' in img.get('src'):
            parent_a = img.find_parent('a')
            if parent_a:
                parent_a.decompose()
            else:
                img.decompose()

    # 5. Social icons in footer
    for img in soup.find_all('img'):
        if img.get('src') and 'social-channels' in img.get('src'):
            parent_a = img.find_parent('a')
            if parent_a:
                parent_a.decompose()
            else:
                img.decompose()

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    print(f"Processed {filename}")

for f in ['index.html', 'download.html']:
    if os.path.exists(f):
        process_file(f)

# Also let's check the typewriter JS
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace JS array if it's there
import re
# If JS is hardcoded: const words = [...] or similar
html = re.sub(r'\[\s*"understanding"\s*,\s*"orientation"\s*,\s*"synthesis"\s*\]', r'["understanding", "orientation", "synthesis"]', html) # normalize

# Wait, we need to find what the original words were.
# "People don't lack access to papers. They lack ___"
# Let's replace the array in the JS if it exists.
if 'typing-wrap' in html:
    print("Checking JS for typing words...")
    # we'll use regex to find arrays of strings that look like the old ones.
    # The original array was probably ["understanding", "context", "insight"] or something.
    pass

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

