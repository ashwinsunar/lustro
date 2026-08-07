import { useParams } from 'react-router-dom';
import { Container } from '../components/layout';

export default function ProductPage() {
  const { slug } = useParams();

  return (
    <div className="pt-32 pb-32 min-h-screen">
      <Container>
        <h1 className="text-4xl font-light mb-4">Product Details: {slug}</h1>
        <p className="text-white/60">This page will be built in the next iteration.</p>
      </Container>
    </div>
  );
}
