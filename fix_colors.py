def fix_colors():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    html = html.replace('color: var(--text-primary, #fff)', 'color: #ffffff')
    html = html.replace('color: var(--text-primary, #222)', 'color: #ffffff')

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Fixed")

if __name__ == '__main__':
    fix_colors()
