import type { Request, Response } from "express";
import { organizationService } from "./organization.service.ts";

export const organizationController = {
  async create(req: Request, res: Response) {
    const organization = await organizationService.create(req.user!.id, req.body);
    res.status(201).json(organization);
  },

  async list(req: Request, res: Response) {
    const organizations = await organizationService.listForUser(req.user!.id);
    res.status(200).json(organizations);
  },

  async get(req: Request, res: Response) {
    const { organizationId, role } = req.membership!;
    const organization = await organizationService.get(organizationId);
    res.status(200).json({ ...organization, role });
  },

  async update(req: Request, res: Response) {
    const { organizationId, role } = req.membership!;
    const organization = await organizationService.update(organizationId, req.body);
    res.status(200).json({ ...organization, role });
  },

  async delete(req: Request, res: Response) {
    await organizationService.delete(req.membership!.organizationId);
    res.status(204).end();
  },
};
