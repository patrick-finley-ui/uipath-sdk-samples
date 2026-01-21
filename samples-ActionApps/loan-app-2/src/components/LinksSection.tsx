import './LinksSection.css';

interface Link {
  title: string;
  url: string;
  description: string;
}

const LinksSection = () => {
  const links: Link[] = [
    {
      title: 'React Documentation',
      url: 'https://react.dev',
      description: 'Learn React from the official docs'
    },
    {
      title: 'Vite Documentation',
      url: 'https://vite.dev',
      description: 'Fast build tool and dev server'
    },
    {
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      description: 'Web development resources'
    },
    {
      title: 'GitHub',
      url: 'https://github.com',
      description: 'Code hosting platform'
    }
  ];

  return (
    <div className="links-section">
      <h2>Useful Links</h2>
      <div className="links-grid">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-card"
          >
            <div className="link-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
            <div className="link-content">
              <h3>{link.title}</h3>
              <p>{link.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default LinksSection;
