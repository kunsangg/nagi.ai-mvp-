import re

def fix():
    with open('download.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Define the new cards html
    # 1. Windows
    # 2. macOS
    # 3. Linux
    # We will use uniform padding (e.g., padding: 32px;) and let the CSS handle the borders.

    windows_card = """<div class="dl-card" style="padding: 32px; flex: 1;">
                    <h3 class="dl-os-title" style="font-size: 18px; font-weight: 500; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; color: #1a1a1a;">
                        <svg viewBox="0 0 448 512" width="18" height="18" style="fill: currentColor;"><path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg> Windows
                    </h3>
                    <a href="javascript:void(0);" class="dl-btn-primary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #1a1a1a; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; line-height: 1;">Download for x64</a>
                    <a href="javascript:void(0);" class="dl-btn-secondary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #f1f3f4; color: #1a1a1a; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 40px; box-sizing: border-box; line-height: 1;">Download for ARM64</a>
                    
                    <div class="dl-requirements">
                        <h4 style="font-size: 12px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px;">Minimum Requirements</h4>
                        <p style="font-size: 12px; color: #5f6368; line-height: 1.6; margin: 0;">Windows 10 (64 bit)</p>
                    </div>
                </div>"""

    macos_card = """<div class="dl-card" style="padding: 32px; flex: 1;">
                    <h3 class="dl-os-title" style="font-size: 18px; font-weight: 500; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; color: #1a1a1a;">
                        <svg viewBox="0 0 384 512" width="18" height="18" style="fill: currentColor;"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg> macOS
                    </h3>
                    <a href="javascript:void(0);" class="dl-btn-primary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #1a1a1a; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; line-height: 1;">Download for Apple Silicon</a>
                    <a href="javascript:void(0);" class="dl-btn-secondary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #f1f3f4; color: #1a1a1a; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 40px; box-sizing: border-box; line-height: 1;">Download for Intel</a>
                    
                    <div class="dl-requirements">
                        <h4 style="font-size: 12px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px;">Minimum Requirements</h4>
                        <p style="font-size: 12px; color: #5f6368; line-height: 1.6; margin: 0;">macOS versions with Apple security update support. This is typically the current and two previous versions. Min Version 12 (Monterey). x86 is not supported.</p>
                    </div>
                </div>"""

    linux_card = """<div class="dl-card" style="padding: 32px; flex: 1;">
                    <h3 class="dl-os-title" style="font-size: 18px; font-weight: 500; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; color: #1a1a1a;">
                        <svg viewBox="0 0 448 512" width="18" height="18" style="fill: currentColor;"><path d="M220.8 123.3c1.1 0 2.6-.4 2.6-.4s1.5.4 2.6.4c82.3 0 112 55.4 112 112s-29.7 112-112 112c-1.1 0-2.6-.4-2.6-.4s-1.5.4-2.6.4c-82.3 0-112-55.4-112-112s29.7-112 112-112zm-33.1 179.9c13.7 0 24.8-11.1 24.8-24.8s-11.1-24.8-24.8-24.8-24.8 11.1-24.8 24.8 11.1 24.8 24.8 24.8zm60.7 0c13.7 0 24.8-11.1 24.8-24.8s-11.1-24.8-24.8-24.8-24.8 11.1-24.8 24.8 11.1 24.8 24.8 24.8zM250.7 0C210.4 0 178 32.4 178 72.7c0 30.8 18.9 57.1 46.1 68.3-43 14.8-74.4 56.5-74.4 105.7 0 60.5 49 109.5 109.5 109.5s109.5-49 109.5-109.5c0-49.2-31.4-90.9-74.4-105.7 27.2-11.2 46.1-37.5 46.1-68.3C340.4 32.4 308 0 267.7 0h-17z"/></svg> Linux
                    </h3>
                    <a href="javascript:void(0);" class="dl-btn-primary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #1a1a1a; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; line-height: 1;">Download for x64</a>
                    <a href="javascript:void(0);" class="dl-btn-secondary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #f1f3f4; color: #1a1a1a; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 40px; box-sizing: border-box; line-height: 1;">Download for ARM64</a>
                    
                    <div class="dl-requirements">
                        <h4 style="font-size: 12px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px;">Minimum Requirements</h4>
                        <p style="font-size: 12px; color: #5f6368; line-height: 1.6; margin: 0;">glibc >= 2.28, glibcxx >= 3.4.25 (e.g. Ubuntu 20, Debian 10, Fedora 36, RHEL 8)</p>
                    </div>
                </div>"""

    new_cards = windows_card + "\n" + macos_card + "\n" + linux_card
    
    # We need to replace the grid content. 
    # The grid is wrapped in <div class="dl-grid" ...> ... </div>
    
    grid_match = re.search(r'<div class="dl-grid"[^>]*>([\s\S]*?)</div>\s*</div>\s*</div>\s*</main>', html)
    if grid_match:
        old_grid_content = grid_match.group(1)
        html = html.replace(old_grid_content, "\n" + new_cards + "\n                ")
    else:
        print("Could not find grid")
        # try fallback
        start = html.find('<div class="dl-card"')
        end = html.rfind('</div>', 0, html.rfind('</div>', 0, html.rfind('</main>')))
        if start != -1:
            html = html[:start] + new_cards + html[end:]
        
    with open('download.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print("Cards reordered and padded!")

if __name__ == "__main__":
    fix()
