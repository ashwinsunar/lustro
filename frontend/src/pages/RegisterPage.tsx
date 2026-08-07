import { Container } from '../components/layout';

export default function RegisterPage() {
  return (
    <div className="pt-32 pb-32 min-h-screen flex items-center justify-center">
      <Container className="max-w-md w-full">
        <h1 className="text-4xl font-light mb-8 text-center">Register</h1>
        <p className="text-white/60 text-center">Registration form will go here.</p>
      </Container>
    </div>
  );
}
