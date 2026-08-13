import * as v from "valibot"

export class UserDTO {
    static schema = v.object({
        name: v.pipe(v.string(), v.trim(), v.minLength(3, "Name must be at least 3 characters long")),
        email: v.pipe(v.string(), v.email("Invalid email format"), v.trim())
    })

    name!: string
    email!: string
}
