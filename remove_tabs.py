import re

def fix():
    with open('download.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # The tabs start with <!-- Tabs --> and end before <!-- Content -->
    # We will remove the whole block.
    # Note: earlier we might have removed the <h2 class="dl-section-title"> inside Content.
    
    html = re.sub(r'<!-- Tabs -->[\s\S]*?(?=<!-- Content -->)', '', html)

    with open('download.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print("Tabs removed!")

if __name__ == "__main__":
    fix()
