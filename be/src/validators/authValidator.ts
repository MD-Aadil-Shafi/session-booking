import {email, z} from "zod";

//validateSchemaMiddleware will be used on route level

const nameSchema = (filedName: string, min:number, max: number) => z.string()
    .trim()
    .min(min, `${filedName} must be at least ${min} character long.`)
    .max(max, `${filedName} can be at most ${max} characters long.`);
    

export const registerSchema = z.object({
    firstName: nameSchema("First name", 1, 12),
    lastName: nameSchema("Last name", 1, 12),
    email: z.string().trim().email("Please provide valid email address."),
    password: z.string().trim()
        .min(6, "Password must be at least 6 characters long.")
        .max(20, "Password must be at most 20 characters long."),
    country: nameSchema("Country", 3, 60),
})

export const loginSchema = z.object({
    email: z.string().trim().email("Please provide valid email."),
    password: z.string().trim()
        .min(6, "Password must be at least 6 characters long.")
        .max(20, "Password must be at most 20 characters long.")
})