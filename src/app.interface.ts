export enum QueueName {
  EMAIL = 'email',
  TELEGRAM = 'telegram',
}

export enum ShippingStatus {
  PENDING = 'PENDING',
  SHIPPING = 'SHIPPING',
  RECEIVED = 'RECEIVED',
  CANCELED = 'CANCELED',
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

export enum ProductPermission {
  READ = 'products.read',
  CREATE = 'products.create',
  UPDATE = 'products.update',
  DELETE = 'products.delete',
}

export enum CategoryPermission {
  READ = 'categories.read',
  CREATE = 'categories.create',
  UPDATE = 'categories.update',
  DELETE = 'categories.delete',
}

export enum UserPermission {
  READ = 'users.read',
  CREATE = 'users.create',
  UPDATE = 'users.update',
  DELETE = 'users.delete',
}

export enum PermissionPermission {
  READ = 'permissions.read',
  CREATE = 'permissions.create',
  UPDATE = 'permissions.update',
  DELETE = 'permissions.delete',
}

export enum RolePermission {
  READ = 'roles.read',
  CREATE = 'roles.create',
  UPDATE = 'roles.update',
  DELETE = 'roles.delete',
}
