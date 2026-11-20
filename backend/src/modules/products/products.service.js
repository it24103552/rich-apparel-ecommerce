const prisma = require("../../config/prisma");
const notificationsService = require("../notifications/notifications.service");
const activitiesService = require("../activities/activities.service");

class ProductsService {
  async create(data, imageUrl, user) {
    const { images, ...restData } = data;
    const product = await prisma.product.create({
      data: {
        ...restData,
        imageUrl,
        images: images || [],
      },
      include: { category: true, supplier: true }
    });

    // Log activity
    await activitiesService.log({
      type: 'ACTION',
      action: 'CREATE_PRODUCT',
      userId: user?.id,
      userName: user?.name,
      roleName: user?.role?.name,
      targetId: product.id,
      targetName: product.name,
      message: `Product "${product.name}" created by ${user?.name || 'System'}`,
      details: { sku: product.sku, price: product.price, stock: product.stock }
    });

    // Check for low stock on creation
    await notificationsService.checkLowStock(product);

    return product;
  }

  async getAll(skip = 0, take = 10, categoryId = null) {
    const where = { isDeleted: false };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    return prisma.product.findMany({
      where,
      include: { category: true, supplier: true, reviews: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true, supplier: true, reviews: true }
    });
  }

  async update(id, data, imageUrl, user) {
    const oldProduct = await this.getById(id);
    if (!oldProduct) throw new Error("Product not found");

    // Explicitly pick and cast fields to ensure correct Prisma types
    const updateData = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = parseFloat(data.price) || 0;
    if (data.costPrice !== undefined) updateData.costPrice = parseFloat(data.costPrice) || 0;
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock) || 0;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
    if (data.isActive !== undefined) updateData.isActive = (data.isActive === true || data.isActive === 'true');
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.images !== undefined) updateData.images = data.images;

    // Handle Variants
    if (data.variants && Array.isArray(data.variants)) {
      // We allow admins to update variant stock directly. 
      // This fix removes the strict preservation rule that was causing updates to fail.
      updateData.variants = data.variants.map(v => ({
        ...v,
        stock: parseInt(v.stock) || 0,
        priceAdj: parseFloat(v.priceAdj) || 0
      }));

      // Synchronization: Recalculate total product stock if variants exist
      updateData.stock = updateData.variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      console.log(`[ProductUpdate] Synced total stock (${updateData.stock}) from ${updateData.variants.length} variants.`);
    }

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    console.log(`[ProductUpdate] Saving changes for "${updateData.name || oldProduct.name}" (ID: ${id})`);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, supplier: true }
    });

    // Post-update processing
    if (oldProduct) {
      await notificationsService.checkRestock(updatedProduct, oldProduct.stock);
      await notificationsService.checkLowStock(updatedProduct);
    }

    // Log activity
    await activitiesService.log({
      type: 'ACTION',
      action: 'UPDATE_PRODUCT',
      userId: user?.id,
      userName: user?.name,
      roleName: user?.role?.name,
      targetId: updatedProduct.id,
      targetName: updatedProduct.name,
      message: `Product "${updatedProduct.name}" updated by ${user?.name || 'System'}`,
      details: {
        fieldsChanged: Object.keys(updateData),
        newPrice: updatedProduct.price,
        newStock: updatedProduct.stock
      }
    });

    return updatedProduct;
  }

  async delete(id, user) {
    const product = await this.getById(id);
    const deletedProduct = await prisma.product.update({
      where: { id },
      data: { isDeleted: true }
    });

    // Log activity
    await activitiesService.log({
      type: 'ACTION',
      action: 'DELETE_PRODUCT',
      userId: user?.id,
      userName: user?.name,
      roleName: user?.role?.name,
      targetId: id,
      targetName: product?.name,
      message: `Product "${product?.name || id}" deleted by ${user?.name || 'System'}`,
      details: { sku: product?.sku }
    });

    return deletedProduct;
  }

  async getTotalCount(categoryId = null) {
    const where = { isDeleted: false };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    return prisma.product.count({ where });
  }

  async getLowStockProducts(threshold = 10) {
    return prisma.product.findMany({
      where: {
        isDeleted: false,
        stock: { lte: threshold }
      }
    });
  }

  /**
   * Read-only aggregation of genuinely popular products from non-cancelled orders.
   * Returns only public catalog fields without exposing any customer/order details.
   */
  async getPopularProducts(limit = 5) {
    const orders = await prisma.order.findMany({
      where: {
        isDeleted: false,
        status: { not: "cancelled" },
      },
      select: {
        createdAt: true,
        method: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    const validOrders = orders.filter((o) => o.method !== "return_replacement");
    if (validOrders.length === 0) {
      return { products: [], windowDays: null };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const aggregateQuantities = (orderList) => {
      const counts = new Map();
      for (const order of orderList) {
        for (const item of order.items || []) {
          if (!item.productId || !item.quantity || item.quantity <= 0) continue;
          counts.set(item.productId, (counts.get(item.productId) || 0) + item.quantity);
        }
      }
      return counts;
    };

    const recentOrders = validOrders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo);
    let windowDays = 7;
    let quantityMap = aggregateQuantities(recentOrders);

    if (quantityMap.size === 0) {
      windowDays = null;
      quantityMap = aggregateQuantities(validOrders);
    }

    if (quantityMap.size === 0) {
      return { products: [], windowDays: null };
    }

    const rankedIds = Array.from(quantityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([productId]) => productId);

    const activeProducts = await prisma.product.findMany({
      where: {
        id: { in: rankedIds },
        isDeleted: false,
        isActive: true,
        stock: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        imageUrl: true,
        images: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
      },
    });

    const productById = new Map(activeProducts.map((p) => [p.id, p]));
    const sortedProducts = rankedIds
      .map((id) => productById.get(id))
      .filter(Boolean)
      .slice(0, limit);

    return {
      products: sortedProducts,
      windowDays: sortedProducts.length > 0 ? windowDays : null,
    };
  }
}

module.exports = new ProductsService();
