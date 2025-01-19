import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { Response } from 'express';

@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  async create(
    @Body() createPaymentMethodDto: CreatePaymentMethodDto,
    @Res() res: Response,
  ) {
    const paymentMethod = await this.paymentMethodsService.create(
      createPaymentMethodDto,
    );
    if (!paymentMethod) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Phương thức thanh toán đã tồn tại',
      });
    }
    return res.status(HttpStatus.CONFLICT).json({
      success: true,
      message: 'Thêm phương thức thanh toán thành công',
      data: paymentMethod,
    });
  }

  @Get()
  async findAll(@Query() query, @Res() res: Response) {
    const filters = {};
    if (query.status) {
      filters['status'] = query.status === 'true';
    }
    const paymentMethods = await this.paymentMethodsService.findAll(filters);
    if (!paymentMethods) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: 'FAILED' });
    }
    return res.status(HttpStatus.OK).json({
      data: paymentMethods,
      success: true,
      message: 'SUCCESS',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentMethodsService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
    @Res() res: Response,
  ) {
    const paymentMethod = await this.paymentMethodsService.update(
      +id,
      updatePaymentMethodDto,
    );
    if (!paymentMethod) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Cập nhật phương thức thanh toán thất bại',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Cập nhật phương thức thanh toán thành công',
      data: paymentMethod,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    const deletePaymentMethod = await this.paymentMethodsService.findOne(+id);
    if (!deletePaymentMethod) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Phương thức thanh toán không tồn tại',
      });
    }
    await this.paymentMethodsService.remove(+id);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Xóa phương thức thanh toán thành công',
    });
  }
}
