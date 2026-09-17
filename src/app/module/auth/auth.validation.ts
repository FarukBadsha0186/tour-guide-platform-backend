import z, { email } from "zod";




const TouristRegistrationZodSchema =z.object({
	name :z.string().min(3,"Name must 3 characters long !!!").max(10),
	email:z.email("Not email"),
	password: z.string().min(8, "Password Must Minimum 8 Characters Long.")
	.regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter"),
	patient: z.object({
		contactNumber: z.string().optional(),
		age:z.string()

	}).optional()
})

const TouristEmailVerifySchema=z.object({
	email: z.email("Not email"),
	otp:z.string().length(7)
})
export const TouristValidation ={
    TouristRegistrationZodSchema ,
	TouristEmailVerifySchema,
}