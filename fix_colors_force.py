import re

def fix_colors():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Find the title span
    html = html.replace('<span style="font-weight: 700; display: block;">', '<span style="font-weight: 700; display: block; color: #ffffff !important;">')
    
    # Find the body span
    html = html.replace('<span style="display: block; opacity: 0.8; font-size: 0.9rem; margin-top: 12px; line-height: 1.5; font-family: \'Inter\', sans-serif; font-weight: 400;">', '<span style="display: block; opacity: 0.8; font-size: 0.9rem; margin-top: 12px; line-height: 1.5; font-family: \'Inter\', sans-serif; font-weight: 400; color: #ffffff !important;">')

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Fixed forcefully")

if __name__ == '__main__':
    fix_colors()
