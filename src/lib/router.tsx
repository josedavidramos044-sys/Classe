import { useState, useEffect, type ReactNode } from 'react';

interface RouterState {
  route: string;
  params: Record<string, string>;
}

let currentState: RouterState = { route: window.location.hash.slice(1) || '/', params: {} };

function parseRoute(hash: string): RouterState {
  const path = hash || '/';
  const params: Record<string, string> = {};
  const [route, query] = path.split('?');
  if (query) {
    query.split('&').forEach(p => {
      const [k, v] = p.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }
  return { route, params };
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function useRouter() {
  const [state, setState] = useState<RouterState>(currentState);

  useEffect(() => {
    const handler = () => {
      currentState = parseRoute(window.location.hash.slice(1));
      setState(currentState);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return state;
}

export function useRouteMatch(pattern: string): { matches: boolean; params: Record<string, string> } {
  const { route } = useRouter();
  const patternParts = pattern.split('/');
  const routeParts = route.split('/');
  if (patternParts.length !== routeParts.length) return { matches: false, params: {} };
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = routeParts[i];
    } else if (patternParts[i] !== routeParts[i]) {
      return { matches: false, params: {} };
    }
  }
  return { matches: true, params };
}

export function Link({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={`#${to}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
