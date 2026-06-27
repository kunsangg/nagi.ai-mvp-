from bs4 import BeautifulSoup

def process_file():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    # 1. Find the heading div we just inserted
    heading_div = soup.find(lambda tag: tag.name == 'div' and tag.find('p', text="WHO IT'S FOR"))
    if not heading_div:
        # try stripping text
        heading_div = soup.find(lambda tag: tag.name == 'div' and tag.find('p', string=lambda s: s and "WHO IT'S FOR" in s))
    
    # 2. Find the quote wrap
    quote_wrap = soup.find('div', class_='monolog-quote-wrap')
    
    if heading_div and quote_wrap:
        # Extract heading div
        heading_div.extract()
        
        # We need to insert it into monolog-left, replacing quote_wrap
        monolog_left = quote_wrap.parent
        quote_wrap.decompose()
        
        monolog_left.append(heading_div)
        
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(str(soup))
        print("Success: Moved heading to monolog-left and removed quotes.")
    else:
        print("Error: Could not find elements.")
        print(f"heading_div: {heading_div}")
        print(f"quote_wrap: {quote_wrap}")

if __name__ == '__main__':
    process_file()
