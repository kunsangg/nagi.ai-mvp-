import re

def fix():
    html_path = 'download.html'
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    new_dl_main = """<main class="main dl-main">
    <div class="dl-page-container">
        
        <!-- Header -->
        <div class="dl-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
            <h1 class="dl-title" style="font-size: 52px; font-weight: 400; line-height: 1.15; letter-spacing: -1px; margin: 0;">Download Google<br>Antigravity for Windows</h1>
            <a href="javascript:void(0);" class="dl-btn-ghost" style="padding: 10px 20px; border-radius: 40px; background-color: #f1f3f4; color: #1a1a1a; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">View previous releases</a>
        </div>

        <!-- Tabs -->
        <div class="dl-tabs" style="display: flex; gap: 32px; margin-bottom: 60px; border-bottom: 1px solid #eaeaea;">
            <div class="dl-tab active" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #1a73e8; cursor: pointer; font-weight: 500; padding-bottom: 16px; margin-bottom: -1px; border-bottom: 2px solid #1a73e8;">
                <span class="dl-tab-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 20H2L12 2Z"></path></svg>
                </span> Antigravity 2.0
            </div>
            <div class="dl-tab" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #5f6368; cursor: pointer; font-weight: 500; padding-bottom: 16px; margin-bottom: -1px; border-bottom: 2px solid transparent;">
                <span class="dl-tab-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-6-6-6M12 19h8"></path></svg>
                </span> Antigravity CLI
            </div>
            <div class="dl-tab" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #5f6368; cursor: pointer; font-weight: 500; padding-bottom: 16px; margin-bottom: -1px; border-bottom: 2px solid transparent;">
                <span class="dl-tab-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                </span> Antigravity IDE
            </div>
            <div class="dl-tab" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #5f6368; cursor: pointer; font-weight: 500; padding-bottom: 16px; margin-bottom: -1px; border-bottom: 2px solid transparent;">
                <span class="dl-tab-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                </span> Antigravity SDK
            </div>
        </div>

        <!-- Content -->
        <div class="dl-section">
            <h2 class="dl-section-title" style="font-size: 28px; font-weight: 400; margin-bottom: 40px; color: #1a1a1a;">Antigravity 2.0</h2>
            
            <div class="dl-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0;">
                <!-- macOS -->
                <div class="dl-card" style="border-right: 1px solid #eaeaea; padding-right: 40px; padding-left: 0;">
                    <h3 class="dl-os-title" style="font-size: 18px; font-weight: 500; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; color: #1a1a1a;">
                        <svg viewBox="0 0 384 512" width="18" height="18" style="fill: currentColor;"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg> macOS
                    </h3>
                    <a href="javascript:void(0);" class="dl-btn-primary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #1a1a1a; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; line-height: 1;">Download for Apple Silicon</a>
                    <a href="javascript:void(0);" class="dl-btn-secondary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #f1f3f4; color: #1a1a1a; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 40px; box-sizing: border-box; line-height: 1;">Download for Intel</a>
                    
                    <div class="dl-requirements">
                        <h4 style="font-size: 12px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px;">Minimum Requirements</h4>
                        <p style="font-size: 12px; color: #5f6368; line-height: 1.6; margin: 0;">macOS versions with Apple security update support. This is typically the current and two previous versions. Min Version 12 (Monterey). x86 is not supported.</p>
                    </div>
                </div>

                <!-- Windows -->
                <div class="dl-card" style="border-right: 1px solid #eaeaea; padding-right: 40px; padding-left: 40px;">
                    <h3 class="dl-os-title" style="font-size: 18px; font-weight: 500; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; color: #1a1a1a;">
                        <svg viewBox="0 0 448 512" width="18" height="18" style="fill: currentColor;"><path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg> Windows
                    </h3>
                    <a href="javascript:void(0);" class="dl-btn-primary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #1a1a1a; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; line-height: 1;">Download for x64</a>
                    <a href="javascript:void(0);" class="dl-btn-secondary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #f1f3f4; color: #1a1a1a; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 40px; box-sizing: border-box; line-height: 1;">Download for ARM64</a>
                    
                    <div class="dl-requirements">
                        <h4 style="font-size: 12px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px;">Minimum Requirements</h4>
                        <p style="font-size: 12px; color: #5f6368; line-height: 1.6; margin: 0;">Windows 10 (64 bit)</p>
                    </div>
                </div>

                <!-- Linux -->
                <div class="dl-card" style="border-right: none; padding-right: 0; padding-left: 40px;">
                    <h3 class="dl-os-title" style="font-size: 18px; font-weight: 500; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; color: #1a1a1a;">
                        <svg viewBox="0 0 448 512" width="18" height="18" style="fill: currentColor;"><path d="M220.8 123.3c1.1 0 2.6-.4 2.6-.4s1.5.4 2.6.4c82.3 0 112 55.4 112 112s-29.7 112-112 112c-1.1 0-2.6-.4-2.6-.4s-1.5.4-2.6.4c-82.3 0-112-55.4-112-112s29.7-112 112-112zm-33.1 179.9c13.7 0 24.8-11.1 24.8-24.8s-11.1-24.8-24.8-24.8-24.8 11.1-24.8 24.8 11.1 24.8 24.8 24.8zm60.7 0c13.7 0 24.8-11.1 24.8-24.8s-11.1-24.8-24.8-24.8-24.8 11.1-24.8 24.8 11.1 24.8 24.8 24.8zM250.7 0C210.4 0 178 32.4 178 72.7c0 30.8 18.9 57.1 46.1 68.3-43 14.8-74.4 56.5-74.4 105.7 0 60.5 49 109.5 109.5 109.5s109.5-49 109.5-109.5c0-49.2-31.4-90.9-74.4-105.7 27.2-11.2 46.1-37.5 46.1-68.3C340.4 32.4 308 0 267.7 0h-17z"/></svg> Linux
                    </h3>
                    <a href="javascript:void(0);" class="dl-btn-primary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #1a1a1a; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; line-height: 1;">Download for x64</a>
                    <a href="javascript:void(0);" class="dl-btn-secondary" style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 16px 24px; border-radius: 40px; background-color: #f1f3f4; color: #1a1a1a; text-decoration: none; font-weight: 500; font-size: 14px; margin-bottom: 40px; box-sizing: border-box; line-height: 1;">Download for ARM64</a>
                    
                    <div class="dl-requirements">
                        <h4 style="font-size: 12px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px;">Minimum Requirements</h4>
                        <p style="font-size: 12px; color: #5f6368; line-height: 1.6; margin: 0;">glibc >= 2.28, glibcxx >= 3.4.25 (e.g. Ubuntu 20, Debian 10, Fedora 36, RHEL 8)</p>
                    </div>
                </div>

            </div>
        </div>

    </div>
</main>"""

    # We will replace everything from <main class="main dl-main"> to </main>
    html = re.sub(r'<main class="main dl-main">[\s\S]*?</main>', new_dl_main, html)

    # I will also add a cache buster to CSS
    html = html.replace('style.css?v=3', 'style.css?v=4')
    html = html.replace('style.css?v=2', 'style.css?v=4')
    html = html.replace('style.css"', 'style.css?v=4"')

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print("HTML updated")

if __name__ == "__main__":
    fix()
