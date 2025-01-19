import { Injectable } from '@nestjs/common';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createPaymentMethodDto: CreatePaymentMethodDto) {
    const paymentMethod = await this.findPaymentMethodByField(
      'name',
      createPaymentMethodDto.name,
    );
    if (paymentMethod) {
      return null;
    }
    return this.prisma.paymentMethod.create({ data: createPaymentMethodDto });
  }

  findAll(filters: any) {
    return this.prisma.paymentMethod.findMany({
      where: filters,
    });
  }

  findOne(id: number) {
    return this.prisma.paymentMethod.findUnique({ where: { id } });
  }

  async update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    const paymentMethod = await this.findPaymentMethodByField(
      'name',
      updatePaymentMethodDto.name,
    );
    if (paymentMethod.id !== id) {
      return null;
    }
    return this.prisma.paymentMethod.update({
      where: { id },
      data: updatePaymentMethodDto,
    });
  }

  remove(id: number) {
    return this.prisma.paymentMethod.delete({ where: { id } });
  }

  findPaymentMethodByField(field: string, value: string) {
    return this.prisma.paymentMethod.findFirst({ where: { [field]: value } });
  }
}
