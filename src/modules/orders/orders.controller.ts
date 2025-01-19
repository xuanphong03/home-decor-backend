import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventName, OrderPermission } from 'src/app.interface';
import { UsersService } from '../users/users.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly userService: UsersService,
    private eventEmitter: EventEmitter2,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('')
  async getAllOrders(@Query() query, @Res() res: Response) {
    const {
      _page = 1,
      _limit = 10,
      _order = 'asc',
      _sort = 'id',
      shippingStatus,
      q,
    } = query;
    const filter: any = {};
    if (q) {
      filter.OR = [
        {
          user: {
            email: {
              contains: q,
              mode: 'insensitive',
            },
          },
        },
      ];
    }
    if (shippingStatus) {
      filter.shippingStatus = shippingStatus;
    }
    const { orders, total } = await this.ordersService.getAllOrders({
      page: +_page,
      limit: +_limit,
      sort: _sort,
      order: _order,
      filter,
    });
    if (!orders) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'FAILED',
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
  @Get(':id')
  async getOrderDetailById(@Param('id') id: string, @Res() res: Response) {
    const orderDetail = await this.ordersService.getOrderById(+id);
    if (!orderDetail) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'ERROR',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: orderDetail,
    });
  }

  @Get('/order-received/:id')
  async getOrderReceived(
    @Param('id') id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    const order = await this.ordersService.getOrderByKey(+id, query.key);
    if (!order) {
      return res.status(HttpStatus.NOT_FOUND).json({
        status: false,
        message: 'FAILED',
      });
    }
    return res.status(HttpStatus.OK).json({
      status: true,
      message: 'SUCCESS',
      data: order,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/personal-orders')
  async getPersonalOrderDetail(
    @Req() req,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const orderDetail = await this.ordersService.getOrderDetailByUser(
      +userId,
      +id,
    );
    if (!orderDetail) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'ERROR',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: orderDetail,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createOrder(@Req() req, @Body() body: any, @Res() res: Response) {
    const user = req.user;
    const activeUser = await this.userService.checkUserStatus(+user.userId);
    if (!activeUser) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Vui lòng kích hoạt tài khoản để đặt hàng',
      });
    }
    const order = await this.ordersService.createOrder(+user.userId, body);
    if (!order) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'ERROR',
      });
    }
    this.eventEmitter.emit(EventName.ORDER_CREATED, { userId: order.userId });
    const orderKey = await this.ordersService.generateOrderKey();
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: order,
      key: orderKey,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateOrder(
    @Req() req,
    @Param('id') id: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const validatePermission = await this.ordersService.validatePermission(
      +userId,
      OrderPermission.READ,
    );
    if (!validatePermission) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Bạn không có quyền cập nhật đơn hàng',
      });
    }
    const updateOrder = await this.ordersService.updateOrder(+id, body);
    if (!updateOrder) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Cập nhật đơn hàng thất bại',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Cập nhật đơn hàng thành công',
      data: validatePermission,
    });
  }
}
