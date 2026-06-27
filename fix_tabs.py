import re

def fix():
    html_path = 'download.html'
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # We will replace the tabs div
    old_tabs_regex = r'<!-- Tabs -->[\s\S]*?<!-- Content -->'
    
    new_tabs = """<!-- Tabs -->
        <div class="dl-tabs" style="display: flex; gap: 16px; margin-bottom: 60px; border-bottom: 1px solid #eaeaea; padding-bottom: 24px;">
            <div class="dl-tab active" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #1a73e8; cursor: pointer; font-weight: 500; padding: 10px 16px; border: 1px solid #e0e0e0; border-radius: 40px; background-color: #f8f9fa;">
                <span class="dl-tab-icon" style="color: #1a73e8;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 20H2L12 2Z"></path></svg>
                </span> Antigravity 2.0
            </div>
            <div class="dl-tab" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #5f6368; cursor: pointer; font-weight: 500; padding: 10px 16px; border: 1px solid #e0e0e0; border-radius: 40px; background-color: #fff;">
                <span class="dl-tab-icon" style="color: #9aa0a6;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-6-6-6M12 19h8"></path></svg>
                </span> Antigravity CLI
            </div>
            <div class="dl-tab" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #5f6368; cursor: pointer; font-weight: 500; padding: 10px 16px; border: 1px solid #e0e0e0; border-radius: 40px; background-color: #fff;">
                <span class="dl-tab-icon" style="color: #9aa0a6;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                </span> Antigravity IDE
            </div>
            <div class="dl-tab" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #5f6368; cursor: pointer; font-weight: 500; padding: 10px 16px; border: 1px solid #e0e0e0; border-radius: 40px; background-color: #fff;">
                <span class="dl-tab-icon" style="color: #9aa0a6;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                </span> Antigravity SDK
            </div>
        </div>

        <!-- Content -->"""

    html = re.sub(old_tabs_regex, new_tabs, html)

    # Make the "View previous releases" button match exactly
    html = html.replace('margin-top: 16px;', 'margin-top: 0; margin-left: 20px;')
    html = html.replace('align-items: flex-start;', 'align-items: center;')

    # Replace CSS class names in style.css just to be safe
    css_path = 'style.css'
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()

    css = css.replace('margin-bottom: -17px; /* Pull down to overlap border */', 'margin-bottom: 0;')
    css = css.replace('border-bottom: 2px solid transparent;', '')
    css = css.replace('border-bottom: 2px solid #1a73e8;', '')
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
        
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css)

    print("Tabs updated")

if __name__ == "__main__":
    fix()
