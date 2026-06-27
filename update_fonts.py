import re

def update_fonts():
    # Update HTML
    html_path = 'download.html'
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    google_fonts_link = """
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@8..144,400..600&display=swap" rel="stylesheet">
    """
    if 'Google+Sans+Flex' not in html:
        html = html.replace('</head>', f'{google_fonts_link}</head>')
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)

    # Update CSS
    css_path = 'style.css'
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()
    
    css = re.sub(
        r"font-family:\s*'Inter',\s*sans-serif;",
        "font-family: 'Google Sans Flex', 'Google Sans', sans-serif;",
        css
    )

    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css)

if __name__ == "__main__":
    update_fonts()
