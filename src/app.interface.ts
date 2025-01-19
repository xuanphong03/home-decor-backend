export enum QueueName {
  EMAIL = 'email',
  TELEGRAM = 'telegram',
}

export enum EventName {
  USER_CREATED = 'user.created',
  PRODUCT_CREATED = 'product.created',
  ORDER_CREATED = 'order.created',
}

export enum OrderPermission {
  READ = 'orders.read',
  CREATE = 'orders.create',
  UPDATE = 'orders.update',
  DELETE = 'orders.delete',
}
