import os
import re
from bs4 import BeautifulSoup

def update_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    # Footer social icons (replace with correct links and proper platform icons)
    # The user asked to use inline SVGs for X, LinkedIn, GitHub.
    # I'll create a new social wrap with standard SVGs.
    social_svgs = """
    <div class="footer-social-wrap" style="display: flex; gap: 16px;">
        <a href="https://x.com/nagiai" target="_blank" style="color: #fff;"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
        <a href="https://linkedin.com/company/nagiai" target="_blank" style="color: #fff;"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
        <a href="https://github.com/nagiai" target="_blank" style="color: #fff;"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg></a>
    </div>
    """
    
    # We will replace the footer social wrapper using regex on the raw HTML because it's easier to ensure we get the right spot.
    
    # Let's fix feature cards using regex since we know the structure.
    features_data = [
        ("Research Map", "Enter any topic. Nagi surfaces the 8–12 papers that define the field — ranked by relevance, with plain-language summaries. Not 50,000 results. The signal."),
        ("Structured Reader", "Open any paper. Get a full breakdown — what they did, why it matters, key terms defined, limitations surfaced. No more hitting a wall of jargon."),
        ("Field Connections", "See how papers connect, contradict, and build on each other. Who agrees with whom. How ideas evolved. Where the field is heading."),
        ("Gap Detection", "Surface what hasn't been studied yet. Unanswered questions, understudied areas — perfect for proposals that add something genuinely new."),
        ("Review Outliner", "Generate a structured literature review outline from your paper set — organised by theme and argument. A thinking structure you can actually write from."),
        ("Reading List", "Your personal research library. Save papers, tag by topic, track reading progress, add notes. Never lose a paper again.")
    ]
    
    workflow_data = [
        ("Step 1 · Discover", "Have a topic → find what matters", "Enter anything. Federated learning. Climate policy. Quantum error correction. Nagi surfaces the papers that actually define the field — ranked, explained, ready to read."),
        ("Step 2 · Understand", "Read without hitting a wall", "Open any paper and get a full plain-language breakdown. What they did. Why it matters. Key terms defined. Limitations surfaced. Then see how every paper connects to every other."),
        ("Step 3 · Discover Gaps", "Find what nobody has studied yet", "Nagi surfaces the unanswered questions and white spaces in any field. The open problems. The understudied areas. Where your work could actually add something new."),
        ("Step 4 · Write", "Go from papers to an outline — instantly", "Generate a structured literature review outline from your paper set, organised by theme, argument, and narrative flow. Not a summary. A thinking structure."),
        ("Step 5 · Organise", "Your research library, alive and growing", "Save papers. Tag by project. Track what you've read. Add notes. Never start from scratch on a topic you've already explored.")
    ]
    
    researchers_data = [
        ("Tesla", "Described 700+ patents with no tool to map how ideas connected"),
        ("Freud", "Built an entire field from papers no one had synthesized before"),
        ("Einstein", "Cited work most researchers never actually read or understood"),
        ("Curie", "Pioneered radioactivity with no structured way to navigate prior research"),
        ("Carver", "Revolutionised agriculture through trial and error — no gap detection existed"),
        ("Pasteur", "Proved germ theory against a field with no way to surface contradicting evidence"),
        ("Turing", "Built computing foundations while manually tracking every related paper"),
        ("Carson", "Sparked a movement from research most people couldn't access or understand")
    ]
    
    html = str(soup)
    
    # Apply features replacement
    # Currently features might have headings like "Feature 1", "Feature 2" or something else.
    # The original template had placeholders or different text.
    # Since I don't know the exact text, I will search for the card elements.
    pass

def generate_pages():
    # Use index.html as a template to extract header and footer
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Split header and footer. Let's assume header ends at </nav> or similar.
    # A robust way is to find `<main>` or the first `<div class="section">`
    header_end = html.find('<main>')
    if header_end == -1:
        header_end = html.find('<div class="section--')
    footer_start = html.find('<footer')
    if footer_start == -1:
        footer_start = html.find('<div class="footer')
        
    header_html = html[:header_end]
    if '<main>' not in header_html:
        header_html += '\n<main style="padding-top: 100px; padding-bottom: 100px; min-height: 60vh;">\n<div class="container w-container">\n'
    else:
        header_html += '\n<div class="container w-container" style="padding-top: 100px; padding-bottom: 100px; min-height: 60vh;">\n'

    footer_html = '\n</div>\n</main>\n' + html[footer_start:]

    pages = {
        'cookies.html': {
            'title': 'Cookie Policy',
            'content': '''<h1>Cookie Policy</h1>
            <p>Nagi uses cookies to improve your experience. We use:</p>
            <ul>
                <li><strong>Essential cookies:</strong> required for the site to function</li>
                <li><strong>Analytics cookies:</strong> help us understand how people use Nagi (via privacy-respecting analytics)</li>
            </ul>
            <p>No advertising cookies. No third-party tracking.</p>
            <p>You can disable non-essential cookies in your browser settings at any time.</p>
            <br>
            <p>Last updated: June 2026</p>
            <p>Contact: <a href="mailto:hello@nagiai.co">hello@nagiai.co</a></p>'''
        },
        'privacy.html': {
            'title': 'Privacy Policy',
            'content': '''<h1>Privacy Policy</h1>
            <ul>
                <li>We collect only what we need: email address (if you sign up), usage data (anonymised)</li>
                <li>We do not sell your data. Ever.</li>
                <li>We do not share your data with third parties except where required by law</li>
                <li>Data is stored securely and never used for advertising</li>
                <li>You can request deletion of your data at any time by emailing hello@nagiai.co</li>
                <li>We use industry-standard encryption for all data in transit and at rest</li>
            </ul>
            <br>
            <p>Last updated: June 2026</p>'''
        },
        'terms.html': {
            'title': 'Terms of Service',
            'content': '''<h1>Terms of Service</h1>
            <ul>
                <li>Nagi is provided as-is during early access. Features may change.</li>
                <li>You may not use Nagi to reproduce, redistribute, or scrape academic content in violation of publisher terms</li>
                <li>Your research data and notes belong to you</li>
                <li>We reserve the right to suspend accounts that misuse the platform</li>
                <li>Nagi is not liable for decisions made based on research surfaced through the platform</li>
            </ul>
            <br>
            <p>Last updated: June 2026</p>
            <p>Contact: <a href="mailto:hello@nagiai.co">hello@nagiai.co</a></p>'''
        },
        'careers.html': {
            'title': 'Work at Nagi',
            'content': '''<h1>We're building something that matters.</h1>
            <p>Nagi is an early-stage AI research tool used by students, scientists, and professionals worldwide. We're a small, fast-moving team. If you care about making research accessible and you're exceptional at what you do — we want to talk.</p>
            <br>
            <h3>Current openings</h3>
            <p>No open roles right now. We hire when we find the right person, not when a role opens up.</p>
            <br>
            <a href="mailto:hello@nagiai.co" class="dl-btn-primary" style="display: inline-block; padding: 16px 24px; background-color: #1a1a1a; color: #fff; text-decoration: none; border-radius: 40px; font-weight: 500;">Introduce yourself → hello@nagiai.co</a>'''
        },
        'changelog.html': {
            'title': 'Changelog',
            'content': '''<h1>What's new in Nagi</h1>
            <br>
            <div style="border-left: 2px solid #eaeaea; padding-left: 24px; margin-bottom: 40px;">
                <h3>Version: v0.1 — Early Access</h3>
                <p style="color: #5f6368;">Date: June 2026</p>
                <ul>
                    <li>Research Map launched — topic-to-papers in under 10 seconds</li>
                    <li>Structured Reader available for all papers</li>
                    <li>Field Connections graph view in beta</li>
                    <li>Reading List with tagging and notes</li>
                    <li>Web app available at <a href="https://nagiai.vercel.app">nagiai.vercel.app</a></li>
                </ul>
            </div>'''
        }
    }

    for page_name, data in pages.items():
        # Update title in header
        page_header = header_header_html = re.sub(r'<title>.*?</title>', f'<title>{data["title"]} | Nagi</title>', header_html)
        full_page = page_header + data['content'] + footer_html
        
        # Also clean up javascript:void(0) in the new page headers/footers just in case
        full_page = re.sub(r'href="javascript:void\(0\)"', 'href="#"', full_page)
        
        with open(page_name, 'w', encoding='utf-8') as f:
            f.write(full_page)
        print(f"Created {page_name}")

if __name__ == "__main__":
    generate_pages()
