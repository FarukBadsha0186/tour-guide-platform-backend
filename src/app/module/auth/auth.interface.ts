import type { Role } from "../../../generated/prisma/browser";

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IRegisterTouristPayload {
  name: string;
  email: string;
  password: string;
  role?: "TOURIST"; // Default TOURIST
  tourist?: {
    contactNumber?: string;
    address?: string;
    nationality?: string;
    dateOfBirth?: string;
  };
}


export interface IRegisterGuidePayload {
  name: string;
  email: string;
  password: string;
  role: "GUIDE"; 
  guide: {
    licenseNumber?: string;
    yearsExperience?: number;
    languages?: string[];
    baseLocation?: string;
    bio?: string;
    hourlyRate?: number;
  };
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

 export interface IGoogleLoginPayload{
	idToken: string;
  name: string;

 }


 export interface IForgotPasswprd {
	email :string;

 }


  export interface IResetPasswprd {
	email :string;
	NewPassword: string;
	otp :string;

	
 }


export interface IVerifyEmailPayload {
	
	email: string;
	otp:string;
}