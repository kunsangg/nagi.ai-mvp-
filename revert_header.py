import re

def fix():
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            index_html = f.read()
    except Exception as e:
        print("Could not read index.html:", e)
        return

    # Extract the header from index.html
    # It starts with <div class="n--logo" and ends right before <div class="n--lang-select">
    header_match = re.search(r'<div class="n--logo"[\s\S]*?<div class="n--lang-select">', index_html)
    if not header_match:
        print("Header not found in index.html")
        return
    
    header_content = header_match.group(0)

    # Now replace the header in download.html
    with open('download.html', 'r', encoding='utf-8') as f:
        dl_html = f.read()

    # In download.html, we currently have the Google Antigravity header which we inserted.
    # The header starts with <div class="n--logo" and ends right before <div class="n--lang-select">
    dl_html = re.sub(r'<div class="n--logo"[\s\S]*?<div class="n--lang-select">', header_content, dl_html)

    # Note: ensure the download button in the index.html nav correctly links to download.html 
    # but the home page already has this since it's the home page!

    with open('download.html', 'w', encoding='utf-8') as f:
        f.write(dl_html)

    print("Header reverted to match index.html")

if __name__ == "__main__":
    fix()
