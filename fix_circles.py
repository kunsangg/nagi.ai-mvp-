import re

def fix_footer():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # The empty social wraps look like this:
    # <div class="footer__social-wrap en">
    # </div>
    
    # We will use regex to find and remove them.
    # We can match `<div class="footer__social-wrap en">` followed by whitespace and `</div>`
    
    html = re.sub(r'<div class="footer__social-wrap en">\s*</div>', '', html)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Fixed empty social wraps in index.html")

if __name__ == '__main__':
    fix_footer()
