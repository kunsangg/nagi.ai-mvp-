import os

def process_file():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # The block to move
    heading_block = """<div style="margin-bottom: 40px;">
    <p class="section-title--small en" style="color: rgba(255, 255, 255, 0.6); margin-bottom: 16px;">WHO IT'S FOR</p>
    <h2 class="heading--long en" style="color: #fff; max-width: 600px;">Built for every field that runs on research.</h2>
</div>"""

    # The block to remove
    quote_block = """<div class="monolog-quote-wrap">
<p style="font-size: 24px; line-height: 1.4;">"Research has never been the problem. Understanding it has. Nagi is built for everyone who has ever opened a paper and felt lost — and everyone who can\\'t afford to."</p>
<p class="monolog-quote-text" id="quote-text">
                        “Nagi empowers researchers to cut through the noise. We care about your vision as if it were our own, turning complex data into elegant, actionable solutions. Talented, relentless, and driven by discovery.”
                    </p>
</div>"""

    if quote_block in html and heading_block in html:
        # First, remove the heading block from its current place
        html = html.replace(heading_block + '\n', '')
        
        # Then replace the quote block with the heading block
        html = html.replace(quote_block, heading_block)
        
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Success")
    else:
        print("Error: Could not find one or both blocks.")
        if quote_block not in html:
            print("Quote block not found")
        if heading_block not in html:
            print("Heading block not found")

if __name__ == '__main__':
    process_file()
