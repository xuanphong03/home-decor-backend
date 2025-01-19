import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Response } from 'express';
import { z } from 'zod';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProductList(@Query() query, @Res() res: Response) {
    const {
      q,
      _page = 1,
      _limit = 3,
      _order = 'asc',
      _sort = 'id',
      categoryId,
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
    if (categoryId) {
      filter.categoryId = +categoryId;
    }
    // Kiểm tra và khởi tạo filter.finalPrice
    if (gtePrice || ltePrice) {
      filter.finalPrice = {};
      if (gtePrice) {
        filter.finalPrice['gte'] = +gtePrice;
      }
      if (ltePrice) {
        filter.finalPrice['lte'] = +ltePrice;
      }
    }

    let sort = _sort;
    let order = _order;
    if (sort === 'default') {
      sort = 'id';
    } else if (sort === 'latest') {
      sort = 'createdAt';
      order = 'desc';
    } else if (sort === 'price') {
      sort = 'finalPrice';
      order = 'asc';
    } else if (sort === 'price-desc') {
      sort = 'finalPrice';
      order = 'desc';
    }

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
      _limit = 3,
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

  @Post()
  async createProduct(@Body() body: CreateProductDto, @Res() res: Response) {
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
}
