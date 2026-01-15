'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export function SecretAdminButton() {
  const router = useRouter();
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSecretClick = () => {
    clickCountRef.current += 1;

    // Clear previous timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // Reset click count after 2 seconds of inactivity
    clickTimeoutRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);

    // Triple-click redirects to login
    if (clickCountRef.current === 3) {
      router.push('/admin/login');
      clickCountRef.current = 0;
    }
  };

  return (
    <button
      onClick={handleSecretClick}
      className="fixed bottom-6 left-6 p-3 text-amber-600 hover:text-amber-700 transition-colors opacity-70 hover:opacity-100 z-40"
      title="Triple-click for admin access"
      aria-label="Secret admin button"
    >
      <Lock className="h-6 w-6" />
    </button>
  );
}
