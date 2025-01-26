import {
  Body,
  Controller,
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
import { Response } from 'express';
import { z } from 'zod';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from '../admin/permissions/permissions.service';
import { CategoryPermission } from 'src/app.interface';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  async getCategoryList(@Query() query, @Res() res: Response) {
    const {
      _page = 1,
      _limit = 10,
      _order = 'asc',
      _sort = 'id',
      status,
      q,
    } = query;
    const filter = {} as {
      [key: string]: string | boolean | object;
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
    if (status) {
      filter.status = status === 'true';
    }

    const { total, categories } = await this.categoriesService.getCategoryList({
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
        total,
        categories,
        currentPage: +_page,
      },
    });
  }

  @Get(':id')
  async getCategoryDetail(@Param('id') id: string, @Res() res: Response) {
    const category = await this.categoriesService.findCategoryByField(
      'id',
      +id,
    );
    if (!category) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Danh mục không tồn tại',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: category,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createCategory(
    @Req() req,
    @Body() body: CreateCategoryDto,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const validPermission = await this.permissionsService.validatePermission(
      +userId,
      CategoryPermission.CREATE,
    );
    if (!validPermission) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Bạn không có quyền tạo danh mục',
      });
    }
    const schema = z.object({
      name: z
        .string({
          required_error: 'Tên danh mục bắt buộc phải nhập',
        })
        .min(1, 'Tên phải chứa ít nhất 1 ký tự')
        .refine(async (name) => {
          const category = await this.categoriesService.findCategoryByField(
            'name',
            name,
          );
          return !category;
        }, 'Danh mục đã tồn tại'),
      imageUrl: z.string({ required_error: 'ImageUrl bắt buộc phải nhập' }),
      status: z.boolean({ required_error: 'Trạng thái bắt buộc phải nhập' }),
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
    const category = await this.categoriesService.createCategory(body);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Tạo mới danh mục thành công',
      data: category,
    });
  }

  @Patch(':id')
  async updateCategory(
    @Param('id') id: number,
    @Body() body: UpdateCategoryDto,
    @Res() res: Response,
  ) {
    const category = await this.categoriesService.updateCategory(+id, body);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: category,
    });
  }
}
