import re

faq_html = """
<!-- FAQ SECTION -->
<section class="section faq-section" style="padding: 100px 20px; background-color: transparent; color: white;">
    <div class="w-container" style="max-width: 800px; margin: 0 auto;">
        <h2 style="font-size: 32px; font-weight: 600; margin-bottom: 40px; text-align: left; letter-spacing: -0.5px;">Frequently asked questions</h2>
        <div class="faq-list">
            <div class="faq-item" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 24px 0;">
                <div class="faq-question" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 18px; font-weight: 500; transition: color 0.2s;">
                    What makes Nagi different from regular search engines?
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s; color: rgba(255,255,255,0.5);"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div class="faq-answer" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; opacity: 0; color: #a1a1aa; font-size: 16px; line-height: 1.5;">
                    <div style="padding-top: 16px;">Nagi uses specialized AI models to extract, summarize, and connect data directly from scientific papers and journals, whereas regular search engines only surface web pages.</div>
                </div>
            </div>
            <div class="faq-item" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 24px 0;">
                <div class="faq-question" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 18px; font-weight: 500; transition: color 0.2s;">
                    Who is Nagi for?
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s; color: rgba(255,255,255,0.5);"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div class="faq-answer" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; opacity: 0; color: #a1a1aa; font-size: 16px; line-height: 1.5;">
                    <div style="padding-top: 16px;">Nagi is designed for researchers, scientists, policy makers, and anyone who needs to quickly digest complex academic or technical literature.</div>
                </div>
            </div>
            <div class="faq-item" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 24px 0;">
                <div class="faq-question" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 18px; font-weight: 500; transition: color 0.2s;">
                    Is Nagi free?
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s; color: rgba(255,255,255,0.5);"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div class="faq-answer" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; opacity: 0; color: #a1a1aa; font-size: 16px; line-height: 1.5;">
                    <div style="padding-top: 16px;">We offer a free tier with basic features, as well as premium plans for advanced research tools and higher processing limits.</div>
                </div>
            </div>
            <div class="faq-item" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 24px 0;">
                <div class="faq-question" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 18px; font-weight: 500; transition: color 0.2s;">
                    What languages and apps are supported?
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s; color: rgba(255,255,255,0.5);"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div class="faq-answer" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; opacity: 0; color: #a1a1aa; font-size: 16px; line-height: 1.5;">
                    <div style="padding-top: 16px;">Nagi currently supports English, Japanese, and Spanish literature, and integrates seamlessly with major reference managers like Zotero and Mendeley.</div>
                </div>
            </div>
            <div class="faq-item" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 24px 0;">
                <div class="faq-question" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 18px; font-weight: 500; transition: color 0.2s;">
                    Can I talk to customer support?
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s; color: rgba(255,255,255,0.5);"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div class="faq-answer" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; opacity: 0; color: #a1a1aa; font-size: 16px; line-height: 1.5;">
                    <div style="padding-top: 16px;">Yes! You can reach our dedicated support team 24/7 via the chat widget in the app or by emailing support@nagi.ai.</div>
                </div>
            </div>
        </div>
    </div>
</section>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            const icon = item.querySelector('svg');
            
            question.addEventListener('mouseenter', () => question.style.color = '#46c2eb');
            question.addEventListener('mouseleave', () => question.style.color = 'white');
            
            question.addEventListener('click', () => {
                const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';
                
                // Close all others
                faqItems.forEach(otherItem => {
                    otherItem.querySelector('.faq-answer').style.maxHeight = '0px';
                    otherItem.querySelector('.faq-answer').style.opacity = '0';
                    otherItem.querySelector('svg').style.transform = 'rotate(0deg)';
                });
                
                if (!isOpen) {
                    answer.style.maxHeight = (answer.scrollHeight + 20) + 'px';
                    answer.style.opacity = '1';
                    icon.style.transform = 'rotate(180deg)';
                }
            });
        });
    });
</script>
<!-- END FAQ SECTION -->
"""

def inject_faq():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Inject before the footer
    new_html = html.replace('<footer class="footer black-bg"', faq_html + '\n<footer class="footer black-bg"')
    
    if new_html == html:
        print("Could not find footer in index.html to inject FAQ")
    else:
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(new_html)
        print("Successfully injected FAQ into index.html")

if __name__ == '__main__':
    inject_faq()
