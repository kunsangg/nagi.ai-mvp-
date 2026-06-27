import os

def insert_who_its_for():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    insertion = """
<div style="margin-bottom: 40px;">
    <p class="section-title--small en" style="color: rgba(255, 255, 255, 0.6); margin-bottom: 16px;">WHO IT'S FOR</p>
    <h2 class="heading--long en" style="color: #fff; max-width: 600px;">Built for every field that runs on research.</h2>
</div>
"""
    
    # We want to insert this above the industry list, so right after <div class="monolog-content-wrapper">
    target = '<div class="monolog-content-wrapper">'
    if target in html:
        html = html.replace(target, target + insertion)
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Success")
    else:
        print("Target not found")

if __name__ == '__main__':
    insert_who_its_for()
