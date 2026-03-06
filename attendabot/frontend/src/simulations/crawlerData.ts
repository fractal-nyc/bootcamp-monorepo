import type { CrawlerNode, CrawlerEdge, CrawlerStep } from "./crawlerTypes";

/** Box dimensions shared by all nodes. */
export const NODE_W = 148;
export const NODE_H = 44;

export const crawlerNodes: CrawlerNode[] = [
  { id: "frontier",     label: "Frontier URLs",      sublabel: "NoSQL",         cx: 440, cy: 55,  color: "#3b82f6" },
  { id: "cooldown",     label: "Cooldown Cache",      sublabel: "Redis",         cx: 770, cy: 70,  color: "#f97316" },
  { id: "seen-cache",   label: "Seen Cache",          sublabel: "Bloom Filter",  cx: 100, cy: 192, color: "#8b5cf6" },
  { id: "provider",     label: "URL Provider",        sublabel: "Service",       cx: 440, cy: 192, color: "#6366f1" },
  { id: "mq-crawled",   label: "Message Queue",       sublabel: "URL Crawled",   cx: 770, cy: 192, color: "#ec4899" },
  { id: "seen-db",      label: "Seen DB",             sublabel: "NoSQL",         cx: 100, cy: 315, color: "#8b5cf6" },
  { id: "fingerprint",  label: "Content Fingerprint", sublabel: "Store",         cx: 620, cy: 315, color: "#f59e0b" },
  { id: "crawled",      label: "Crawled DB",          sublabel: undefined,       cx: 100, cy: 435, color: "#ef4444" },
  { id: "worker",       label: "Fetch+Extract",       sublabel: "Worker",        cx: 440, cy: 435, color: "#14b8a6" },
  { id: "index-worker", label: "Process+Index",       sublabel: "Workers",       cx: 770, cy: 435, color: "#10b981" },
  { id: "mq-links",     label: "Message Queue",       sublabel: "Links Found",   cx: 100, cy: 555, color: "#ec4899" },
  { id: "dns-cache",    label: "DNS+robots.txt",      sublabel: "Cache (Redis)", cx: 295, cy: 555, color: "#64748b" },
  { id: "dns-service",  label: "DNS Service",         sublabel: undefined,       cx: 285, cy: 635, color: "#64748b" },
  { id: "s3",           label: "S3 Storage",          sublabel: undefined,       cx: 565, cy: 555, color: "#22c55e" },
  { id: "search-db",    label: "Text Search DB",      sublabel: "ElasticSearch", cx: 770, cy: 555, color: "#10b981" },
];

export const crawlerEdges: CrawlerEdge[] = [
  { id: "frontier→provider",   from: "frontier",     to: "provider"     },
  { id: "provider→cooldown",   from: "provider",     to: "cooldown"     },
  { id: "provider→worker",     from: "provider",     to: "worker"       },
  { id: "worker→dns-cache",     from: "worker",       to: "dns-cache"    },
  { id: "dns-cache→dns-svc",   from: "dns-cache",    to: "dns-service"  },
  { id: "worker→worker",       from: "worker",       to: "worker"       }, // self-loop
  { id: "worker→fingerprint",  from: "worker",       to: "fingerprint"  },
  { id: "worker→s3",           from: "worker",       to: "s3"           },
  { id: "worker→mq-links",     from: "worker",       to: "mq-links"     },
  { id: "mq-links→provider",   from: "mq-links",     to: "provider"     },
  { id: "provider→crawled",    from: "provider",     to: "crawled"      },
  { id: "provider→mq-crawled", from: "provider",     to: "mq-crawled"   },
  { id: "provider→seen-cache", from: "provider",     to: "seen-cache"   },
  { id: "seen-cache→seen-db",  from: "seen-cache",   to: "seen-db"      },
  { id: "provider→frontier",   from: "provider",     to: "frontier"     },
  { id: "mq-crawled→index",    from: "mq-crawled",   to: "index-worker" },
  { id: "index→s3",            from: "index-worker", to: "s3"           },
  { id: "index→search",        from: "index-worker", to: "search-db"    },
  { id: "crawled→provider",    from: "crawled",      to: "provider"     },
];

export const crawlerSteps: CrawlerStep[] = [
  {
    num: "1",
    label: "Inject seed URLs",
    description:
      "Initialization: Seed URLs are injected directly into the URL Frontier (a NoSQL priority queue) to kick off the crawler. These are the hand-picked starting points from which the rest of the web will be discovered.",
    payload: `["https://en.wikipedia.org",\n "https://github.com",\n "https://reddit.com"]`,
    edges: [],
    nodes: ["frontier"],
    color: "#3b82f6",
  },
  {
    num: "2",
    label: "Pull highest-priority URL",
    description:
      "Task Selection: The URL Provider Service iterates through the domains assigned to it (via consistent hashing / sharding) and pulls the highest-priority URL for a currently 'available' domain from the Frontier.",
    edges: ["frontier→provider"],
    nodes: ["frontier", "provider"],
    color: "#6366f1",
  },
  {
    num: "3",
    label: "Lock domain (politeness TTL)",
    description:
      "Politeness Lock: The Provider immediately writes the domain to the Cooldown Cache (Redis) with a TTL. This temporarily locks the domain and prevents the crawler from DDoS-ing the target server. A 30-second TTL means at most 2 requests per minute per domain.",
    payload: `SET domain:github.com "locked" EX 30`,
    edges: ["provider→cooldown"],
    nodes: ["provider", "cooldown"],
    color: "#f97316",
  },
  {
    num: "4",
    label: "Dispatch to worker (async)",
    description:
      "Dispatch: The Provider asynchronously hands off the URL to a Fetch+Extract worker via a Promise. Because this is async, the Provider is immediately free to schedule other URLs for other available domains — it doesn't wait for the fetch to complete.",
    edges: ["provider→worker"],
    nodes: ["provider", "worker"],
    color: "#6366f1",
  },
  {
    num: "5",
    label: "Pre-flight: DNS & robots.txt check",
    description:
      "Pre-flight Checks: The worker checks the local DNS & robots.txt Cache (Redis) to resolve the server's IP address and verify that the specific path is legally allowed to be crawled. Caching these lookups avoids repeated DNS queries.",
    payload: `GET dns:github.com           → "140.82.114.4"\nGET robots:github.com:/pricing → "Allow: /"`,
    edges: ["worker→dns-cache", "dns-cache→dns-svc"],
    nodes: ["worker", "dns-cache", "dns-service"],
    color: "#64748b",
  },
  {
    num: "6",
    label: "Fetch page & extract links + MinHash",
    description:
      "Fetch & Process: The worker downloads the page HTML, strips boilerplate (ads, nav bars, footers), extracts all outgoing <a href> links, and generates a MinHash fingerprint of the core text content.",
    payload: `GET https://github.com/pricing\n→ 200 OK, 52KB HTML\n→ 34 links extracted\n→ MinHash: [0x3f, 0xa1, 0xb2, 0xd4, ...]`,
    edges: ["worker→worker"],
    nodes: ["worker"],
    color: "#14b8a6",
  },
  {
    num: "7",
    label: "Check content fingerprint (dedup)",
    description:
      "Deduplication: The worker checks the Content Fingerprint Store. If the Hamming distance between the new MinHash and an existing hash falls below the threshold, the page is a near-duplicate. Processing aborts here to avoid storing redundant content.",
    payload: `Hamming(new_hash, existing) = 3\nThreshold = 5  →  UNIQUE ✓\n\nIf duplicate → ABORT (skip steps 8–16)`,
    edges: ["worker→fingerprint"],
    nodes: ["worker", "fingerprint"],
    color: "#f59e0b",
  },
  {
    num: "8",
    label: "Store raw HTML in S3",
    description:
      "Blob Storage: If the content is genuinely new, the raw HTML payload is written to Static Content Storage (S3) keyed by URL. The downstream indexing pipeline will pull it from here later. Storing HTML separately from metadata keeps the main databases lean.",
    payload: `PUT s3://crawl-bucket/html/github.com/pricing\nContent-Type: text/html\nContent-Length: 52KB`,
    edges: ["worker→s3"],
    nodes: ["worker", "s3"],
    color: "#22c55e",
  },
  {
    num: "9",
    label: "Publish 'Links Found' event",
    description:
      "Link Normalization & Publish: The worker normalizes the extracted links (forces HTTPS, strips UTM tracking params, resolves relative paths) and publishes them as a 'Links Found' event to the Message Queue.",
    payload: `{\n  "source": "github.com/pricing",\n  "links": [\n    "https://github.com/features",\n    "https://github.com/enterprise",\n    ... (32 more)\n  ]\n}`,
    edges: ["worker→mq-links"],
    nodes: ["worker", "mq-links"],
    color: "#ec4899",
  },
  {
    num: "10",
    label: "Mark source URL as crawled",
    description:
      "Mark as Crawled: The Provider consumes the 'Links Found' event from the queue and records the source URL in the Crawled DB with a last_crawl_time timestamp. This is the authoritative record of what has been successfully crawled.",
    payload: `UPSERT crawled\n  SET url="github.com/pricing",\n      last_crawl_time=NOW()`,
    edges: ["mq-links→provider", "provider→crawled"],
    nodes: ["mq-links", "provider", "crawled"],
    color: "#ef4444",
  },
  {
    num: "11",
    label: "Publish 'URL Crawled' → indexing pipeline",
    description:
      "Trigger Indexing: The Provider publishes a 'URL Crawled' event to a second Message Queue, notifying the downstream Process+Index pipeline that fresh HTML is available in S3 at a known key.",
    payload: `{\n  "event": "url_crawled",\n  "url": "github.com/pricing",\n  "s3_key": "html/github.com/pricing"\n}`,
    edges: ["provider→mq-crawled"],
    nodes: ["provider", "mq-crawled"],
    color: "#ec4899",
  },
  {
    num: "12a",
    label: "Filter new URLs through Bloom Filter",
    description:
      "Seen Filtering (Part 1): The Provider passes the newly discovered links through the Seen Cache (Bloom Filter). A Bloom Filter has zero false negatives — if it reports 'not seen', the URL is definitely new. This pre-screens millions of URLs per second without hitting the DB.",
    payload: `bloom.contains("github.com/features")  → false ← new!\nbloom.contains("github.com")            → true  ← skip`,
    edges: ["provider→seen-cache"],
    nodes: ["provider", "seen-cache"],
    color: "#8b5cf6",
  },
  {
    num: "12b",
    label: "Persist new URLs to Seen DB",
    description:
      "Seen Filtering (Part 2): URLs that pass the Bloom Filter are permanently recorded in the Seen DB (the source of truth). The Bloom Filter is also updated. The Bloom Filter is the fast pre-screen; the DB is the authoritative record that never loses data.",
    payload: `INSERT seen SET url="github.com/features"\nbloom.add("github.com/features")`,
    edges: ["seen-cache→seen-db"],
    nodes: ["seen-cache", "seen-db"],
    color: "#8b5cf6",
  },
  {
    num: "13",
    label: "Enqueue new URLs back into Frontier",
    description:
      "Queue Expansion: The brand-new, unseen URLs are assigned a priority score (based on PageRank signal, freshness, domain authority) and inserted into the Frontier. This keeps the crawler continuously fed with fresh targets — the pipeline loops.",
    payload: `INSERT frontier\n  SET url="github.com/features",\n      domain="github.com",\n      priority=0.87`,
    edges: ["provider→frontier"],
    nodes: ["provider", "frontier"],
    color: "#3b82f6",
  },
  {
    num: "14",
    label: "Consume event & pull HTML from S3",
    description:
      "Content Retrieval (async): Independently of the crawl pipeline, Process+Index workers consume the 'URL Crawled' events and pull the corresponding raw HTML directly from S3. This indexing pipeline runs at its own pace.",
    payload: `GET s3://crawl-bucket/html/github.com/pricing\n← 200 OK, 52KB HTML`,
    edges: ["mq-crawled→index", "index→s3"],
    nodes: ["mq-crawled", "index-worker", "s3"],
    color: "#10b981",
  },
  {
    num: "15",
    label: "Parse & upsert into search index",
    description:
      "Search Index Upsert: Workers parse the HTML and upsert the document into ElasticSearch using the URL as the document ID. Because it uses the URL as the doc ID, recrawls automatically overwrite stale data — no separate delete step needed.",
    payload: `PUT /pages/_doc/github.com%2Fpricing\n{\n  "title": "GitHub Pricing",\n  "body_text": "...",\n  "indexed_at": "2026-03-06T12:00:00Z"\n}`,
    edges: ["index→search"],
    nodes: ["index-worker", "search-db"],
    color: "#10b981",
  },
  {
    num: "16",
    label: "Recrawl sweep (keep index fresh)",
    description:
      "Recrawl Sweeping: A background job periodically sweeps the Crawled DB for URLs whose last_crawl_time is stale and requeues them with the Provider. This ensures the search index reflects the current live state of the web.",
    payload: `SELECT url FROM crawled\n  WHERE last_crawl_time < NOW() - INTERVAL 7 DAY\n  ORDER BY last_crawl_time ASC\n  LIMIT 1000`,
    edges: ["crawled→provider"],
    nodes: ["crawled", "provider"],
    color: "#ef4444",
  },
];
