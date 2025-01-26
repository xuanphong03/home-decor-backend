export class ReviewProductDto {
  productId: number;
  rating: number;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}
