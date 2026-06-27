from bs4 import BeautifulSoup

def extract_main():
    with open('antigravity.html', 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    main = soup.find('main')
    
    if main:
        with open('extracted_main.html', 'w', encoding='utf-8') as out:
            out.write(main.prettify())
        print("Extracted successfully.")
    else:
        print("No main tag found.")

if __name__ == "__main__":
    extract_main()
