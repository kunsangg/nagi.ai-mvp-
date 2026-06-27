import re

def fix():
    css_path = 'style.css'
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()

    # Remove existing .dl- block
    css = re.sub(r'\.dl-main[\s\S]*?(?=\Z|\n/\*|\n\.[a-zA-Z])', '', css) # Wait, regex might be tricky. Let's just find where .dl-main starts and cut everything after.
    
    idx = css.find('.dl-main {')
    if idx != -1:
        css = css[:idx]

    new_css = """
/* DL Classes */
.dl-main {
    background-color: #fff;
    font-family: 'Google Sans Flex', 'Google Sans', sans-serif;
    color: #1a1a1a;
    padding-top: 100px;
}

.dl-page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 60px 40px;
}

.dl-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
}

.dl-title {
    font-size: 52px;
    font-weight: 400;
    line-height: 1.15;
    margin: 0;
    letter-spacing: -1px;
}

.dl-btn-ghost {
    padding: 10px 20px;
    border-radius: 40px;
    background-color: #f1f3f4;
    color: #1a1a1a;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    margin-top: 16px;
    display: inline-block;
    transition: background-color 0.2s;
}

.dl-btn-ghost:hover {
    background-color: #e8eaed;
}

.dl-tabs {
    display: flex;
    gap: 32px;
    margin-bottom: 60px;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 16px;
}

.dl-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #5f6368;
    cursor: pointer;
    font-weight: 500;
    padding-bottom: 16px;
    margin-bottom: -17px; /* Pull down to overlap border */
    border-bottom: 2px solid transparent;
}

.dl-tab.active {
    color: #1a73e8;
    border-bottom: 2px solid #1a73e8;
}

.dl-tab.active .dl-tab-icon {
    color: #1a73e8;
}

.dl-section-title {
    font-size: 28px;
    font-weight: 400;
    margin-bottom: 40px;
}

.dl-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0; /* Let padding handle spacing */
}

.dl-card {
    border-right: 1px solid #eaeaea;
    padding-right: 40px;
    padding-left: 40px;
}
.dl-card:first-child {
    padding-left: 0;
}
.dl-card:last-child {
    border-right: none;
    padding-right: 0;
}

.dl-os-title {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 30px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.dl-btn-primary {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 16px 24px;
    border-radius: 40px !important;
    background-color: #1a1a1a !important;
    color: #fff !important;
    text-decoration: none !important;
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 16px;
    box-sizing: border-box;
    transition: opacity 0.2s;
    line-height: 1;
}

.dl-btn-primary:hover {
    opacity: 0.8;
}

.dl-btn-secondary {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 16px 24px;
    border-radius: 40px !important;
    background-color: #f1f3f4 !important;
    color: #1a1a1a !important;
    text-decoration: none !important;
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 40px;
    box-sizing: border-box;
    transition: background-color 0.2s;
    line-height: 1;
}

.dl-btn-secondary:hover {
    background-color: #e8eaed !important;
}

.dl-requirements h4 {
    font-size: 12px;
    color: #1a1a1a;
    font-weight: 500;
    margin-bottom: 8px;
}

.dl-requirements p {
    font-size: 12px;
    color: #5f6368;
    line-height: 1.6;
    margin: 0;
}
"""

    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css + '\n' + new_css)

    print("CSS updated")

if __name__ == "__main__":
    fix()
