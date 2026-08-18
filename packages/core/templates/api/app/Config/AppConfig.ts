import { Configuration, Env } from "@zentify/core";

@Configuration()
export class AppConfig {
  @Env("APP_NAME") appName!: string;
  @Env("PORT") port!: number;
  @Env("FRONTEND_TEST_API") testApiUrl!: string;
}