import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { redis } from 'src/utils/redis';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrdersByUser(
    userId: number,
    { page, limit, sort, order, filter = {} },
  ) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.order.count({
      where: filter,
    });
    const ordersByUser = await this.prisma.order.findMany({
      where: { userId, ...filter },
      skip: skip,
      take: limit,
      orderBy: {
        [sort]: order,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
        paymentMethod: true,
      },
    });
    return {
      total: total,
      orders: ordersByUser,
    };
  }

  async getOrderDetailById(userId: number, orderId: number) {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
        paymentMethod: true,
      },
    });
  }

  async createOrder(userId: number, body: any) {
    const { addressId, products, ...createData } = body;
    const totalPrice = await this.getTotalProductsPrice(products);
    const shippingAddress = await this.getShippingAddress(userId, addressId);
    const productsFromBody = await Promise.all(
      products.map(async (productItem: ProductDto) => {
        const product = await this.prisma.product.findFirst({
          where: { id: productItem.id },
        });
        return {
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          price: product.finalPrice,
          quantity: productItem.quantity,
          product: {
            connect: {
              id: +product.id,
            },
          },
        };
      }),
    );
    return this.prisma.order.create({
      data: {
        ...createData,
        userId: userId,
        totalPrice: totalPrice,
        address: shippingAddress,
        products: {
          create: productsFromBody,
        },
      },
    });
  }

  async updateProductsQuantity(products: ProductDto[]) {
    for (const product of products) {
      const dbProduct = await this.prisma.product.findFirst({
        where: { id: product.id },
      });
      const quantity = dbProduct.quantity - product.quantity;
      await this.prisma.product.update({
        where: {
          id: product.id,
        },
        data: { quantity },
      });
    }
  }

  async removeCartItems(userId: number) {
    return this.prisma.cart.update({
      where: { userId },
      data: {
        products: {
          deleteMany: {},
        },
      },
    });
  }

  async generateOrderKey() {
    const key = Math.random().toString(36).substring(2, 14);
    const redisStore = await redis;
    await redisStore.set(`order_${key}`, 1, {
      EX: 600,
    });
    return `order_${key}`;
  }

  async getShippingAddress(userId: number, addressId: number) {
    const dbAddress = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId: userId,
      },
    });
    if (!dbAddress) {
      throw new BadRequestException('Địa chỉ giao hàng không tồn tại');
    }
    return `${dbAddress.streetName}, ${dbAddress.districtName}, ${dbAddress.provinceName}`;
  }

  async getTotalProductsPrice(productList: any) {
    const totalPrice = await productList.reduce(
      async (total: number, { id, quantity }: any) => {
        const dbProduct = await this.prisma.product.findFirst({
          where: { id },
        });
        return total + quantity * dbProduct.finalPrice;
      },
      0,
    );
    return totalPrice;
  }

  async validateProductsQuantity(productList: any) {
    for (const productItem of productList) {
      const dbProduct = await this.prisma.product.findFirst({
        where: { id: productItem.id },
      });
      if (!dbProduct) {
        throw new BadRequestException(
          `Sản phẩm có id là ${productItem.id} không tồn tại`,
        );
      }
      if (productItem.quantity <= 0) {
        throw new ConflictException(
          `Số lượng sản phẩm ${dbProduct.name} không hợp lệ`,
        );
      }
      if (dbProduct.quantity < productItem.quantity) {
        throw new ConflictException(
          `Số lượng sản phẩm ${dbProduct.name} đã vượt quá số lượng sản phẩm trong kho hàng (Tối đa ${dbProduct.quantity} sản phẩm)`,
        );
      }
      if (!dbProduct.status) {
        throw new ConflictException(
          `Sản phẩm ${dbProduct.name} đã không còn kinh doanh.`,
        );
      }
    }
  }

  async removeOrder(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId } });
    if (!order) {
      throw new BadRequestException('Đơn hàng không tồn tại');
    }
    await this.prisma.productsOnOrders.deleteMany({ where: { orderId } });
    return this.prisma.order.delete({
      where: {
        id: orderId,
        userId: userId,
      },
    });
  }
}
