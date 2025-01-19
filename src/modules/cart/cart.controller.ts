import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { Response } from 'express';
import { CreateCartDto } from './dto/create-cart.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { EventName } from 'src/app.interface';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getCartByUser(@Req() req, @Res() res: Response) {
    const { userId } = req.user;
    const cartItems = await this.cartService.getCartByUser(+userId);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: cartItems,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/checkout')
  async checkoutCartItems(@Req() req, @Res() res: Response) {
    const { userId } = req.user;
    await this.cartService.checkoutCartItems(+userId);

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async addToCartByUser(
    @Req() req,
    @Body() body: CreateCartDto,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const cartByUser = await this.cartService.addToCartByUser(+userId, body);
    if (!cartByUser) {
      return res.status(HttpStatus.CONFLICT).json({
        success: false,
        message:
          'Số lượng sản phẩm đã vượt quá số lượng sản phẩm trong kho hàng',
      });
    }

    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'SUCCESS',
      data: cartByUser,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  async updateCartItems(
    @Req() req,
    @Body() body: { items: { id: number; quantity: number }[] },
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const updateCartItems = await this.cartService.updateCartItemsByUser(
      +userId,
      body.items,
    );
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Cập nhật giỏ hàng thành công',
      data: updateCartItems,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/product')
  async removeProductInCartByUser(
    @Req() req,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const cartByUser = await this.cartService.removeCartItemByUser(
      +userId,
      +id,
    );
    if (!cartByUser) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'FAILED',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: cartByUser,
    });
  }

  @OnEvent('order.created')
  handleOrderCreatedEvent(payload: any) {
    const userId = payload.userId;
    return this.cartService.clearCartListByUser(+userId);
  }

  @OnEvent(EventName.USER_CREATED)
  handleCreateInitialCart(payload: any) {
    const userId = payload.id;
    return this.cartService.createInitialCart(+userId);
  }
}
