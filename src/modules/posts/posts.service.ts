import { prisma } from "../../db/prisma.ts";

type PostInput = { title: string; description: string };

export function createPost(data: PostInput) {
  return prisma.post.create({ data });
}

export function listPosts() {
  return prisma.post.findMany({ orderBy: { createdAt: "desc" } });
}

export function getPost(id: number) {
  return prisma.post.findUnique({ where: { id } });
}

export function updatePost(id: number, data: Partial<PostInput>) {
  return prisma.post.update({ where: { id }, data });
}

export function deletePost(id: number) {
  return prisma.post.delete({ where: { id } });
}
