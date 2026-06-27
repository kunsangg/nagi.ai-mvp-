import re

def fix():
    with open('download.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Move border-bottom from the outer span to the tw-text span
    old_outer = '<span style="display: inline-block; position: relative; border-bottom: 2px solid #1a1a1a; line-height: 1.1;">'
    new_outer = '<span style="display: inline-block; position: relative; line-height: 1.1;">'
    
    old_inner = '<span id="tw-text">'
    new_inner = '<span id="tw-text" style="border-bottom: 2px solid #1a1a1a;">'
    
    html = html.replace(old_outer + old_inner, new_outer + new_inner)

    with open('download.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print("Underline fixed!")

if __name__ == "__main__":
    fix()
