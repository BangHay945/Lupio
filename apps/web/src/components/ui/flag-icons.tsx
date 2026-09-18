import React from "react";

export function IndonesiaFlag({ className = "h-5 w-5", title = "Bahasa Indonesia" }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={title}>
      <defs>
        <clipPath id="circle-id-flag">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath="url(#circle-id-flag)">
        <rect width="32" height="16" fill="#E11D48" />
        <rect y="16" width="32" height="16" fill="#FFFFFF" />
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
    </svg>
  );
}

export function UKFlag({ className = "h-5 w-5", title = "English" }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={title}>
      <defs>
        <clipPath id="circle-uk-flag">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath="url(#circle-uk-flag)">
        {/* Blue background */}
        <rect width="32" height="32" fill="#012169" />
        {/* White diagonals */}
        <path d="M0 0 L32 32 M32 0 L0 32" stroke="#FFFFFF" strokeWidth="6" />
        {/* Red diagonals */}
        <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="2.5" />
        {/* White cross */}
        <path d="M16 0 V32 M0 16 H32" stroke="#FFFFFF" strokeWidth="8" />
        {/* Red cross */}
        <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="4.5" />
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
    </svg>
  );
}

export function FlagIcon({ lang, className = "h-5 w-5" }: { lang: "id" | "en"; className?: string }) {
  if (lang === "en") {
    return <UKFlag className={className} />;
  }
  return <IndonesiaFlag className={className} />;
}
