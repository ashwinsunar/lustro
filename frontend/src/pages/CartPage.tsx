import { Container } from '../components/layout';
import { useCartStore } from '../store/cartStore';

export default function CartPage() {
  const { items, totalAmount } = useCartStore();

  return (
    <div className="pt-32 pb-32 min-h-screen">
      <Container>
        <h1 className="text-4xl font-light mb-8">Shopping Cart</h1>
        {items.length === 0 ? (
          <p className="text-white/60">Your cart is empty.</p>
        ) : (
          <div>
            <p>You have {items.length} items in your cart.</p>
            <p className="text-2xl mt-4 text-gold">Total: ${totalAmount()}</p>
          </div>
        )}
      </Container>
    </div>
  );
}
