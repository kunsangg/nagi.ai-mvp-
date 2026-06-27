import re

def fix_css():
    filepath = 'style.css'
    with open(filepath, 'r', encoding='utf-8') as f:
        css = f.read()

    # Title
    css = re.sub(
        r'\.dl-title \{[\s\S]*?\}',
        '.dl-title {\n    font-size: 4rem;\n    font-weight: 400;\n    margin: 0;\n    line-height: 1.1;\n    color: #202124;\n    letter-spacing: -1.5px;\n}',
        css
    )

    # Header margin
    css = re.sub(
        r'\.dl-header \{[\s\S]*?\}',
        '.dl-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    margin-bottom: 60px;\n    flex-wrap: wrap;\n}',
        css
    )

    # Ghost button
    css = re.sub(
        r'\.dl-btn-ghost \{[\s\S]*?\}',
        '.dl-btn-ghost {\n    background: #f1f3f4;\n    color: #3c4043;\n    padding: 10px 24px;\n    border-radius: 30px;\n    text-decoration: none;\n    font-weight: 500;\n    font-size: 14px;\n}',
        css
    )

    # Tabs container
    css = re.sub(
        r'\.dl-tabs \{[\s\S]*?\}',
        '.dl-tabs {\n    display: flex;\n    margin-bottom: 60px;\n    gap: 15px;\n    overflow-x: auto;\n}',
        css
    )

    # Tab
    css = re.sub(
        r'\.dl-tab \{[\s\S]*?\}',
        '.dl-tab {\n    padding: 8px 16px;\n    color: #3c4043;\n    font-weight: 500;\n    font-size: 14px;\n    cursor: pointer;\n    border: 1px solid #dadce0;\n    border-radius: 30px;\n    display: flex;\n    align-items: center;\n    background: #fff;\n}',
        css
    )

    # Active Tab
    css = re.sub(
        r'\.dl-tab\.active \{[\s\S]*?\}',
        '.dl-tab.active {\n    color: #1a73e8;\n    border-color: #1a73e8;\n    background: rgba(26, 115, 232, 0.04);\n}',
        css
    )

    # Tab icon
    css = re.sub(
        r'\.dl-tab-icon \{[\s\S]*?\}',
        '.dl-tab-icon {\n    font-family: inherit;\n    color: inherit;\n    background: transparent;\n    padding: 0;\n    margin-right: 8px;\n}',
        css
    )
    
    # Active Tab icon
    css = re.sub(
        r'\.dl-tab\.active \.dl-tab-icon \{[\s\S]*?\}',
        '.dl-tab.active .dl-tab-icon {\n    color: #1a73e8;\n    background: transparent;\n}',
        css
    )

    # Section title
    css = re.sub(
        r'\.dl-section-title \{[\s\S]*?\}',
        '.dl-section-title {\n    font-size: 2rem;\n    font-weight: 400;\n    margin-bottom: 40px;\n    color: #202124;\n}',
        css
    )

    # OS Title
    css = re.sub(
        r'\.dl-os-title \{[\s\S]*?\}',
        '.dl-os-title {\n    font-size: 1.1rem;\n    font-weight: 500;\n    margin: 0 0 24px 0;\n    display: flex;\n    align-items: center;\n    color: #202124;\n}',
        css
    )

    # Buttons
    css = re.sub(
        r'\.dl-btn-primary, \.dl-btn-secondary \{[\s\S]*?\}',
        '.dl-btn-primary, .dl-btn-secondary {\n    display: block;\n    width: 100%;\n    text-align: center;\n    padding: 12px;\n    border-radius: 30px;\n    text-decoration: none;\n    font-weight: 500;\n    font-size: 14px;\n    margin-bottom: 12px;\n    box-sizing: border-box;\n}',
        css
    )

    css = re.sub(
        r'\.dl-btn-primary \{[\s\S]*?\}',
        '.dl-btn-primary {\n    background: #202124;\n    color: #ffffff;\n    border: 1px solid #202124;\n}',
        css
    )

    css = re.sub(
        r'\.dl-btn-secondary \{[\s\S]*?\}',
        '.dl-btn-secondary {\n    background: #f1f3f4;\n    color: #3c4043;\n    border: none;\n}',
        css
    )

    # Requirements
    css = re.sub(
        r'\.dl-requirements \{[\s\S]*?\}',
        '.dl-requirements {\n    margin-top: 30px;\n}',
        css
    )

    css = re.sub(
        r'\.dl-requirements h4 \{[\s\S]*?\}',
        '.dl-requirements h4 {\n    font-size: 12px;\n    color: #202124;\n    margin: 0 0 4px 0;\n    font-weight: 500;\n}',
        css
    )

    css = re.sub(
        r'\.dl-requirements p \{[\s\S]*?\}',
        '.dl-requirements p {\n    font-size: 12px;\n    color: #5f6368;\n    margin: 0;\n    line-height: 1.5;\n}',
        css
    )
    
    # Cursor
    css = re.sub(
        r'\.dl-cursor \{[\s\S]*?\}',
        '.dl-cursor {\n    display: inline-block;\n    width: 3px;\n    height: 4rem;\n    background: linear-gradient(to bottom, #4285f4, #ea4335, #fbbc05, #34a853);\n    vertical-align: middle;\n    margin-left: 8px;\n    margin-bottom: 8px;\n    animation: blink 1s step-end infinite;\n}',
        css
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(css)

    print("Updated CSS to match reference.")

if __name__ == "__main__":
    fix_css()
