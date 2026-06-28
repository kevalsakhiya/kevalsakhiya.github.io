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

// Headline numbers for the stats band. `count`/`format`/`suffix` drive the
// count-up animation; `format` ∈ plain | k | m | comma | dec1.
export const stats = [
  { count: 7, format: 'plain', suffix: '+', label: 'Years in production' },
  { count: 500000, format: 'k', suffix: '+', label: 'Records / day at peak', accent: true },
  { count: 40, format: 'plain', suffix: '+', label: 'Scrapers in prod' },
  { count: 1000000, format: 'm', suffix: '+', label: 'Posts / day pipelines' },
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

// `figures` render as a 2-up metric grid on each card. Each is either a
// count-up number ({ count, format, suffix }) or a static label ({ text }).
export const projects = [
  {
    title: 'County Property & Mortgage Data Pipeline',
    blurb:
      'Harvested public mortgage and property records scattered across 40+ US government county portals into one cleaned, monitored ETL pipeline — with instant alerts the moment a run fails.',
    tag: 'Real Estate',
    figures: [
      { count: 500000, format: 'k', suffix: '+', label: 'records / day' },
      { count: 40, format: 'plain', suffix: '+', label: 'scrapers' },
    ],
    stack: ['Scrapy', 'Redis', 'Airflow', 'PostgreSQL', 'Spidermon'],
  },
  {
    title: 'Self-Healing Broker-Intelligence Pipeline',
    blurb:
      'Weekly Scrapy system scraping two registries that validates, dedupes, and repairs bad rows mid-run — delivering broker profiles with zero manual cleanup between runs.',
    tag: 'Market Intelligence',
    figures: [
      { count: 15500, format: 'comma', suffix: '+', label: 'brokers / week' },
      { count: 95.6, format: 'dec1', suffix: '%', label: 'coverage' },
    ],
    stack: ['Scrapy', 'Spidermon', 'MongoDB', 'Validation pipelines'],
  },
  {
    title: 'Reddit Sentiment Pipeline for ML Signals',
    blurb:
      'Apache Airflow ETL pulling Reddit posts across thousands of subreddits, scored with NLP and embedding models — delivered ready for downstream prediction models.',
    tag: 'Finance',
    figures: [
      { count: 1000000, format: 'm', suffix: '+', label: 'posts / day' },
      { count: 2000, format: 'comma', suffix: '+', label: 'subreddits' },
    ],
    stack: ['Airflow', 'Python', 'NLP / embeddings', 'PySpark'],
  },
  {
    title: 'ML-Ready Sports Data Feature Store',
    blurb:
      'Scrapers across many sports sites feeding a pipeline that cleans, normalises, and vectorises match and player data into a model-ready feature store — auto-refreshed as new matches complete.',
    tag: 'Sports',
    figures: [
      { count: 3000000, format: 'm', suffix: '+', label: 'data points' },
      { text: 'live', label: 'auto-refresh' },
    ],
    stack: ['Scrapy', 'PySpark', 'Feature engineering', 'AWS'],
  },
];

export const skills = [
  {
    group: 'Web Scraping & Crawling',
    icon: 'bug',
    items: ['Scrapy', 'scrapy-playwright', 'Spidermon', 'BeautifulSoup', 'lxml / parsel', 'Selenium', 'Playwright', 'Requests'],
  },
  {
    group: 'Distributed & Async',
    icon: 'nodes',
    items: ['Redis-backed crawling', 'asyncio', 'Multithreading', 'AutoThrottle tuning', 'Long-running job scaling'],
  },
  {
    group: 'Anti-Bot & Stealth',
    icon: 'shield',
    items: ['Rotating proxies', 'CAPTCHA solving', 'TLS/JA3 handling', 'Browser fingerprinting', 'Session / cookie mgmt', 'UA/header rotation'],
  },
  {
    group: 'Data & Processing',
    icon: 'funnel',
    items: ['ETL design', 'Data-quality validation', 'Pandas', 'NumPy', 'PySpark', 'Distributed computing', 'JSON / XML / CSV'],
  },
  {
    group: 'Databases',
    icon: 'database',
    items: ['MongoDB', 'Redis', 'PostgreSQL', 'MySQL'],
  },
  {
    group: 'Orchestration & Deploy',
    icon: 'workflow',
    items: ['Apache Airflow', 'Docker', 'Kubernetes', 'Scrapyd', 'Scrapy Cloud', 'Gerapy', 'Git', 'cron'],
  },
  {
    group: 'Cloud & APIs',
    icon: 'cloud',
    items: ['AWS (EC2, S3, Glue, Lambda)', 'Azure Synapse', 'FastAPI', 'Django REST', 'GraphQL', 'WebSockets', 'Linux/Unix'],
  },
  {
    group: 'ML & MLOps',
    icon: 'chip',
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
