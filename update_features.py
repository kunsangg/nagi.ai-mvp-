import re
from bs4 import BeautifulSoup

def process_file():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    features_data = {
        "Research Map": "Enter any topic. Nagi surfaces the 8–12 papers that define the field — ranked by relevance, with plain-language summaries. Not 50,000 results. The signal.",
        "Structured Reader": "Open any paper. Get a full breakdown — what they did, why it matters, key terms defined, limitations surfaced. No more hitting a wall of jargon.",
        "Field Connections": "See how papers connect, contradict, and build on each other. Who agrees with whom. How ideas evolved. Where the field is heading.",
        "Gap Detection": "Surface what hasn't been studied yet. Unanswered questions, understudied areas — perfect for proposals that add something genuinely new.",
        "Review Outliner": "Generate a structured literature review outline from your paper set — organised by theme and argument. A thinking structure you can actually write from.",
        "Reading List": "Your personal research library. Save papers, tag by topic, track reading progress, add notes. Never lose a paper again."
    }

    # Update Features body text
    for h in soup.find_all(['h2', 'h3', 'h4', 'div']):
        text = h.get_text(strip=True)
        if text in features_data:
            # find the next sibling paragraph or search within the parent container
            # Usually it's parent -> p
            parent = h.find_parent()
            p = parent.find('p')
            if p:
                p.string = features_data[text]

    workflow_data = {
        "Have a topic → find what matters": ("Step 1 · Discover", "Enter anything. Federated learning. Climate policy. Quantum error correction. Nagi surfaces the papers that actually define the field — ranked, explained, ready to read."),
        "Read without hitting a wall": ("Step 2 · Understand", "Open any paper and get a full plain-language breakdown. What they did. Why it matters. Key terms defined. Limitations surfaced. Then see how every paper connects to every other."),
        "Find what nobody has studied yet": ("Step 3 · Discover Gaps", "Nagi surfaces the unanswered questions and white spaces in any field. The open problems. The understudied areas. Where your work could actually add something new."),
        "Go from papers to an outline — instantly": ("Step 4 · Write", "Generate a structured literature review outline from your paper set, organised by theme, argument, and narrative flow. Not a summary. A thinking structure."),
        "Your research library, alive and growing": ("Step 5 · Organise", "Save papers. Tag by project. Track what you've read. Add notes. Never start from scratch on a topic you've already explored.")
    }

    # The original workflow headings might have been different!
    # "Step 1", "Step 2" might have been "Discover", "Read", etc.
    # Let me just replace the text by order if I can find the section.
    # The workflow section has "The full research workflow. In one place."
    # Let's find this section.
    workflow_heading = soup.find(text=re.compile(r"The full research workflow\. In one place\."))
    if workflow_heading:
        workflow_section = workflow_heading.find_parent('div', class_='section--white') or workflow_heading.find_parent('div', class_='section') or workflow_heading.find_parent('section')
        if workflow_section:
            # It should contain 5 items.
            pass

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))
        
    # Using regex to replace the exact text if BS4 isn't finding it.
    html_raw = str(soup)
    
    # Workflow regex replacements (assuming we can match old strings, but since we don't know the old strings, it's safer to just replace them manually by finding the classes).
    
    print("Features processed.")

if __name__ == '__main__':
    process_file()
