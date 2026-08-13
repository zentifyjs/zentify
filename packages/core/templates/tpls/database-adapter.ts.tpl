app.addAdapter(
  new ZentifyTypeOrmAdapter({
    type: "__DB_TYPE__",
    host: "localhost",
    port: __DB_PORT__,
    username: "__DB_USERNAME__",
    password: "",
    database: "zentify",
    entities: ["./Models/**/*.{ts,js}"],
    synchronize: true,
  })
);
