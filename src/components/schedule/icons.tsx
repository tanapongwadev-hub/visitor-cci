import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function VisitorsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.4-3.7 2.2-5.5 5.5-5.5s5.1 1.8 5.5 5.5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M14.7 14.3c.7-.4 1.5-.6 2.4-.6 2.6 0 4.1 1.5 4.4 4.4" />
    </Svg>
  );
}

export function HandshakeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8.2 12.2 5.6 9.6a2 2 0 0 0-2.8 2.8l4.8 4.8c1.1 1.1 2.8 1.1 3.9.1l1.1-1" />
      <path d="m15.8 12.2 2.6-2.6a2 2 0 1 1 2.8 2.8l-4.8 4.8c-1.1 1.1-2.8 1.1-3.9.1l-2.2-2" />
      <path d="m8.5 12.5 2-2c.8-.8 2.1-.8 2.9 0l2.1 2.1" />
      <path d="m9.4 17.8 1.2 1.2M12 17.3l1.4 1.4M14.7 16.3l1.2 1.2" />
    </Svg>
  );
}

export function DoorIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 21h16M6 21V4.5a1.5 1.5 0 0 1 1.2-1.47l9-1.8A1.5 1.5 0 0 1 18 2.7V21" />
      <path d="M9 5.5h6v15.5H9z" />
      <circle cx="13.6" cy="13" r=".55" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function HostIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3.5 19c.5-4 2.3-6 5.5-6s5 2 5.5 6" />
      <path d="m16 14 2 2 4-4" />
    </Svg>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M3 20c.4-4 2.4-6 6-6s5.6 2 6 6M14.8 14.4c.7-.4 1.5-.6 2.4-.6 2.7 0 4.2 1.7 4.5 5" />
    </Svg>
  );
}

export function PartnershipIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 9.5 7 6l4 2 2-1 4 2.5 4 1.5-4.7 6.1a2 2 0 0 1-2.8.3L9 13" />
      <path d="m3 9.5 3 5.5 3-2M21 11l-2.5 5-2.2-1.4M10.4 8.3 8.6 10a1.6 1.6 0 0 0 2.2 2.3l2.2-1.8" />
    </Svg>
  );
}

export function GrowthIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20V10M10 20V14M16 20V7M22 20V4" />
      <path d="m4 8 5-3 5 2 7-5" />
      <path d="M18 2h3v3" />
    </Svg>
  );
}
