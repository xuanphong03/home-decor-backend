import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategoryList({ page, limit, sort, order, filter = {} }) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.product.count();
    const categories = await this.prisma.category.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        [sort]: order,
      },
      where: filter,
      include: { products: true },
    });
    return {
      total,
      categories,
    };
  }

  findCategoryByField(field: string, value: any) {
    return this.prisma.category.findFirst({
      where: {
        [field]: value,
      },
    });
  }

  createCategory(body: any) {
    return this.prisma.category.create({
      data: body,
    });
  }

  updateCategory(id: number, body: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: {
        id,
      },
      data: { ...body, updatedAt: new Date() },
    });
  }

  deleteCategory(id: number) {
    return this.prisma.category.delete({
      where: {
        id,
      },
    });
  }
}
