// Adds app-specific properties to Express's Request type (declaration merging).
declare global {
  namespace Express {
    interface Request {
      // Set by the `authenticate` middleware; undefined on public routes.
      user?: { id: string };
    }
  }
}

// Makes this file a module, which `declare global` requires.
export {};
