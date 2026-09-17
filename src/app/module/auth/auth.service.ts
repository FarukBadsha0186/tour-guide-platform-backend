import bcrypt from "bcryptjs";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import { AuthProvider, Role, UserStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import ejs, {} from "ejs";
import path from "path";

import type {
	IForgotPasswprd,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegisterGuidePayload,
	IRegisterTouristPayload,
	IRequestUser,
	IResetPasswprd,
	IVerifyEmailPayload,
} from "./auth.interface";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { googleClinet } from "../../lib/googleAuth";
import { email } from "zod";

import crypto from "crypto";
import { redisclient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import { configDotenv } from "dotenv";





// const registerUser = async (payload: IRegisterTouristPayload) => {
// 	const { name, password , tourist : guestData } = payload;
// 	const email = payload.email.trim().toLowerCase();

// 	const isUserExists = await prisma.user.findUnique({
// 		where: { email },
// 	});

// 	if (isUserExists) {
// 		throw new Error("User with this email already exists");
// 	}

// 	const hashedPassword = await bcrypt.hash(password, 8);

	
// 	 const expirationSeconds=5*60

// 	 const Otpkey =`tourist-registration-otp:${email}`

// 	 const otpValue = crypto.randomInt(100000,10000000).toString();

// 	 	await redisclient.set(Otpkey,otpValue,{
// 			expiration:{
// 				type :"EX",
// 				value :expirationSeconds
// 			}
// 		})

		
	
// 		const touristRegistrationKey=`tourist-registration-data:${email}`
		
//         const redisUserDataPayload ={
// 		name,
// 		email,
// 		password: hashedPassword,
// 		tourist:guestData
// 	}


// 		await redisclient.set(touristRegistrationKey,JSON.stringify(redisUserDataPayload),{
// 			expiration:{
// 				type :"EX",
// 				value :expirationSeconds
// 			}
// 		})


// 		const tempatePath = path.join(process.cwd(),"src/app/templates/registration_user_otp.ejs")
// 		const html =await ejs.renderFile(tempatePath,{
// 			name,
// 			email,
// 			otpValue,
// 			expirationMinutes:expirationSeconds/60

// 		})

// 		 await transporter.sendMail({
// 			from :config.email_sender,
// 			to:email,
// 			subject: "Email Verification",
	
// 			html
// 		 })
	


	 




// };



// const verifyTouristEmail = async (payload:IVerifyEmailPayload)=>{


// 	const otp =payload.otp;

// 	const email = payload.email.trim().toLowerCase();

// 	const isUserExists = await prisma.user.findUnique({
// 		where: { email },
// 	});
// 		if(isUserExists?.status === "BLOCKED"){
// 			throw new Error("User are blocked");
			
// 		}

// 		if(isUserExists?.emailVerified){
// 			throw new Error("User not Verified");
			
// 		}

// 		if(isUserExists?.isDeleted || isUserExists?.status === "DELETED"){
// 			throw new Error("User are Deleted");
			
// 		}
//    const Otpkey =`tourist-registration-otp:${email}`

// 		const redisOtp =await redisclient.get(Otpkey)

// 		if(!redisOtp){
// 			throw new Error("OTP not found");
			
// 		}

// 		if(redisOtp !== otp){
// 			throw new Error("Otp not matched");
			

// 		}

// 		await redisclient.del(Otpkey);

// 		const touristRegistrationKey=`tourist-registration-data:${email}`
//         const redistouristDAta =await redisclient.get(touristRegistrationKey)
// 		if(!redistouristDAta){
// 			throw new Error("Tourist doesnot Exit");
			
// 		}

// 		const touristPayload : IRegisterTouristPayload= JSON.parse(redistouristDAta)

// 	const createdUser = await prisma.user.create({
// 		data: {
// 			name :touristPayload.name,
// 			email:touristPayload.email,
// 			password: touristPayload.password,
// 			role: userRole === "GUIDE" ? Role.GUIDE : Role.TOURIST,
// 			status: UserStatus.ACTIVE,
// 			emailVerified: true,
// 			tourist: {
// 				create: {
// 					 name: touristPayload.name,
// 					 email:touristPayload.email , 
// 					 contactNumber : touristPayload?.tourist?.contactNumber || ""},
// 			},
// 		},
// 		omit: { password: true },
// 		include: { tourist: true },
// 	});

// 	await redisclient.del(touristRegistrationKey)


// 	const tempatePath = path.join(process.cwd(),"src/app/templates/tourist-welcome-email.ejs")
// 		const html =await ejs.renderFile(tempatePath,{
// 			name : createdUser.name,
			

// 		})

// 		 await transporter.sendMail({
// 			from :config.email_sender,
// 			to:email,
// 			subject: "Welcome to Tourist Service Guide ",
	
// 			html
// 		 })


	



// 	const { tourist, ...user } = createdUser;
// 	const jwtPayload = {
// 		userId: user.id,
// 		name: user.name,
// 		email: user.email,
// 		role: user.role,
// 	};

// 	const accessToken = jwtUtils.createToken(
// 		jwtPayload,
// 		config.jwt_access_secret,
// 		config.jwt_access_expires_in as SignOptions,
// 	);

// 	const refreshToken = jwtUtils.createToken(
// 		jwtPayload,
// 		config.jwt_refresh_secret,
// 		config.jwt_refresh_expires_in as SignOptions,
// 	);

// 	return {
// 		user,
// 		tourist,
// 		accessToken,
// 		refreshToken,
// 	};



// }

 const registerTourist = async (payload: IRegisterTouristPayload) => {
    const { name, password, tourist: guestData } = payload;
    const email = payload.email.trim().toLowerCase();

    // Check if user exists
    const isUserExists = await prisma.user.findUnique({
      where: { email },
    });

    if (isUserExists) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const expirationSeconds = 5 * 60;
    const otpValue = crypto.randomInt(100000, 10000000).toString();

    // Store OTP
    const Otpkey = `registration-otp:${email}`;
    await redisclient.set(Otpkey, otpValue, {
      expiration: { type: "EX", value: expirationSeconds },
    });

    // Store registration data with DEFAULT ROLE TOURIST
    const registrationKey = `registration-data:${email}`;
    const redisUserDataPayload = {
      name,
      email,
      password: hashedPassword,
      role: "TOURIST", // ✅ Default role
      tourist: guestData || {},
    };

    await redisclient.set(registrationKey, JSON.stringify(redisUserDataPayload), {
      expiration: { type: "EX", value: expirationSeconds },
    });

    // Send OTP email
    const templatePath = path.join(process.cwd(), "src/app/templates/registration_user_otp.ejs");
    const html = await ejs.renderFile(templatePath, {
      name,
      email,
      otpValue,
      expirationMinutes: expirationSeconds / 60,
    });

    await transporter.sendMail({
      from: config.email_sender,
      to: email,
      subject: "Email Verification",
      html,
    });

    return {
      success: true,
      message: "OTP sent successfully",
      email,
    };
  };




 const registerGuide = async (payload: IRegisterGuidePayload) => {
    const { name, password, guide: guideData } = payload;
    const email = payload.email.trim().toLowerCase();

    // Check if user exists
    const isUserExists = await prisma.user.findUnique({
      where: { email },
    });

    if (isUserExists) {
      throw new Error("User with this email already exists");
    }

    // Validate guide data
    // if (!guideData) {
    //   throw new Error("Guide data is required");
    // }

    const hashedPassword = await bcrypt.hash(password, 8);

    const expirationSeconds = 5 * 60;
    const otpValue = crypto.randomInt(100000, 10000000).toString();

    // Store OTP
    const Otpkey = `registration-otp:${email}`;
    await redisclient.set(Otpkey, otpValue, {
      expiration: { type: "EX", value: expirationSeconds },
    });

    // Store registration data with ROLE GUIDE
    const registrationKey = `registration-data:${email}`;
    const redisUserDataPayload = {
      name,
      email,
      password: hashedPassword,
      role: "GUIDE", // ✅ Guide role
      guide: guideData || {},
    };

    await redisclient.set(registrationKey, JSON.stringify(redisUserDataPayload), {
      expiration: { type: "EX", value: expirationSeconds },
    });

    // Send OTP email
    const templatePath = path.join(process.cwd(), "src/app/templates/registration_user_otp.ejs");
    const html = await ejs.renderFile(templatePath, {
      name,
      email,
      otpValue,
      expirationMinutes: expirationSeconds / 60,
    });

    await transporter.sendMail({
      from: config.email_sender,
      to: email,
      subject: "Email Verification - Guide Registration",
      html,
    });

    return {
      success: true,
      message: "OTP sent successfully",
      email,
    };
  };

  const verifyUserEmail = async (payload: IVerifyEmailPayload) => {
    const { otp } = payload;
    const email = payload.email.trim().toLowerCase();

    // Check if user exists
    const isUserExists = await prisma.user.findUnique({
      where: { email },
    });

    if (isUserExists?.status === "BLOCKED") {
      throw new Error("User is blocked");
    }

    if (isUserExists?.emailVerified) {
      throw new Error("User already verified");
    }

    if (isUserExists?.isDeleted || isUserExists?.status === "DELETED") {
      throw new Error("User is deleted");
    }

    // Verify OTP
    const Otpkey = `registration-otp:${email}`;
    const redisOtp = await redisclient.get(Otpkey);

    if (!redisOtp) {
      throw new Error("OTP not found");
    }

    if (redisOtp !== otp) {
      throw new Error("OTP not matched");
    }

    await redisclient.del(Otpkey);

    // Get registration data from Redis
    const registrationKey = `registration-data:${email}`;
    const redisData = await redisclient.get(registrationKey);

    if (!redisData) {
      throw new Error("Registration data not found");
    }

    const userPayload = JSON.parse(redisData);
    const userRole = userPayload.role || "TOURIST";

    let createdUser;

 

    if (userRole === "GUIDE") {
      createdUser = await prisma.user.create({
        data: {
          name: userPayload.name,
          email: userPayload.email,
          password: userPayload.password,
          role: Role.GUIDE,
          status: UserStatus.PENDING,
          emailVerified: true,
          guide: {
            create: {
              licenseNumber: userPayload.guide?.licenseNumber || "PENDING",
              yearsExperience: userPayload.guide?.yearsExperience || 0,
              languages: userPayload.guide?.languages || [],
              baseLocation: userPayload.guide?.baseLocation || "",
              bio: userPayload.guide?.bio || "",
              hourlyRate: userPayload.guide?.hourlyRate || null,
              isApproved: false, // Admin approval pending
            },
          },
        },
        omit: { password: true },
        include: { guide: true },
      });
    } else {
      // ===== CREATE TOURIST USER =====
      createdUser = await prisma.user.create({
        data: {
          name: userPayload.name,
          email: userPayload.email,
          password: userPayload.password,
          role: Role.TOURIST,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          tourist: {
            create: {
              contactNumber: userPayload.tourist?.contactNumber || "",
              address: userPayload.tourist?.address || "",
              nationality: userPayload.tourist?.nationality || "",
              dateOfBirth: userPayload.tourist?.dateOfBirth
                ? new Date(userPayload.tourist.dateOfBirth)
                : null,
            },
          },
        },
        omit: { password: true },
        include: { tourist: true },
      });
    }

    // Clean up Redis
    await redisclient.del(registrationKey);

    // Send Welcome Email (skip if fails)
    try {
      const templatePath = path.join(process.cwd(), "src/app/templates/tourist-welcome-email.ejs");
      const html = await ejs.renderFile(templatePath, {
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
      });

      await transporter.sendMail({
        from: config.email_sender,
        to: email,
        subject: "Welcome to Tour Guide Platform",
        html,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }


	const jwtPayload = {
  userId: createdUser.id,
  name: createdUser.name,
  email: createdUser.email,
  role: createdUser.role,
};
    const accessToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions
    );

    return {
      success: true,
      message: "Email verified successfully",
      tourist: userRole === "TOURIST" ,
      guide: userRole === "GUIDE" ,
      accessToken,
      refreshToken,
    };
  };




const loginUser = async (payload: ILoginUserPayload) => {
	const { password } = payload;
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new Error("User not found");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new Error("User is blocked");
	}

	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new Error("User is deleted");

	}

	if (user.status === UserStatus.PENDING) {
  throw new Error("Your account is pending approval. Please wait for admin approval.");
}

	if (user.password === null && user.googleId !== null){
		throw new Error("User already Has Account Registerd With Google .Try to login with Google");
		
	}

	const isPasswordMatched = await bcrypt.compare(password, user.password as string);

	if (!isPasswordMatched) {
		throw new Error("Invalid credentials");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
		role:user.role,
	};
};

const getMe = async (user: IRequestUser) => {
	const isUserExists = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			tourist: true,
		},
		omit: {
			password: true,
		},
	});

	if (!isUserExists) {
		throw new Error("User not found");
	}

	return isUserExists;
};

const refreshToken = async (token: string) => {
	const verifiedRefreshToken = jwtUtils.verifyToken(
		token,
		config.jwt_refresh_secret,
	);

	if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
		throw new Error(
			config.node_env === "development"
				? verifiedRefreshToken.error
				: "Invalid refresh token",
		);
	}

	const data = verifiedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: { id: data.userId },
	});

	if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
		throw new Error("User is inactive or not found");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

 const googleLogin = async ( payload: IGoogleLoginPayload) =>{

	let  googleIdTOkenPayload :TokenPayload |null |undefined =null;

	try {
		const ticket= await googleClinet.verifyIdToken({
			idToken : payload.idToken,
			audience: config.google_client_id
		})

		googleIdTOkenPayload =ticket.getPayload()
	} catch(error){
		console.log("Google ID Token verfication Failed");
		throw new Error("Invalid or Expired Google ID token");
		

	}

	if (!googleIdTOkenPayload?.email){
		throw new Error("Invalid or email not found");
		
	}
	if (!googleIdTOkenPayload.name){
		throw new Error("Invalid  name are not found");
		
	}

	googleIdTOkenPayload.sub
	const ifTouristExiswithGoogleAuth = await prisma.user.findUnique({
		where :{
			email : googleIdTOkenPayload.email,
			role: Role.TOURIST,
			googleId :googleIdTOkenPayload.sub
		}
	})

	let user =ifTouristExiswithGoogleAuth ;
	if (!ifTouristExiswithGoogleAuth){

		const ifTouristExiswithCredentials = await prisma.user.findUnique({
			where :{
				email :googleIdTOkenPayload.email,
				role : Role.TOURIST,
				authProvider : AuthProvider.CREDENTIAL,
			}
		})

		if (ifTouristExiswithCredentials){
if (!ifTouristExiswithCredentials.emailVerified){
	throw new Error("User not Verified");
	
}


			if (ifTouristExiswithCredentials.status=== UserStatus.BLOCKED){
				throw new Error("User is Blocked");
				
			}
			if ( ifTouristExiswithCredentials.isDeleted ||ifTouristExiswithCredentials.status === UserStatus.DELETED){
				throw new Error("User is Deleted");
				
			}
			user = await prisma.user.update({
				where :{
					id : ifTouristExiswithCredentials.id,

				},
				data: {
					googleId: googleIdTOkenPayload.sub
				}
			})

		}
		else{
			//Google Register
				user= await prisma.user.create({
			data:{
				name: googleIdTOkenPayload.name,
				email: googleIdTOkenPayload.email,
				status: UserStatus.PENDING,
				role: Role.TOURIST,
				googleId : googleIdTOkenPayload.sub,
				authProvider : AuthProvider.GOOGLE,
				emailVerified: true,
				tourist :{
					create :{
						name : googleIdTOkenPayload.name,
						email : googleIdTOkenPayload.email,
					}
				}
				

			}
		})

		const tempatePath = path.join(process.cwd(),"src/app/templates/patient-welcome-email.ejs")
		const html =await ejs.renderFile(tempatePath,{
			name : user.name,
			

		})

		 await transporter.sendMail({
			from :config.email_sender,
			to:user.email,
			subject: "Welcome tO Tourist System Guide ",
	
			html
		 })
		}


		
	}


	if(!user){
		throw new Error("User not found");
		
	}
	if(user.status ===UserStatus.BLOCKED){
		throw new Error("User not found");
		
	}
	
	if(user.isDeleted ||user.status ===UserStatus.DELETED){
		throw new Error("User not found");
		
	}

	


	
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
	
	

	}




	const forgotPassword= async(payload: IForgotPasswprd)=>{
		const {email} =payload;
		
		const IsExitUser =  await prisma.user.findUnique({
			where :{
				email
			}
		});

		if(!IsExitUser){
			throw new Error("USer not Exist");
			
		}
		if(IsExitUser.status === "BLOCKED"){
			throw new Error("User are blocked");
			
		}

		if(!IsExitUser.emailVerified){
			throw new Error("User not Verified");
			
		}

		if(IsExitUser.isDeleted || IsExitUser.status === "DELETED"){
			throw new Error("User are Deleted");
			
		}
		if ( IsExitUser.googleId && IsExitUser.authProvider === 'GOOGLE'){
			throw new Error("User has Account with Googles");
			
		}


		const otp = crypto.randomInt(100000,10000000).toString();

		const key =`forgot-password-otp:${IsExitUser.email}`

		await redisclient.set(key,otp,{
			expiration:{
				type :"EX",
				value :5*60
			}
		})

		const tempatePath = path.join(process.cwd(),"src/app/templates/forgotpassword.ejs")
		const html =await ejs.renderFile(tempatePath,{
			name: IsExitUser.name,
			otp,
			expirationMinutes:300/60

		})

		 await transporter.sendMail({
			from :config.email_sender,
			to:IsExitUser.email,
			subject: "Forget Password",
			//text: `Your OTP is ${otp}`
			html
		 })





	}


	const resetPassword= async (payload:IResetPasswprd)=>{

        const {email , otp, NewPassword} =payload;
		
		const IsExitUser =  await prisma.user.findUnique({
			where :{
				email
			}
		});

		if(!IsExitUser){
			throw new Error("USer not Exist");
			
		}
		if(IsExitUser.status === "BLOCKED"){
			throw new Error("User are blocked");
			
		}

		if(!IsExitUser.emailVerified){
			throw new Error("User not Verified");
			
		}

		if(IsExitUser.isDeleted || IsExitUser.status === "DELETED"){
			throw new Error("User are Deleted");
			
		}
		if ( IsExitUser.googleId && IsExitUser.authProvider === 'GOOGLE'){
			throw new Error("User has Account with Googles");
			
		}

		const key =`forgot-password-otp:${IsExitUser.email}`

		const redisOtp =await redisclient.get(key)

		if(!redisOtp){
			throw new Error("OTP not found");
			
		}

		if(redisOtp !== otp){
			throw new Error("Otp not matched");
			

		}

		const  hashedNewPassword =await bcrypt.hash(NewPassword, Number(config.bcrypt_salt_rounds));

		await prisma.user.update({
			where :{
				email : IsExitUser.email
			},
			data:{
				password:hashedNewPassword
			}
		});

		await redisclient.del([key])

		const tempatePath = path.join(process.cwd(),"src/app/templates/reset_password_success.ejs")
		const html =await ejs.renderFile(tempatePath,{
			name: IsExitUser.name,
			

		})

		 await transporter.sendMail({
			from :config.email_sender,
			to:IsExitUser.email,
			subject: "Forget Password",
			//text: `Your OTP is ${otp}`
			html
		 })


		



	}





	
 



export const AuthService = {
	registerTourist,
	registerGuide,
	verifyUserEmail,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword
};
