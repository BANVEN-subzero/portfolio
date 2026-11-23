const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    const users = await p.user.findMany();
    console.log('DB OK | user count:', users.length);
    const posts = await p.post.findMany();
    console.log('DB OK | post count:', posts.length);

    // Test write
    const u = await p.user.create({
      data: { email: 'diagnostic-test@example.com', name: 'Diagnostic Test' },
    });
    console.log('DB write OK | created user id:', u.id);

    // Test read after write
    const found = await p.user.findUnique({ where: { id: u.id } });
    console.log('DB read OK | found:', found?.email);

    // Clean up
    await p.user.delete({ where: { id: u.id } });
    console.log('DB delete OK | cleaned up test user');

    await p.$disconnect();
    console.log('DB disconnect OK');
  } catch (e) {
    console.error('DB ERROR:', e.message);
    process.exit(1);
  }
})();
