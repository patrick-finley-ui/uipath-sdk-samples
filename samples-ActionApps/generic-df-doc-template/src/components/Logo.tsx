import './Logo.css';

const Logo = () => {
  return (
    <div className="logo-container">
      <svg
        className="logo-svg"
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="60"
          cy="60"
          r="55"
          stroke="var(--logo-color)"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M 40 60 L 55 75 L 80 45"
          stroke="var(--logo-color)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect
          x="30"
          y="25"
          width="60"
          height="50"
          rx="5"
          stroke="var(--logo-color)"
          strokeWidth="3"
          fill="none"
        />
        <line
          x1="30"
          y1="40"
          x2="90"
          y2="40"
          stroke="var(--logo-color)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

export default Logo;
