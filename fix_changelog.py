import re

def fix_changelog():
    with open('changelog.html', 'r', encoding='utf-8') as f:
        old_changelog = f.read()

    # Extract main content from old changelog
    main_match = re.search(r'<main[^>]*>.*?</main>', old_changelog, re.DOTALL)
    if not main_match:
        print("Could not find <main> in old changelog")
        return
    main_content = main_match.group(0)

    # Open download.html to use as a base
    with open('download.html', 'r', encoding='utf-8') as f:
        base_html = f.read()

    # Replace <title>
    base_html = re.sub(r'<title>.*?</title>', '<title>Changelog | Nagi</title>', base_html, flags=re.DOTALL)

    # Replace <main>...</main> in base_html with main_content
    base_html = re.sub(r'<main[^>]*>.*?</main>', main_content, base_html, flags=re.DOTALL)
    
    # Fix the text color inside the changelog to not be black on a dark background (if it has a dark background)
    # Actually download.html has a light/dark setup. Let's make sure the text is readable.
    # The current changelog main_content has:
    # <h1>What's new in Nagi</h1>
    # <div style="border-left: 2px solid #eaeaea; padding-left: 24px; margin-bottom: 40px;">
    # If the site background is dark, the text should be white.
    # Let's add a style to the main container just in case.
    main_content_fixed = main_content.replace(
        '<div class="container w-container">', 
        '<div class="container w-container" style="color: white; max-width: 800px; margin: 0 auto; padding: 40px 20px;">'
    )
    base_html = base_html.replace(main_content, main_content_fixed)

    with open('changelog.html', 'w', encoding='utf-8') as f:
        f.write(base_html)
    print("Fixed changelog.html")

if __name__ == '__main__':
    fix_changelog()
