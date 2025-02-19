import { Injectable } from '@nestjs/common';
import { ShippingStatus } from 'src/app.interface';
import { PrismaService } from 'src/db/prisma.service';
import { redis } from 'src/utils/redis';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: number, body: any) {
    const { addressId, products, ...dataCreate } = body;
    const validProductQuantity = await this.checkProduct(products);
    if (!validProductQuantity) return null;
    const address = await this.getShippingAddress(userId, addressId);
    const productsFromBody = await Promise.all(
      products.map(async (productItem: any) => {
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
    const newOrder = this.prisma.order.create({
      data: {
        ...dataCreate,
        userId: userId,
        address: address,
        products: {
          create: productsFromBody,
        },
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
    // Cập nhật lại số lượng sản phẩm trong kho
    await this.updateQuantityByProduct(products);
    return newOrder;
  }

  async getShippingAddress(userId: number, addressId: number) {
    const dbAddress = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId: userId,
      },
    });
    return `${dbAddress.streetName}, ${dbAddress.districtName}, ${dbAddress.provinceName}`;
  }

  async checkProduct(products: any) {
    for (const product of products) {
      const dbProduct = await this.prisma.product.findFirst({
        where: { id: product.id },
      });
      if (dbProduct.quantity < product.quantity || !dbProduct.status) {
        return false;
      }
    }
    return true;
  }

  async updateQuantityByProduct(products: any) {
    for (const product of products) {
      const dbProduct = await this.prisma.product.findFirst({
        where: { id: product.productId },
      });
      const quantity = dbProduct.quantity - product.quantity;
      await this.prisma.product.update({
        where: {
          id: product.productId,
        },
        data: { quantity },
      });
    }
  }

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

  async updateOrder(orderId: number, body: any) {
    body.updatedAt = new Date();
    return this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: body,
      include: {
        products: {
          include: {
            product: true,
          },
        },
        user: true,
        paymentMethod: true,
      },
    });
  }

  async removeOrderByUser(userId: number, orderId: number) {
    // Bắt đầu giao dịch để đảm bảo tính toàn vẹn dữ liệu
    return await this.prisma.$transaction(async (prisma) => {
      // Cập nhật trạng thái đơn hàng thành CANCELED
      const order = await prisma.order.update({
        where: {
          id: orderId,
          userId: userId,
        },
        data: {
          shippingStatus: ShippingStatus.CANCELED,
        },
        include: {
          user: true,
          paymentMethod: true,
          products: {
            include: {
              product: true,
            },
          },
        },
      });
      // Lặp qua từng sản phẩm trong đơn hàng để cập nhật lại kho
      for (const orderProduct of order.products) {
        await prisma.product.update({
          where: { id: orderProduct.productId },
          data: {
            quantity: {
              increment: orderProduct.quantity, // Cộng lại số lượng sản phẩm vào kho
            },
          },
        });
      }

      return order;
    });
  }

  async getOrderDetailByUser(userId: number, orderId: number) {
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
  async generateOrderKey() {
    const key = Math.random().toString(36).substring(2, 14);
    const redisStore = await redis;
    await redisStore.set(`order_${key}`, 1, {
      EX: 300,
    });
    return `order_${key}`;
  }

  async getOrderByKey(orderId, orderKey) {
    const redisStore = await redis;
    const status = await redisStore.get(orderKey);
    if (!status) return null;
    const orderDetail = await this.prisma.order.findFirst({
      where: { id: orderId },
      include: {
        products: {
          include: {
            product: true,
          },
        },
        paymentMethod: true,
      },
    });
    return orderDetail;
  }

  async getAllOrders({ page, limit, sort, order, filter = {} }) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.order.count({
      where: filter,
    });
    const orders = await this.prisma.order.findMany({
      where: { ...filter },
      skip: skip,
      take: limit,
      orderBy: {
        [sort]: order,
      },
      include: {
        paymentMethod: true,
        user: true,
      },
    });
    return {
      total: total,
      orders: orders,
    };
  }

  getOrderById(orderId: number) {
    return this.prisma.order.findFirst({
      where: { id: orderId },
      include: {
        user: true,
        paymentMethod: true,
        products: { include: { product: true } },
      },
    });
  }
  async validatePermission(userId: number, permissionName: string) {
    const permissionByRole = await this.prisma.usersOnRoles.findFirst({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
    if (
      !permissionByRole?.role ||
      !permissionByRole?.role?.permissions?.length
    ) {
      return null;
    }
    const validPermission = permissionByRole.role.permissions.find(
      ({ permission }) => permission.name === permissionName,
    );
    if (!validPermission) return null;
    return permissionByRole;
  }
}
