import os

def fix_encoding(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    original_html = html

    # Encoding fixes
    html = html.replace('â†\'', '→')
    html = html.replace('â†', '→')
    html = html.replace('Â©', '©')
    html = html.replace('LATESTÂ NEWS', 'LATEST NEWS')
    html = html.replace('Â ', ' ')
    html = html.replace('Â', '') # any stray Â

    if html != original_html:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Fixed encoding in {filename}")

html_files = [f for f in os.listdir() if f.endswith('.html')]
for f in html_files:
    fix_encoding(f)

print("Global encoding fixes complete.")
