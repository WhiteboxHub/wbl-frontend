'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DeviceCheckRedirect() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
        window.top.location.href = '/login';
      } else {
        router.replace('/login');
      }
      return;
    }

    router.replace('/user_dashboard/ai-prep/assessment-type');
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col items-center justify-center p-8">
      <Loader2 className="h-8 w-8 text-[#4A6CF7] animate-spin mb-3" />
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verifying authentication...</p>
    </div>
  );
}
