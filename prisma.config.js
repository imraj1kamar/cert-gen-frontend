/** @type {import('prisma').Config} */
export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
};