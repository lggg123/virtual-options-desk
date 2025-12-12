'use client';

import { useEffect } from 'react';

interface BlogViewTrackerProps {
  slug: string;
}

export default function BlogViewTracker({ slug }: BlogViewTrackerProps) {
  useEffect(() => {
    // Track view when component mounts
    const trackView = async () => {
      try {
        await fetch('/api/blog/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug }),
        });
      } catch (error) {
        // Silently fail - view tracking is not critical
        console.error('Failed to track view:', error);
      }
    };

    trackView();
  }, [slug]);

  // This component doesn't render anything
  return null;
}
