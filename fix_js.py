import re

def fix():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    html = html.replace('var dynamicText = \'["orientation","understanding","clarity"]\';', 
                        'var dynamicText = \'["understanding","orientation","synthesis"]\';')

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print("JS array fixed!")

if __name__ == "__main__":
    fix()
