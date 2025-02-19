import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UsersService } from 'src/modules/users/users.service';
import { OrdersService } from './orders.service';
import { AppService } from 'src/app.service';

@Controller('user/orders')
export class OrdersController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getOrderList(@Req() req, @Query() query, @Res() res: Response) {
    const user = req.user;
    const {
      _page = 1,
      _limit = 10,
      _order = 'asc',
      _sort = 'id',
      shippingStatus,
    } = query;
    const filter: any = {};
    if (shippingStatus) {
      filter.shippingStatus = shippingStatus;
    }
    const { orders, total } = await this.ordersService.getOrdersByUser(
      user.userId,
      { page: +_page, limit: +_limit, sort: _sort, order: _order, filter },
    );
    if (!orders) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Danh sách đơn hàng không tồn tại',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: {
        orders: orders,
        total: total,
        currentPage: +_page,
      },
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createOrder(@Req() req, @Body() body: any, @Res() res: Response) {
    const user = req.user;
    const userStatus = await this.usersService.checkUserStatus(+user.userId);
    if (!userStatus) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Vui lòng kích hoạt tài khoản để đặt hàng',
      });
    }
    await this.ordersService.validateProductsQuantity(body.products);
    await this.ordersService.updateProductsQuantity(body.products);
    await this.ordersService.removeCartItems(+user.userId);
    const order = await this.ordersService.createOrder(+user.userId, body);
    const key = await this.ordersService.generateOrderKey();
    if (!order) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Đặt hàng thất bại',
      });
    }
    // // Gửi email xác nhận đơn hàng
    const confirmMailProducts = order.products.map(
      ({ product, quantity, price }) => {
        return { name: product.name, quantity, price };
      },
    );

    await this.appService.sendOrderConfirmation(
      +user.userId,
      +order.totalPrice,
      confirmMailProducts,
    );
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: order,
      key: key,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getOrderDetail(
    @Req() req,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const orderDetail = await this.ordersService.getOrderDetailById(
      +userId,
      +id,
    );
    if (!orderDetail) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Đơn hàng không tồn tại',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: orderDetail,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async cancelOrder(@Req() req, @Param('id') id: string, @Res() res: Response) {
    const user = req.user;
    const order = await this.ordersService.removeOrder(+user.userId, +id);
    if (!order) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Hủy đơn hàng thất bại',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: order,
    });
  }
}
