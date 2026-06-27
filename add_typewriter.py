import re

def fix():
    with open('download.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update the Heading HTML
    # We replace "for Web" with "for <span class='tw-wrap'><span id='tw-text'>Web</span><span id='tw-cursor'>|</span></span>"
    old_h1_match = re.search(r'<h1 class="dl-title"[^>]*>Download Nagi<br>for Web</h1>', html)
    if old_h1_match:
        old_h1 = old_h1_match.group(0)
        # We need to make sure the container doesn't shift height.
        # "Lock the second line height to the tallest word (Windows)" - Actually just inline-block should be fine.
        new_h1 = old_h1.replace('for Web', 'for <span style="display: inline-block; position: relative; border-bottom: 2px solid #1a1a1a; line-height: 1.1;"><span id="tw-text">Web</span><span id="tw-cursor" style="font-weight: 300; margin-left: 2px; color: #1a1a1a;">|</span></span>')
        html = html.replace(old_h1, new_h1)
    
    # 2. Add CSS for cursor blink
    style_block = """
    <style>
        @keyframes tw-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        #tw-cursor {
            animation: tw-blink 1s step-end infinite;
        }
    </style>
"""
    if 'tw-blink' not in html:
        html = html.replace('</head>', style_block + '</head>')

    # 3. Add JS for Typewriter
    script_block = """
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const words = ["Web", "macOS", "Windows"];
            let i = 0;
            let timer;
            const textEl = document.getElementById('tw-text');
            if (!textEl) return;

            function typeWriter(word, index, callback) {
                if (index < word.length) {
                    textEl.textContent += word.charAt(index);
                    timer = setTimeout(() => typeWriter(word, index + 1, callback), 80);
                } else {
                    timer = setTimeout(callback, 2000); // Hold for 2s
                }
            }

            function eraseWriter(callback) {
                let text = textEl.textContent;
                if (text.length > 0) {
                    textEl.textContent = text.substring(0, text.length - 1);
                    timer = setTimeout(() => eraseWriter(callback), 50);
                } else {
                    callback();
                }
            }

            function loop() {
                i = (i + 1) % words.length;
                eraseWriter(() => {
                    typeWriter(words[i], 0, loop);
                });
            }

            // Start the loop after the initial hold (since "Web" is already there)
            timer = setTimeout(loop, 2000);
        });
    </script>
"""
    if 'typeWriter(' not in html:
        html = html.replace('</body>', script_block + '</body>')

    with open('download.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print("Typewriter effect added!")

if __name__ == "__main__":
    fix()
