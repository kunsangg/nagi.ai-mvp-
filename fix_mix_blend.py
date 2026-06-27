import re

def main():
    with open('style.css', 'r', encoding='utf-8') as f:
        css = f.read()

    # 1. Restore mix-blend-mode to .nagi-button block
    # My previous script replaced mix-blend-mode: difference with /* mix-blend-mode removed */
    # Let's restore it.
    css = css.replace('/* mix-blend-mode removed */', 'mix-blend-mode: difference !important;')

    # 2. Force text color to #ffffff so difference mode works correctly
    # Replace color: var(--text-primary, #fff) !important; inside nagi button blocks
    css = re.sub(r'color:\s*var\(--text-primary.*?\) !important;', 'color: #ffffff !important;', css)
    
    # 3. Restore border-color to rgba(255, 255, 255, 0.8)
    css = re.sub(r'border-color:\s*var\(--text-primary\)\s*!important;\s*opacity:\s*0\.8;', 'border-color: rgba(255, 255, 255, 0.8) !important;', css)

    # 4. Restore SVG stroke/fill to #ffffff
    css = re.sub(r'stroke:\s*var\(--text-primary\)\s*!important;', 'stroke: #ffffff !important;', css)
    css = re.sub(r'fill:\s*var\(--text-primary\)\s*!important;', 'fill: #ffffff !important;', css)

    # 5. Fix .section-title--small to also use mix-blend-mode difference and #ffffff
    # Previous: color: var(--text-primary) !important; opacity: 0.6 !important;
    css = re.sub(r'color:\s*var\(--text-primary\)\s*!important;\s*opacity:\s*0\.6\s*!important;', 
                 'color: #ffffff !important; opacity: 0.8 !important; mix-blend-mode: difference !important;', css)

    # We will keep .meech-caption using var(--text-primary) because it doesn't use mix-blend-mode difference.
    
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css)

    print("Restored difference mode with forced white color!")

if __name__ == '__main__':
    main()
