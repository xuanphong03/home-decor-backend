export class OrderConfirmationBody {
  name: string;
  email: string;
  totalPrice: number;
  products: {
    name: string;
    quantity: number;
    price: number;
  }[];
}
