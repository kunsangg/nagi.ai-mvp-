import re
import os

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    original_html = html

    # 1. Remove "Investor Relations" nav link
    # Typically <li ...><a ...>Investor Relations</a></li>
    html = re.sub(r'<li[^>]*>\s*<a[^>]*>Investor Relations</a>\s*</li>', '', html)
    # Also if it's just an <a> tag without <li>
    html = re.sub(r'<a[^>]*class="n--nav-link"[^>]*>Investor Relations</a>', '', html)

    # 2. Remove "CSR" nav link
    html = re.sub(r'<li[^>]*>\s*<a[^>]*>CSR</a>\s*</li>', '', html)
    html = re.sub(r'<a[^>]*class="n--nav-link"[^>]*>CSR</a>', '', html)

    # 3. Footer SRMG logo
    # <img src="...logo-white.svg"...> or similar
    html = re.sub(r'<img[^>]*src="[^"]*logo-white\.svg"[^>]*>', '', html)
    html = re.sub(r'<a[^>]*href="https://www\.srmg\.com"[^>]*>\s*</a>', '', html)

    # 4. Social icons in footer
    # They are probably in a ul or div containing srmg.com/storage/social-channels/
    # Let's remove any <a> tag that contains an img with this path
    html = re.sub(r'<a[^>]*>\s*<img[^>]*src="[^"]*social-channels/[^"]*"[^>]*>\s*</a>', '', html)
    
    # 5. Logo marquee (OUR BRANDS)
    # Let's find the section. It might be <div class="our-brands"> or similar.
    # It has a heading OUR BRANDS and marquee.
    # Let's do this explicitly if we find the text.
    if 'OUR BRANDS' in html:
        # We can try to find the parent section.
        # Find the section starting before OUR BRANDS and ending at the next </section> or </div>...
        # Actually it's easier to find the div with specific class. Let's print out the context around OUR BRANDS.
        pass
        
    # 6. Typewriter text
    if 'lack access to papers' in html:
        # The text is "People don't lack access to papers. They lack <span class='typewrite' data-period='2000' data-type='[ \"understanding\", \"orientation\", \"synthesis\" ]'><span class='wrap'></span></span>"
        # We need to make sure the fallback text is there.
        # Currently the html might have an empty span or something. Let's see what it has later.
        pass

    if html != original_html:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Updated {filename}")

for f in ['index.html', 'download.html']:
    if os.path.exists(f):
        process_file(f)

print("Check done.")
