export class CreateProductDto {
  name: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  quantity: number;
  originalPrice: number;
  salePercent: number;
  status: boolean;
  categoryId: number;
}
