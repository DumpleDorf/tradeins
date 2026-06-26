const bcrypt = require("bcryptjs");

async function main() {
  const users = [
    { email: "superadmin@tesla.com", password: "SuperAdmin123!" },
    { email: "lister@tesla.com", password: "TeslaEmployee123!" },
    { email: "partner@wholesale.com", password: "Partner123!" },
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 12);
    const ok = await bcrypt.compare(user.password, hash);
    console.log(`-- ${user.email} (verified: ${ok})`);
    console.log(
      `UPDATE "User" SET "passwordHash" = '${hash}', "updatedAt" = NOW() WHERE "email" = '${user.email}';`
    );
    console.log("");
  }
}

main();
