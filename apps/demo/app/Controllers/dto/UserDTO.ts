import * as v from "valibot";

export class UserDTO {
  static schema = v.object({
    name: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(3, "Name must be at least 3 characters long"),
    ),
    email: v.pipe(v.string(), v.email("Invalid email format"), v.trim()),
    password: v.optional(
      v.pipe(
        v.string(),
        v.trim(),
        v.minLength(6, "Password must be at least 6 characters long"),
      ),
    ),
  });

  name!: string;
  email!: string;
  password?: string;
}
