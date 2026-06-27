import re

def literal_clone():
    html_path = 'download.html'
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    html = html.replace('Download Nagi<br>for Windows', 'Download Google<br>Antigravity for Windows')
    html = html.replace('Nagi 2.0', 'Antigravity 2.0')
    html = html.replace('Nagi CLI', 'Antigravity CLI')
    html = html.replace('Nagi IDE', 'Antigravity IDE')
    html = html.replace('Nagi SDK', 'Antigravity SDK')

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == "__main__":
    literal_clone()
