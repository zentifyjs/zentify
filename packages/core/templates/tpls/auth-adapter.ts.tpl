app.addAdapter(
  new ZentifyAuthAdapter({
    defaultGuard: "web",
    passwordHasher: "bcrypt",
    guards: {
      web: {
        driver: "session",
        provider: User,
      },
    },
  }),
);