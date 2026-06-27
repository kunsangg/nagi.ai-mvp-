import re

def move_faq():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # The FAQ section starts with <!-- FAQ SECTION --> and ends with <!-- END FAQ SECTION -->
    faq_match = re.search(r'<!-- FAQ SECTION -->.*?<!-- END FAQ SECTION -->\n?', html, re.DOTALL)
    if not faq_match:
        print("FAQ section not found")
        return
    
    faq_content = faq_match.group(0)
    
    # Remove FAQ from its current location
    html = html.replace(faq_content, '')
    
    # Update the FAQ background color to match the user's screenshot
    # The screenshot shows a solid dark blue background, similar to the deep ocean theme.
    # Let's change background-color: transparent; to background-color: #0b2b42; (or similar deep blue).
    # Wait, the ocean diving theme changes the body background color dynamically!
    # So if we want it to match the ocean theme, we should just leave it transparent!
    # The user screenshot showed it with a dark blue background, which is what the ocean theme becomes at that scroll depth!
    
    # Let's find the <!-- END MONOLOG SECTION -->
    target_marker = '<!-- END MONOLOG SECTION -->'
    if target_marker in html:
        # Insert FAQ right after the monolog section ends, but before the actual footer links (.footer_container)
        new_html = html.replace(target_marker, target_marker + '\n' + faq_content)
        
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(new_html)
        print("Successfully moved FAQ section below the Who It's For section.")
    else:
        print("Could not find <!-- END MONOLOG SECTION -->")

if __name__ == '__main__':
    move_faq()
