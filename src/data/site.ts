// ─────────────────────────────────────────────────────────────────────────
// Single source of truth for all site content.
// Edit values here and they flow through every page/section.
// ─────────────────────────────────────────────────────────────────────────

export const site = {
  name: 'Keval Sakhiya',
  title: 'Web Scraping Specialist',
  subtitle: 'Distributed Crawling at Scale',
  tagline:
    'I build and operate large-scale distributed crawlers and data-extraction systems — turning the messy public web into clean, monitored, model-ready data.',
  location: 'Anand, Gujarat, India',
  email: 'kevalsakhiya@gmail.com',
  phone: '+91 96875 91750',
  resume: '/keval-sakhiya-resume.pdf',
  photo: '/keval.png',
  // Update if you move to a custom domain.
  url: 'https://kevalsakhiya.github.io',
};

export const socials = [
  { label: 'GitHub', href: 'https://github.com/kevalsakhiya', icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kevalsakhiya', icon: 'linkedin' },
  { label: 'Medium', href: 'https://medium.com/@kevalsakhiya', icon: 'medium' },
  { label: 'Upwork', href: 'https://www.upwork.com/freelancers/~0176630a8fa2c90848', icon: 'upwork' },
  { label: 'Email', href: 'mailto:kevalsakhiya@gmail.com', icon: 'mail' },
];

// Headline numbers for the stats band.
export const stats = [
  { value: '7+', label: 'Years building crawlers' },
  { value: '500k+', label: 'Records / day at peak' },
  { value: '40+', label: 'Scrapers in production' },
  { value: '1M+', label: 'Posts / day pipelines' },
];

export const about = [
  `Python developer and web-scraping specialist with 7+ years building and operating
   large-scale distributed crawlers and data-extraction systems for US companies.`,
  `Deep Scrapy expertise — spiders, item pipelines, middlewares, and Redis-backed distributed
   crawling deployed via Scrapyd / Scrapy Cloud / Gerapy — with async and multithreaded
   architectures tuned for high-throughput, long-running jobs.`,
  `Proven anti-bot depth (rotating residential/datacenter proxies, TLS/JA3 & browser
   fingerprinting, CAPTCHA solving, stealth headless automation with Playwright and Selenium)
   and rigorous data-quality validation, dedup, and normalisation into MongoDB / PostgreSQL.`,
  `I own the full path from web-scale crawl → ETL → delivery: large-scale processing with
   PySpark, orchestration with Apache Airflow, and production monitoring/alerting with
   Spidermon. Open-source contributor to Scrapy.`,
];

export const competencies = [
  'Distributed Crawling at Scale',
  'Async & Multithreaded Python',
  'Anti-Bot & Stealth',
  'Data Quality & Validation',
  'Pipeline Monitoring & Alerting',
  'NoSQL (MongoDB) & Redis',
  'Cloud at Scale (AWS)',
  'ETL & PySpark',
];

export const experience = [
  {
    company: 'Turing',
    role: 'Web Scraping Specialist & Data Engineer',
    meta: 'Remote (USA) · Full-time contract',
    period: 'Jul 2023 — Feb 2026',
    points: [
      'Built and operated large-scale distributed web crawlers — production Scrapy with Redis-backed request queues and shared state, tuning concurrency, AutoThrottle, and memory profiles for reliable long-running jobs.',
      'Engineered anti-bot strategies at scale — rotating residential/datacenter proxies, TLS/JA3 and browser-fingerprint handling, UA/header rotation, and CAPTCHA solving (2Captcha, Anti-Captcha).',
      'Built Scrapy item pipelines for data-quality validation, deduplication, and normalisation, with monitoring and alerting via Spidermon — crawl-health checks and alerts on validation failures and coverage drops.',
      'Processed large-scale datasets with PySpark and distributed computing for big-data transformations, alongside Pandas / AWS Glue ETL flows.',
      'Orchestrated multi-stage pipelines with Apache Airflow (retry, logging, error handling) and exposed cleaned datasets through FastAPI / Django REST services.',
    ],
  },
  {
    company: 'Heirlift Estate',
    role: 'Web Scraping Specialist',
    meta: 'Remote (USA) · Full-time contract',
    period: 'Mar 2021 — May 2023',
    points: [
      'Designed and maintained Scrapy spiders to extract real-estate listings at scale — property attributes, agent details, price history, and images.',
      'Handled paginated, JavaScript-rendered, and AJAX/session-protected pages using scrapy-playwright and Selenium with stealth configs; managed login flows and cookie persistence.',
      'Engineered anti-bot bypass with rotating residential proxies, randomized request fingerprints, and CAPTCHA-solving middleware to sustain reliable extraction.',
      'Built Scrapy item pipelines for validation, deduplication, and normalisation into PostgreSQL and MongoDB, and loaded cleaned data through an AWS Glue + S3 ETL flow feeding downstream analytics.',
    ],
  },
  {
    company: 'Upwork',
    role: 'Freelance Python Developer — Web Scraping',
    meta: 'Remote · Top-Rated',
    period: '2019 — 2021',
    points: [
      'Built production Scrapy spiders for international clients across e-commerce, B2B directories, and aggregator sites, with structured item pipelines and rotating proxy pools.',
      'Achieved Top-Rated status through consistent delivery and client satisfaction across long-running engagements.',
      'Exposed crawled datasets via FastAPI services and collaborated directly with clients in English to scope requirements and define data schemas.',
    ],
  },
];

export const projects = [
  {
    title: 'County Property & Mortgage Data Pipeline',
    blurb:
      'Harvested public mortgage and property records scattered across 40+ US government county portals into one cleaned, monitored ETL pipeline — with instant alerts the moment a run fails.',
    tag: 'Distributed crawl',
    metrics: ['500k+ records/day', '40+ scrapers', 'Monitored ETL'],
    stack: ['Scrapy', 'Redis', 'Airflow', 'PostgreSQL', 'Spidermon'],
  },
  {
    title: 'Self-Healing Broker-Intelligence Pipeline',
    blurb:
      'Weekly Scrapy system scraping two registries that validates, dedupes, and repairs bad rows mid-run — delivering thousands of broker profiles with zero manual cleanup between runs.',
    tag: 'Data quality',
    metrics: ['15,500+ brokers/week', '95.6% coverage', 'Self-healing'],
    stack: ['Scrapy', 'Spidermon', 'MongoDB', 'Validation pipelines'],
  },
  {
    title: 'Reddit Sentiment Pipeline for ML Signals',
    blurb:
      'Apache Airflow ETL pulling 1M+ Reddit posts/day across 2,000+ subreddits, scored with NLP and embedding models and delivered ready for downstream prediction models.',
    tag: 'NLP',
    metrics: ['1M+ posts/day', '2,000+ subreddits', 'ML-ready'],
    stack: ['Airflow', 'Python', 'NLP / embeddings', 'PySpark'],
  },
  {
    title: 'ML-Ready Sports Data Feature Store',
    blurb:
      'Scrapers across many sports sites feeding a pipeline that cleans, normalises, and vectorises match and player data into a model-ready feature store, auto-refreshed as new matches complete.',
    tag: 'AI training data',
    metrics: ['3M+ data points', 'Auto-refreshed', 'Feature store'],
    stack: ['Scrapy', 'PySpark', 'Feature engineering', 'AWS'],
  },
];

export const skills = [
  {
    group: 'Web Scraping & Crawling',
    items: ['Scrapy', 'scrapy-playwright', 'Spidermon', 'BeautifulSoup', 'lxml / parsel', 'Selenium', 'Playwright', 'Requests'],
  },
  {
    group: 'Distributed & Async',
    items: ['Redis-backed crawling', 'asyncio', 'Multithreading', 'AutoThrottle tuning', 'Long-running job scaling'],
  },
  {
    group: 'Anti-Bot & Stealth',
    items: ['Rotating proxies', 'CAPTCHA solving', 'TLS/JA3 handling', 'Browser fingerprinting', 'Session / cookie mgmt', 'UA/header rotation'],
  },
  {
    group: 'Data & Processing',
    items: ['ETL design', 'Data-quality validation', 'Pandas', 'NumPy', 'PySpark', 'Distributed computing', 'JSON / XML / CSV'],
  },
  {
    group: 'Databases',
    items: ['MongoDB', 'Redis', 'PostgreSQL', 'MySQL'],
  },
  {
    group: 'Orchestration & Deploy',
    items: ['Apache Airflow', 'Docker', 'Kubernetes', 'Scrapyd', 'Scrapy Cloud', 'Gerapy', 'Git', 'cron'],
  },
  {
    group: 'Cloud & APIs',
    items: ['AWS (EC2, S3, Glue, Lambda)', 'Azure Synapse', 'FastAPI', 'Django REST', 'GraphQL', 'WebSockets', 'Linux/Unix'],
  },
  {
    group: 'ML & MLOps',
    items: ['Scikit-learn', 'TensorFlow', 'MLflow', 'Model deployment via FastAPI'],
  },
];

export const languages = ['Python (7+ yrs)', 'SQL', 'JavaScript', 'Bash'];

export const openSource = [
  {
    title: 'Scrapy',
    desc: 'Documentation contribution reviewed & merged into the official scrapy/scrapy repository.',
    href: 'https://github.com/scrapy/scrapy',
  },
  {
    title: 'Public projects & utilities',
    desc: 'Open-source scraping projects and tooling on GitHub.',
    href: 'https://github.com/kevalsakhiya',
  },
];

export const education = {
  degree: 'Bachelor of Science (B.Sc.), Chemistry',
  place: 'Gujarat, India',
};
