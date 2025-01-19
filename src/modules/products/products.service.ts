import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductList({ page, limit, sort, order, filter = {} }) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.product.count();
    const products = await this.prisma.product.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        [sort]: order,
      },
      where: filter,
      include: { category: true },
    });
    return {
      total,
      products,
    };
  }

  createProduct(data: any) {
    data.finalPrice = data.originalPrice * ((100 - data.salePercent) / 100);
    return this.prisma.product.create({ data });
  }

  findProductByField(field: string, value: any) {
    return this.prisma.product.findFirst({
      where: {
        [field]: value,
      },
      include: {
        category: true,
      },
    });
  }

  async getRelatedProductList({ page, limit, sort, order, filter = {} }) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.product.count({
      where: filter,
    });
    const products = await this.prisma.product.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        [sort]: order,
      },
      where: filter,
      include: { category: true },
    });
    return {
      total,
      products,
    };
  }

  async updateProduct(id: number, data: any) {
    const existProduct = await this.findProductByField('name', data.name);
    if (existProduct && existProduct.id !== id) {
      return null;
    }
    data.updatedAt = new Date();
    data.finalPrice = data.originalPrice * ((100 - data.salePercent) / 100);
    return this.prisma.product.update({ where: { id }, data });
  }
}
