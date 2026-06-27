import re
from bs4 import BeautifulSoup

def process_file():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    for tag in soup.find_all(['p', 'h2', 'div', 'span', 'h3']):
        text = tag.get_text(strip=True).replace('\xa0', ' ')
        
        # WE ARE -> INTRODUCING
        if text == 'WE ARE':
            tag.string = 'INTRODUCING'
            
        # Hero Subheading
        elif text.startswith('Google Scholar shows you 50,000 papers.'):
            tag.string = "Google Scholar returns 50,000 results. Nagi returns the 10 that matter — with full plain-language breakdowns, connection maps, and gap analysis built in. The ocean of research doesn't get smaller. Nagi teaches you to navigate it."
            
        # About Us body
        elif text.startswith('Someone gets a research topic'):
            tag.string = "Every year, 100 million people engage with academic research — students, scientists, analysts, professionals. Almost none of them have an environment built for comprehension. They get search engines. They get PDFs. They get overwhelmed. Nagi is the first tool built for the full research workflow — from finding what matters to actually understanding it."
            
        # Features intro label
        elif text == 'OUR BRANDS':
            tag.string = 'WHAT NAGI DOES'
            
        # Features intro paragraph
        elif text.startswith('A complete environment for comprehension. From topic discovery'):
            tag.string = "A complete environment for research comprehension. From topic discovery to field synthesis — every tool in one place, built to work together."
            
        # Researchers label
        elif text == 'JOIN OUR TEAM':
            tag.string = "THEY STRUGGLED WITHOUT IT. WITH NAGI, YOU WON'T."

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))
        
    html_raw = str(soup)
    
    html_raw = re.sub(r'(>Have a topic.*?)(?=</)', '>Have a topic → find what matters', html_raw)
    html_raw = re.sub(r'(>Enter anything.*?)(?=</)', '>Enter anything. Federated learning. Climate policy. Quantum error correction. Nagi surfaces the papers that actually define the field — ranked, explained, ready to read.', html_raw)
    
    html_raw = re.sub(r'(>Structured Reader explains each paper.*?)(?=</)', '>Read without hitting a wall', html_raw)
    html_raw = re.sub(r'(>Open any paper — get.*?)(?=</)', '>Open any paper and get a full plain-language breakdown. What they did. Why it matters. Key terms defined. Limitations surfaced. Then see how every paper connects to every other.', html_raw)
    
    html_raw = re.sub(r'(>Find what nobody has researched yet.*?)(?=</)', '>Find what nobody has studied yet', html_raw)
    html_raw = re.sub(r'(>Nagi surfaces the unanswered.*?)(?=</)', '>Nagi surfaces the unanswered questions and white spaces in any field. The open problems. The understudied areas. Where your work could actually add something new.', html_raw)

    html_raw = re.sub(r'(>Go from papers to a literature review outline.*?)(?=</)', '>Go from papers to an outline — instantly', html_raw)
    html_raw = re.sub(r'(>Generate a structured outline from your paper.*?)(?=</)', '>Generate a structured literature review outline from your paper set, organised by theme, argument, and narrative flow. Not a summary. A thinking structure.', html_raw)
    
    html_raw = re.sub(r'(>Your research library. Alive and growing.*?)(?=</)', '>Your research library, alive and growing', html_raw)
    html_raw = re.sub(r'(>Save papers. Tag by project. Track what you.*?)(?=</)', '>Save papers. Tag by project. Track what you\'ve read. Add notes. Never start from scratch on a topic you\'ve already explored.', html_raw)
    
    # Also clean up duplicate quotes
    html_raw = re.sub(r'<p[^>]*>“Nagi empowers researchers to cut through the noise.*?<\/p>', '', html_raw)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html_raw)

    print("Precise update done")

if __name__ == '__main__':
    process_file()
