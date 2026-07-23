import EnhancerClient from '@/components/EnhancerClient';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function HomePage() {
  return (
    <ErrorBoundary>
      <EnhancerClient />
    </ErrorBoundary>
  );
}
