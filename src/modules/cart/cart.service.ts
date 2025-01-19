import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateCartDto } from './dto/create-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCartByUser(userId: number) {
    return this.prisma.cart.findFirst({
      where: {
        userId,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async addToCartByUser(userId: number, body: CreateCartDto) {
    let cartByUser = await this.prisma.cart.findFirst({
      where: { userId },
      include: { products: true },
    });
    if (!cartByUser) {
      cartByUser = await this.prisma.cart.create({
        data: { userId },
        include: {
          products: true,
        },
      });
    }

    const productInCart = cartByUser.products.find(
      (product) => product.productId === body.id,
    );
    const productInDb = await this.prisma.product.findFirst({
      where: { id: body.id },
    });
    if (productInCart) {
      if (productInCart.quantity + body.quantity > productInDb.quantity) {
        return null;
      } else if (!body.quantity) {
        await this.prisma.productsOnCart.delete({
          where: { id: productInCart.id },
        });
      } else {
        await this.prisma.productsOnCart.update({
          where: { id: productInCart.id },
          data: {
            quantity: productInCart.quantity + body.quantity,
            updatedAt: new Date(),
          },
        });
      }
    } else {
      if (body.quantity > productInDb.quantity || !body.quantity) return null;
      await this.prisma.productsOnCart.create({
        data: {
          cartId: cartByUser.id,
          productId: body.id,
          quantity: body.quantity,
        },
      });
    }
    return this.prisma.cart.findFirst({
      where: {
        userId,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async removeCartItemByUser(userId: number, productId: number) {
    const cartByUser = await this.prisma.cart.findFirst({
      where: { userId },
      include: { products: true },
    });
    if (!cartByUser) return null;

    const productInCart = cartByUser.products.find(
      (item) => item.productId === productId,
    );
    if (!productInCart) return null;
    await this.prisma.productsOnCart.delete({
      where: { id: productInCart.id },
    });
    console.log('third');

    return this.prisma.cart.findFirst({
      where: {
        userId,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async updateCartItemsByUser(userId: number, cartItems: any) {
    if (!Array.isArray(cartItems) || !cartItems.length) return null;
    const cartByUser = await this.prisma.cart.findFirst({
      where: { userId },
      include: { products: true },
    });
    if (!cartByUser) return null;
    for (const item of cartItems) {
      const { id, quantity } = item;
      const productInCart = cartByUser.products.find(
        (product) => product.productId === id,
      );
      const productInDb = await this.prisma.product.findFirst({
        where: { id },
      });
      if (productInCart) {
        if (quantity > 0) {
          if (quantity <= productInDb.quantity) {
            await this.prisma.productsOnCart.update({
              where: { id: productInCart.id },
              data: { quantity },
            });
          } else {
            throw new BadRequestException(
              `Sản phẩm ${productInDb.name} đã vượt quá số lượng trong kho (Tối đa ${productInDb.quantity} sản phẩm)`,
            );
          }
        } else {
          await this.prisma.productsOnCart.delete({
            where: { id: productInCart.id },
          });
        }
      }
    }
    return this.prisma.cart.findUnique({
      where: { id: cartByUser.id },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async checkoutCartItems(userId: number) {
    const cartByUser = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
    cartByUser.products.forEach((item) => {
      if (item.quantity > item.product.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${item.product.name} đã vượt quá số lượng trong kho (Tối đa ${item.product.quantity} sản phẩm) `,
        );
      }
    });
  }

  async clearCartListByUser(userId: number) {
    return this.prisma.cart.update({
      where: { userId },
      data: {
        products: {
          deleteMany: {},
        },
      },
    });
  }

  async createInitialCart(userId: number) {
    return this.prisma.cart.create({
      data: {
        userId,
      },
      include: {
        products: true,
      },
    });
  }
}
