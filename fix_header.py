import re

def fix():
    html_path = 'download.html'
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    new_header = """<div class="n--logo" style="position: absolute; top: 0; left: 0; height: 90px; padding: 0 4vw; z-index: 10001; display: flex; align-items: center; justify-content: flex-start;">
<a aria-current="page" class="logo--home w-inline-block w--current" href="index.html" style="; text-decoration: none !important; display: flex; align-items: center;">
<div style="display: flex; align-items: center; text-decoration: none !important;">
<span style="color: #1a73e8; margin-right: 8px;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 20H2L12 2Z"></path></svg>
</span>
<span style="color: #1a1a1a; font-size: 18px; font-weight: 500; font-family: 'Google Sans Flex', 'Google Sans', sans-serif; line-height: 1; letter-spacing: -0.5px;">
    Google Antigravity
</span>
</div>
</a>
</div>
<div class="nagi-desktop-nav" style="position: absolute; top: 0; left: 240px; height: 90px; z-index: 10000; display: flex; align-items: center; gap: 32px;"><a href="javascript:void(0);" style="color: #5f6368; text-decoration: none; font-family: 'Google Sans Flex', 'Google Sans', sans-serif; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 4px;">Products <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></a><a href="javascript:void(0);" style="color: #5f6368; text-decoration: none; font-family: 'Google Sans Flex', 'Google Sans', sans-serif; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 4px;">Use Cases <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></a><a href="javascript:void(0);" style="color: #5f6368; text-decoration: none; font-family: 'Google Sans Flex', 'Google Sans', sans-serif; font-size: 14px; font-weight: 500;">Pricing</a><a href="javascript:void(0);" style="color: #5f6368; text-decoration: none; font-family: 'Google Sans Flex', 'Google Sans', sans-serif; font-size: 14px; font-weight: 500;">Blog</a><a href="javascript:void(0);" style="color: #5f6368; text-decoration: none; font-family: 'Google Sans Flex', 'Google Sans', sans-serif; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 4px;">Resources <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></a></div>
<div style="position: absolute; top: 0; right: 0; height: 90px; padding: 0 4vw; z-index: 10000; display: flex; align-items: center;">
<a href="download.html" style="background-color: #1a1a1a; color: white; text-decoration: none; font-family: 'Google Sans Flex', 'Google Sans', sans-serif; font-size: 14px; font-weight: 500; border-radius: 40px; padding: 12px 24px; display: inline-flex; align-items: center; gap: 8px;">Download <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a>
</div>"""

    # We need to replace the two divs: class="n--logo" and class="nagi-desktop-nav"
    # Note: the original HTML has them sequentially.
    pattern = r'<div class="n--logo"[\s\S]*?<div class="n--lang-select">'
    html = re.sub(pattern, new_header + '\n<div class="n--lang-select">', html)

    # Bump CSS version again
    html = html.replace('style.css?v=4', 'style.css?v=5')

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
        
    print("Header updated")

if __name__ == "__main__":
    fix()
