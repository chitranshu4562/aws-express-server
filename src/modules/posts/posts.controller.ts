import type { Request, Response } from "express";
import { createPostSchema, postParamsSchema, updatePostSchema } from "./posts.schema.ts";
import * as postsService from "./posts.service.ts";

export async function create(req: Request, res: Response) {
  const data = createPostSchema.parse(req.body);
  const post = await postsService.createPost(data);
  res.status(201).json(post);
}

export async function list(_req: Request, res: Response) {
  res.json(await postsService.listPosts());
}

export async function getById(req: Request, res: Response) {
  const { id } = postParamsSchema.parse(req.params);
  const post = await postsService.getPost(id);

  if (!post) {
    res.status(404).json({ error: "Not Found" });
    return;
  }
  res.json(post);
}

export async function update(req: Request, res: Response) {
  const { id } = postParamsSchema.parse(req.params);
  const data = updatePostSchema.parse(req.body);

  if (!(await postsService.getPost(id))) {
    res.status(404).json({ error: "Not Found" });
    return;
  }
  res.json(await postsService.updatePost(id, data));
}

export async function remove(req: Request, res: Response) {
  const { id } = postParamsSchema.parse(req.params);

  if (!(await postsService.getPost(id))) {
    res.status(404).json({ error: "Not Found" });
    return;
  }
  await postsService.deletePost(id);
  res.status(204).end();
}
