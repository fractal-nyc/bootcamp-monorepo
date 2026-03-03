# TODO: Update diagram with SimHash/MinHash algorithms
# TODO: 

from collections import deque

def fetch(url):
    # TODO: fetch the page at the given url
    return ''

def store_contents(url, contents):
    # TODO: store the contents of the page at the url in static storage
    return

def extract_links(contents):
    # TODO: perform link extraction
    return ['link1', 'link2', 'etc']

# INIT

# The starting url from which to begin our crawl
seed = 'http://www.example.com/'

# the next urls to explore (FIFO)
frontier = deque([seed])

# all the urls we've seen in a set for easy lookup
seen = {seed}

# all the urls we've fully crawled (retrieved contents and processed
# links) initialize with set() instead of {} since it's currently
# empty
crawled = set()

# LOOP
while frontier:
    # Get the next url from the frontier
    url = frontier.popleft()

    # get the HTML at the URL
    contents = fetch(url)
    # store the HTML for later processing
    store_contents(url, contents)

    # get all the links to other pages from the url
    links = extract_links(contents)
    # go through all the links
    for link in links:
        # if we've already seen the link before, don't add it to the frontier
        if link in seen:
            continue
        # otherwise, extend the frontier
        frontier.append(link)
        # and mark it as seen
        seen.add(link)

    # mark that we've fully crawled the url
    crawled.add(url)
