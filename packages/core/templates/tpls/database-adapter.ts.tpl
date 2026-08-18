app.addAdapter({
  dependency: [AppConfig],
  useFactory: (config: AppConfig) => {
    return new ZentifyTypeOrmAdapter({
      type: config.dbType as any,
      host: config.dbHost,
      port: config.dbPort,
      username: config.dbUsername,
      password: config.dbPassword,
      database: config.dbName,
    });
  },
});
