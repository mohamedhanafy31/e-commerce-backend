import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('AdminPass123', 12);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@ecommerce.local' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ecommerce.local',
      passwordHash: adminPassword,
      isActive: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Clothing' },
      update: {},
      create: {
        name: 'Clothing',
        description: 'Fashion and apparel',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Books' },
      update: {},
      create: {
        name: 'Books',
        description: 'Books and literature',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Home & Garden' },
      update: {},
      create: {
        name: 'Home & Garden',
        description: 'Home improvement and gardening supplies',
      },
    }),
  ]);
  console.log('✅ Created categories:', categories.map(c => c.name).join(', '));

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'featured' },
      update: {},
      create: { name: 'featured' },
    }),
    prisma.tag.upsert({
      where: { name: 'bestseller' },
      update: {},
      create: { name: 'bestseller' },
    }),
    prisma.tag.upsert({
      where: { name: 'new' },
      update: {},
      create: { name: 'new' },
    }),
    prisma.tag.upsert({
      where: { name: 'sale' },
      update: {},
      create: { name: 'sale' },
    }),
  ]);
  console.log('✅ Created tags:', tags.map(t => t.name).join(', '));

  // Create products
  const products = [
    {
      name: 'Smartphone Pro Max',
      description: 'Latest flagship smartphone with advanced features',
      price: 999.99,
      sku: 'PHONE-001',
      stockQuantity: 50,
      imageUrl: 'https://example.com/images/smartphone.jpg',
      categoryIds: [categories[0].id], // Electronics
      tagIds: [tags[0].id, tags[2].id], // featured, new
    },
    {
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones',
      price: 299.99,
      sku: 'AUDIO-001',
      stockQuantity: 100,
      imageUrl: 'https://example.com/images/headphones.jpg',
      categoryIds: [categories[0].id], // Electronics
      tagIds: [tags[1].id], // bestseller
    },
    {
      name: 'Cotton T-Shirt',
      description: 'Comfortable 100% cotton t-shirt',
      price: 29.99,
      sku: 'CLOTH-001',
      stockQuantity: 200,
      imageUrl: 'https://example.com/images/tshirt.jpg',
      categoryIds: [categories[1].id], // Clothing
      tagIds: [tags[3].id], // sale
    },
    {
      name: 'Programming Book',
      description: 'Learn modern web development',
      price: 49.99,
      sku: 'BOOK-001',
      stockQuantity: 75,
      imageUrl: 'https://example.com/images/book.jpg',
      categoryIds: [categories[2].id], // Books
      tagIds: [tags[0].id], // featured
    },
    {
      name: 'Garden Tools Set',
      description: 'Complete set of essential garden tools',
      price: 89.99,
      sku: 'GARDEN-001',
      stockQuantity: 30,
      imageUrl: 'https://example.com/images/garden-tools.jpg',
      categoryIds: [categories[3].id], // Home & Garden
      tagIds: [tags[2].id], // new
    },
  ];

  for (const productData of products) {
    const { categoryIds, tagIds, ...product } = productData;
    
    const createdProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        ...product,
        categories: {
          create: categoryIds.map(categoryId => ({ categoryId })),
        },
        tags: {
          create: tagIds.map(tagId => ({ tagId })),
        },
      },
    });
    
    console.log('✅ Created product:', createdProduct.name);
  }

  // Create sample reviews
  const sampleReviews = [
    {
      productSku: 'PHONE-001',
      rating: 5,
      reviewText: 'Amazing phone with great camera quality!',
      reviewerName: 'John Doe',
    },
    {
      productSku: 'PHONE-001',
      rating: 4,
      reviewText: 'Good phone but battery could be better.',
      reviewerName: 'Jane Smith',
    },
    {
      productSku: 'AUDIO-001',
      rating: 5,
      reviewText: 'Excellent sound quality and noise cancellation.',
      reviewerName: 'Mike Johnson',
    },
    {
      productSku: 'CLOTH-001',
      rating: 4,
      reviewText: 'Comfortable and good quality fabric.',
      reviewerName: 'Sarah Wilson',
    },
  ];

  for (const reviewData of sampleReviews) {
    const { productSku, ...review } = reviewData;
    
    const product = await prisma.product.findUnique({
      where: { sku: productSku },
    });

    if (product) {
      await prisma.review.create({
        data: {
          ...review,
          productId: product.id,
        },
      });
      console.log('✅ Created review for:', product.name);
    }
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
