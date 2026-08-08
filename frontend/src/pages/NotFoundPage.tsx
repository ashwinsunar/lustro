import { Link } from 'react-router-dom';
import { Container } from '../components/layout';
import { Button } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="pt-32 pb-32 bg-zinc-950 min-h-screen flex items-center justify-center">
      <Container className="text-center max-w-lg">
        <p className="text-gold font-space tracking-[0.3em] text-xl mb-6">404</p>
        <h1 className="font-display text-5xl font-medium mb-6">Time Lost</h1>
        <p className="text-white/50 mb-10 font-light">
          The page you're looking for has slipped through our fingers. Let's get you back to the collection.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/">
            <Button>Back Home</Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline">Browse the Shop</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}