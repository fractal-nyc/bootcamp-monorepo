# The Crawl Pipeline

1. **Initialization**: Seed URLs are injected into the NoSQL Frontier to kickstart the system.

2. **Task Selection**: The URL Provider Service iterates through domains assigned to it (via sharding) and pulls the highest-priority URL for a currently "available" domain from the Frontier.

3. **Politeness Lock**: The Provider immediately writes the domain to the Cooldown Cache (Redis) with a Time-to-Live (TTL), temporarily locking it to prevent DDoS-ing the target server.

4. **Dispatch**: The Provider asynchronously hands off the URL to a Fetch + Extract worker via a Promise.

5. **Pre-flight Checks**: The worker checks the local DNS & robots.txt Cache (Redis) to resolve the IP and ensure the specific path is legally allowed to be crawled.

6. **Fetch & Process**: The worker downloads the page, strips out boilerplate HTML (ads, nav bars), extracts all outgoing links, and generates a MinHash of the core text.

7. **Deduplication**: The worker checks the Content Fingerprint Store. If the MinHash has a Hamming distance below your threshold compared to an existing hash, it's a near-duplicate. Processing aborts here to save space.

8. **Blob Storage**: If the content is genuinely new/different, the HTML payload is stored directly in Static Content Storage (e.g., S3).

9. **Link Normalization**: The worker normalizes the extracted links (converting to HTTPS, stripping ?utm tracking parameters) and pushes them to a Message Queue as a "Links found" event.

10. **Mark as Crawled**: The Provider consumes the "Links found" event and logs the source URL into the Crawled DB with a last_crawl_time timestamp.

11. **Trigger Indexing**: The Provider pushes a "URL Crawled" event into a second Message Queue, alerting downstream systems that new content is ready.

12. **Seen Filtering**: The Provider passes the newly discovered links through the Seen Cache (Bloom Filter) (12a). If the filter hasn't seen them, they are permanently recorded in the Seen DB (12b).

13. **Queue Expansion**: These brand-new, unseen URLs are assigned a priority score and inserted into the Frontier, keeping the crawler fed.

14. **Content Retrieval**: Asynchronously, Process + Index workers consume the "URL Crawled" events and pull the raw HTML payloads directly from S3.

15. **Search Index Upsert**: The workers parse the HTML and insert it into the Text Search DB (e.g., ElasticSearch). Because it uses the URL as the document ID, this automatically "upserts" (overwrites) any outdated data.

16. **Recrawl Sweeping**: A background process periodically sweeps the Crawled DB for URLs with old timestamps and pushes them back into the Provider to be recrawled, ensuring the search index stays fresh.
