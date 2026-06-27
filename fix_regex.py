import re

def fix():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Top announcement bar
    html = re.sub(r'Discover more on our new transformation strategy', r'Nagi is now in early access — join the waitlist →', html)
    
    # 2. Marquee
    # Original text might be "LATEST NEWS", "LATESTÂ NEWS", "We have launched our transformation strategy", "SRMG ventures", etc.
    # Let's replace the content inside the marquee items.
    html = re.sub(r'We have launched our transformation strategy\s*<span[^>]*>.*?</span>', 'Research Map · Surface the papers that actually matter', html)
    html = re.sub(r'SRMG Ventures[^<]*', 'Structured Reader · Understand any paper in plain language', html)
    html = re.sub(r'SRMG signs[^<]*', 'Field Connections · See how ideas connect, contradict, and evolve', html)
    # The template had duplicate items so let's just do a blanket replace if we find the marquee elements.
    
    # 3. Mobile Nav
    # Mobile nav is probably a list.
    # Keep: Home, The Problem, Features, Workflow, Pricing, Start, Contact
    # Add: Download
    if '<ul' in html and 'Home' in html:
        pass # Will do manually or via stronger regex

    # 4. Footer Legal links
    html = re.sub(r'href="javascript:void\(0\)[^"]*"([^>]*)>Cookies', r'href="/cookies.html"\1>Cookies', html)
    html = re.sub(r'href="javascript:void\(0\)[^"]*"([^>]*)>Privacy', r'href="/privacy.html"\1>Privacy', html)
    html = re.sub(r'href="javascript:void\(0\)[^"]*"([^>]*)>Terms', r'href="/terms.html"\1>Terms', html)
    html = re.sub(r'href="javascript:void\(0\)[^"]*"([^>]*)>Careers', r'href="/careers.html"\1>Careers', html)
    
    # Update © 2026 Nagi Research AI. All rights reserved.
    html = re.sub(r'©[^<]*', '© 2026 Nagi Research AI. All rights reserved.', html)
    
    # Newsletter
    html = re.sub(r'Stay in the loop\?', 'Stay in the loop', html)
    html = re.sub(r'placeholder="[^"]*"', 'placeholder="your@email.com"', html)
    html = re.sub(r'value="Subscribe"', 'value="Subscribe →"', html)
    html = re.sub(r'>Subscribe<', '>Subscribe →<', html) # If it's a button

    # HOMEPAGE HERO
    html = re.sub(r'>WE ARE<', '>INTRODUCING<', html)
    html = re.sub(r'>We are<', '>INTRODUCING<', html)
    
    old_subheading = r"The ocean of research doesn't get smaller\. Nagi teaches you to navigate it\."
    new_subheading = "Google Scholar returns 50,000 results. Nagi returns the 10 that matter — with full plain-language breakdowns, connection maps, and gap analysis built in. The ocean of research doesn't get smaller. Nagi teaches you to navigate it."
    # We might have replaced it earlier, let's just make sure.
    
    # About us body text
    html = re.sub(r"Every year, 100 million people engage with academic research[^<]*", 
                  "Every year, 100 million people engage with academic research — students, scientists, analysts, professionals. Almost none of them have an environment built for comprehension. They get search engines. They get PDFs. They get overwhelmed. Nagi is the first tool built for the full research workflow — from finding what matters to actually understanding it.", html)

    # Features Intro
    html = html.replace('>OUR BRANDS<', '>WHAT NAGI DOES<')
    html = re.sub(r"A complete environment for research comprehension[^<]*", 
                  "A complete environment for research comprehension. From topic discovery to field synthesis — every tool in one place, built to work together.", html)

    # Features Cards copy
    html = html.replace('discover nagi →', 'discover nagi →') # fix JS void later
    
    # Workflow
    html = html.replace("The Full Workflow: From 'I have a topic' to 'I have written something I actually understand.'", 
                        "The full research workflow. In one place.")
                        
    html = html.replace('learn nagi workflow →', 'see how it works →')

    # Researchers
    html = html.replace('>JOIN OUR TEAM<', '>THEY STRUGGLED WITHOUT IT. WITH NAGI, YOU WON\'T.<')

    # Get in touch
    html = re.sub(r"Nagi is built by researchers, for researchers\.[^<]*", 
                  "Nagi is built by researchers, for researchers. We're a small team moving fast. If you have feedback, a partnership idea, or just want to talk research — we want to hear from you.", html)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Regex replacements applied")

if __name__ == "__main__":
    fix()
