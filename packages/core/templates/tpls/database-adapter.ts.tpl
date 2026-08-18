app.addAdapter({
  dependency: [AppConfig],
  useFactory: (config: AppConfig) => {
    const url = new URL(config.databaseUrl);
    return new ZentifyTypeOrmAdapter({
      type: url.protocol.replace(":", ""),
      host: url.hostname,
      port: Number(url.port) || 5432,
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      entities: ["./Models/**/*.{ts,js}"],
      synchronize: true,
    });
  },
});