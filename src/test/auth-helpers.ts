import request from "supertest";
import { app } from "../app.ts";

export type Credentials = { email: string; password: string };

export const jane: Credentials = { email: "jane@example.com", password: "s3cretpass" };
export const john: Credentials = { email: "john@example.com", password: "s3cretpass" };

export const refreshTokenFrom = (res: request.Response) => {
  const token = /^refresh_token=([^;]+)/.exec(res.headers["set-cookie"]?.[0] ?? "")?.[1];
  if (!token) throw new Error("No refresh_token cookie in response");
  return token;
};

export const signup = (user: Credentials) => request(app).post("/users/signup").send(user).expect(201);

export const login = async (user: Credentials) => {
  const res = await request(app).post("/auth/login").send(user).expect(200);
  return { refreshToken: refreshTokenFrom(res), accessToken: res.body.accessToken as string };
};

export const signupAndLogin = async (user: Credentials) => {
  await signup(user);
  return login(user);
};

const withRefreshCookie = (path: string, token: string) =>
  request(app).post(path).set("Cookie", `refresh_token=${token}`);

export const refresh = (token: string) => withRefreshCookie("/auth/refresh", token);
export const logout = (token: string) => withRefreshCookie("/auth/logout", token);
