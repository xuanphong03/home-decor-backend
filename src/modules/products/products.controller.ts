import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Response } from 'express';
import { z } from 'zod';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from '../admin/permissions/permissions.service';
import { ProductPermission } from 'src/app.interface';
import { ReviewProductDto } from './dto/review-product.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  async getProductList(@Query() query, @Res() res: Response) {
    const {
      q,
      _page = 1,
      _limit = 10,
      _sort = 'id',
      _new = false,
      category,
      gtePrice,
      ltePrice,
    } = query;
    const filter = {} as {
      [key: string]: string | boolean | object | number;
    };
    if (q) {
      filter.OR = [
        {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        },
      ];
    }
    if (_new) {
      filter.new = _new === 'true';
    }
    if (category) {
      filter.category = {
        name: {
          equals: category,
          mode: 'insensitive',
        },
      };
    }
    // Kiểm tra và khởi tạo filter.finalPrice
    if (gtePrice || ltePrice) {
      filter.finalPrice = {
        ...(gtePrice && { gte: +gtePrice }),
        ...(ltePrice && { lte: +ltePrice }),
      };
    }
    const sortOptions = {
      default: { sort: 'id', order: 'asc' },
      latest: { sort: 'createdAt', order: 'desc' },
      price: { sort: 'finalPrice', order: 'asc' },
      'price-desc': { sort: 'finalPrice', order: 'desc' },
    };
    const { sort, order } = sortOptions[_sort] || sortOptions['default'];

    const { total, products } = await this.productsService.getProductList({
      page: +_page,
      limit: +_limit,
      sort: sort,
      order: order,
      filter,
    });
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: {
        total,
        products,
        currentPage: +_page,
      },
    });
  }

  @Get('/recommend')
  async getRelatedProductList(@Query() query, @Res() res: Response) {
    const {
      _page = 1,
      _limit = 10,
      _order = 'asc',
      _sort = 'id',
      productId,
      categoryId,
    } = query;
    const filter = {} as {
      [key: string]: string | boolean | object | number;
    };
    if (categoryId) {
      filter.categoryId = +categoryId;
    }
    if (productId) {
      filter.NOT = {
        id: +productId,
      };
    }
    const { total, products } =
      await this.productsService.getRelatedProductList({
        page: +_page,
        limit: +_limit,
        sort: _sort,
        order: _order,
        filter,
      });
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: {
        total: total,
        products: products,
        currentPage: +_page,
      },
    });
  }

  @Get(':id')
  async getProductDetail(@Param('id') id: number, @Res() res: Response) {
    const product = await this.productsService.findProductByField('id', +id);
    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Sản phẩm không tồn tại',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: product,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createProduct(
    @Req() req,
    @Body() body: CreateProductDto,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const validPermission = await this.permissionsService.validatePermission(
      +userId,
      ProductPermission.CREATE,
    );
    if (!validPermission) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Bạn không có quyền tạo sản phẩm',
      });
    }
    const schema = z.object({
      name: z
        .string({
          required_error: 'Tên sản phẩm bắt buộc phải nhập',
        })
        .min(1, 'Tên sản phẩm phải chứa ít nhất 1 ký tự')
        .refine(async (name) => {
          const category = await this.productsService.findProductByField(
            'name',
            name,
          );
          return !category;
        }, 'Sản phẩm đã tồn tại. Vui lòng thử lại'),
    });
    // Xử lý validate body (nếu schema sử dụng async => schema.safeParseAsync(body))
    const validatedFields = await schema.safeParseAsync(body);
    if (!validatedFields.success) {
      const errors = validatedFields.error.flatten().fieldErrors;
      const errorMessage = errors[Object.keys(errors)[0]][0];
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: errorMessage,
      });
    }
    const product = await this.productsService.createProduct(body);
    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Thêm mới sản phẩm thành công',
      data: product,
    });
  }

  @Patch(':id')
  async updateProduct(
    @Param('id') id: number,
    @Body() body: CreateProductDto,
    @Res() res: Response,
  ) {
    const product = await this.productsService.updateProduct(+id, body);
    if (!product) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Tên sản phẩm đã tồn tại. Vui lòng thử lại',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: product,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/review-product')
  async reviewProduct(
    @Req() req,
    @Body() body: ReviewProductDto,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const purchased = await this.productsService.findProductInOrdersByUser(
      +userId,
      +body.productId,
    );
    if (!purchased) {
      throw new ForbiddenException(
        'Bạn chưa mua sản phẩm này nên chưa thể đánh giá!',
      );
    }
    const productReview = await this.productsService.reviewProduct(
      +userId,
      body,
    );
    if (!productReview) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: true,
        message: 'Đánh giá sản phẩm thất bại',
        data: productReview,
      });
    }
    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Đánh giá sản phẩm thành công',
      data: productReview,
    });
  }
}
