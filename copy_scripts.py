import re

def fix():
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            index_html = f.read()
    except Exception as e:
        print("Error reading index.html:", e)
        return

    # Find the chunk of scripts before </body> in index.html
    # It usually starts around the jQuery script inclusion
    match = re.search(r'(<script[^>]*src="[^"]*jquery[^"]*"[^>]*>.*?)</body>', index_html, flags=re.DOTALL | re.IGNORECASE)
    
    if not match:
        print("Could not find scripts block in index.html")
        return
        
    scripts_block = match.group(1)
    
    # We don't want the ocean diving theme to run on the download page if it ruins the white background.
    # The download page has a white background. Ocean diving turns it blue!
    # Let's remove the Ocean Diving Theme script from the block
    scripts_block = re.sub(r'<script>\s*// Ocean Diving Theme[\s\S]*?</script>', '', scripts_block)

    # Let's check download.html
    with open('download.html', 'r', encoding='utf-8') as f:
        dl_html = f.read()
        
    # Remove existing script block if we already have it to avoid duplicates
    if '<script src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js' in dl_html:
        dl_html = re.sub(r'<script[^>]*src="[^"]*jquery[^"]*"[^>]*>[\s\S]*?</body>', '</body>', dl_html)
        
    # Also remove Ocean diving if it snuck in
    dl_html = re.sub(r'<script>\s*// Ocean Diving Theme[\s\S]*?</script>', '', dl_html)

    # Insert scripts before </body>
    dl_html = dl_html.replace('</body>', scripts_block + '\n</body>')

    with open('download.html', 'w', encoding='utf-8') as f:
        f.write(dl_html)
        
    print("Scripts copied to download.html successfully.")

if __name__ == "__main__":
    fix()
