import re

def fix():
    with open('download.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Title
    html = re.sub(r'Download Nagi<br>for Windows', r'Download Nagi<br>for Web', html)

    # 2. Heading subtext
    html = html.replace('View previous releases', 'View changelog')

    # 3. Cards
    web_card = """<div class="dl-card" style="padding: 32px; flex: 1;">
                    <h3 class="dl-os-title" style="font-size: 18px; font-weight: 500; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; color: #1a1a1a;">
                        <svg viewBox="0 0 496 512" width="18" height="18" style="fill: currentColor;"><path d="M248 8C111.03 8 0 119.03 0 256s111.03 248 248 248 248-111.03 248-248S384.97 8 248 8zm0 448c-110.28 0-200-89.72-200-200S137.72 56 248 56s200 89.72 200 200-89.72 200-200 200zm103.54-297.43C363.36 122.95 383.65 149.2 396.06 181h-85.34c-6.84-41.97-20.91-80.12-40.82-113.57zM248 80.22c22.1 34.02 38.6 74.07 46.96 117.78H201.04c8.36-43.71 24.86-83.76 46.96-117.78zm-56.18 3.35c-19.91 33.45-33.98 71.6-40.82 113.57H65.66c12.41-31.8 32.7-58.05 54.52-77.43zM65.66 213h85.34c-2.45 28.16-2.45 57.84 0 86H65.66c-3.15-28.18-3.15-57.82 0-86zm34.52 140.43C122.01 386.88 136.08 425.03 155.99 458.48c-21.82-19.38-42.11-45.63-54.52-77.43h84.05zm82.4 82.35c-19.91-33.45-33.98-71.6-40.82-113.57h90.8c-6.84 41.97-20.91 80.12-40.82 113.57zM248 431.78c-22.1-34.02-38.6-74.07-46.96-117.78h93.92c-8.36 43.71-24.86 83.76-46.96 117.78zm56.18-3.35c19.91-33.45 33.98-71.6 40.82-113.57h85.34c-12.41 31.8-32.7 58.05-54.52 77.43zM430.34 299h-85.34c2.45-28.16 2.45-57.84 0-86h85.34c3.15 28.18 3.15 57.82 0 86z"/></svg> Web
                    </h3>
                    <a href="javascript:void(0);" class="dl-btn-primary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #1a1a1a; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 40px; box-sizing: border-box; line-height: 1;">Open in browser</a>
                    
                    <div class="dl-requirements">
                        <h4 style="font-size: 12px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px;">Works on any modern browser</h4>
                        <p style="font-size: 12px; color: #5f6368; line-height: 1.6; margin: 0;">Chrome 90+, Firefox 88+, Safari 14+, Edge 90+</p>
                    </div>
                </div>"""

    macos_card = """<div class="dl-card" style="padding: 32px; flex: 1;">
                    <h3 class="dl-os-title" style="font-size: 18px; font-weight: 500; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; color: #1a1a1a;">
                        <svg viewBox="0 0 384 512" width="18" height="18" style="fill: currentColor;"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg> macOS
                    </h3>
                    <a href="javascript:void(0);" class="dl-btn-primary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #1a1a1a; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; line-height: 1;">Coming soon</a>
                    <a href="javascript:void(0);" class="dl-btn-secondary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #f1f3f4; color: #1a1a1a; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 40px; box-sizing: border-box; line-height: 1;">Notify me</a>
                    
                    <div class="dl-requirements">
                        <h4 style="font-size: 12px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px;">Minimum Requirements</h4>
                        <p style="font-size: 12px; color: #5f6368; line-height: 1.6; margin: 0;">macOS 12 (Monterey) or later. Apple Silicon + Intel supported.</p>
                    </div>
                </div>"""

    windows_card = """<div class="dl-card" style="padding: 32px; flex: 1;">
                    <h3 class="dl-os-title" style="font-size: 18px; font-weight: 500; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; color: #1a1a1a;">
                        <svg viewBox="0 0 448 512" width="18" height="18" style="fill: currentColor;"><path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg> Windows
                    </h3>
                    <a href="javascript:void(0);" class="dl-btn-primary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #1a1a1a; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; line-height: 1;">Coming soon</a>
                    <a href="javascript:void(0);" class="dl-btn-secondary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #f1f3f4; color: #1a1a1a; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 40px; box-sizing: border-box; line-height: 1;">Notify me</a>
                    
                    <div class="dl-requirements">
                        <h4 style="font-size: 12px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px;">Minimum Requirements</h4>
                        <p style="font-size: 12px; color: #5f6368; line-height: 1.6; margin: 0;">Windows 10 (64 bit) or later.</p>
                    </div>
                </div>"""

    new_cards = web_card + "\n" + macos_card + "\n" + windows_card
    
    # We replace the content inside the dl-grid
    grid_match = re.search(r'<div class="dl-grid"[^>]*>([\s\S]*?)</div>\s*</div>\s*</div>\s*</main>', html)
    if grid_match:
        old_grid_content = grid_match.group(1)
        html = html.replace(old_grid_content, "\n" + new_cards + "\n                ")
    else:
        print("Could not find grid")
        
    with open('download.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print("Content updated successfully!")

if __name__ == "__main__":
    fix()
