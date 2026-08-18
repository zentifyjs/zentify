import { Configuration, Env } from "@zentify/core";

@Configuration()
export class AppConfig {
  @Env("APP_NAME") appName!: string;
  @Env("PORT") port!: number;
  @Env("FRONTEND_TEST_API") testApiUrl!: string;

  @Env("DB_HOST") dbHost!: string;
  @Env("DB_PORT") dbPort!: number;
  @Env("DB_USERNAME") dbUsername!: string;
  @Env("DB_PASSWORD") dbPassword!: string;
  @Env("DB_DATABASE") dbName!: string;

}