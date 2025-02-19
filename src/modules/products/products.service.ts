import { ConflictException, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/db/prisma.service';
import { ReviewProductDto } from './dto/review-product.dto';
import { ShippingStatus } from 'src/app.interface';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 0 0 * * *')
  async handleCron() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    await this.prisma.product.updateMany({
      where: {
        createdAt: {
          lt: oneMonthAgo,
        },
        new: true,
      },
      data: {
        new: false,
        updatedAt: new Date(),
      },
    });
  }

  async getProductList({ page, limit, sort, order, filter = {} }) {
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

  createProduct(data: any) {
    data.finalPrice = data.originalPrice * ((100 - data.salePercent) / 100);
    data.new = true;
    return this.prisma.product.create({ data });
  }

  findProductByField(field: string, value: any) {
    return this.prisma.product.findFirst({
      where: {
        [field]: value,
      },
      include: {
        category: true,
        reviews: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
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

  async reviewProduct(userId: number, body: ReviewProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: body.productId },
    });
    if (!product) {
      throw new ConflictException('Sản phẩm không tồn tại. Vui lòng thử lại');
    }
    return this.prisma.review.create({
      data: {
        productId: body.productId,
        userId: userId,
        content: body.content,
        rating: body.rating,
      },
      include: {
        user: true,
      },
    });
  }

  async deleteProduct(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }

  async findProductInOrdersByUser(userId: number, productId: number) {
    const product = await this.prisma.order.findFirst({
      where: {
        userId: userId,
        shippingStatus: ShippingStatus.RECEIVED,
        products: {
          some: {
            productId: productId,
          },
        },
      },
    });
    return product !== null;
  }
}
