import re
from bs4 import BeautifulSoup

def process_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

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

    # For Features, let's find the cards. They are likely in the section with "WHAT NAGI DOES"
    # Or they are .feature-card, .card-feature, etc.
    # A safe way is to find elements containing the old titles if I knew them, but I don't.
    # Let's search for "Explore features" or "WHAT NAGI DOES"
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))
    
    # Since doing BS4 blindly without knowing the class is risky, I'll print the HTML structure of the features section to the log so I can see what I'm dealing with.
    print(html[html.find('WHAT NAGI DOES'):html.find('WHAT NAGI DOES')+2000])

if __name__ == '__main__':
    process_index()
