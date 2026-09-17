import { Role } from "../../generated/prisma/enums"
import config from "../config";
import { prisma } from "../lib/prisma"
import bcrypt from "bcryptjs";

export const  seedAdmin = async() =>{
    try {
        const isSuperAdminExist = await prisma.user.findFirst({
            where :{
                role: Role.ADMIN
            }

        });
        if(isSuperAdminExist){
            console.log(" Admin Already Exists!")
            return;

        }
        const name =config.tester_admin_name
        const email =config.tester_admin_email
        const password =config.tester_admin_password

        if(!name || !email || !password ){
            throw new Error(" Admin Name ,Email ,Password Missing in env file");
            
        }

        const hashedPassword = await bcrypt.hash(password ,Number(config.bcrypt_salt_rounds))
        
        const superAdmin =await prisma.user.create({
            data:{
                name,
                email,
                password :hashedPassword,
                role:Role.ADMIN,
                needPasswordChange:false,
                emailVerified:true
            }
        })

        console.log(" Admin Created ", superAdmin);



    } catch (error) {
        console.log("Error seeding Super Admin :", error);

        await prisma.user.delete({
            where:{
                email: config.tester_admin_email,

            }
        })

        
        
    }
}


export const  seedTesterAdmin = async() =>{
    try {
        const isSuperAdminExist = await prisma.user.findUnique({
            where :{
                email:config.tester_admin_email
            }

        });
        if(isSuperAdminExist){
            console.log("Tester Admin Already Exists!")
            return;

        }
        const name =config.tester_admin_name
        const email =config.tester_admin_email
        const password =config.tester_admin_password

        if(!name || !email || !password ){
            throw new Error("Tester Admin Name ,EMail ,Password Missing in env file");
            
        }

        const hashedPassword = await bcrypt.hash(password ,Number(config.bcrypt_salt_rounds))
        
        const testerAdmin =await prisma.user.create({
            data:{
                name,
                email,
                password :hashedPassword,
                role:Role.ADMIN,
                needPasswordChange:false,
                emailVerified:true
            }
        })

        console.log("Tester Admin Created ", testerAdmin);



    } catch (error) {
        console.log("Error seeding Super Admin :", error);

        await prisma.user.delete({
            where:{
                email: config.tester_admin_email,

            }
        })

        
        
    }
}

export const  seedTesterGuide = async() =>{
    try {
        const isTEsterDoctorExist = await prisma.user.findUnique({
            where :{
                email:config.tester_guide_email
            }

        });
        if(isTEsterDoctorExist){
            console.log("GUIDE  Already Exists!")
            return;

        }
        const name =config.tester_guide_name;
        const email =config.tester_guide_email
        const password =config.tester_guide_password

        if(!name || !email || !password ){
            throw new Error("Guide Name ,Email ,Password Missing in env file");
            
        }

        const hashedPassword = await bcrypt.hash(password ,Number(config.bcrypt_salt_rounds))
        
        const doctor =await prisma.user.create({
            data:{
                name,
                email,
                password :hashedPassword,
                role:Role.GUIDE,
                needPasswordChange:false,
                emailVerified:true
            }
        })

        console.log("Guide  Created ", doctor);



    } catch (error) {
        console.log("Error seeding Doctor  :", error);

        await prisma.user.delete({
            where:{
                email: config.tester_guide_email,

            }
        })

        
        
    }
}


export const  seedTesterTourist = async() =>{
    try {
        const isTEsterTouristExist = await prisma.user.findUnique({
            where :{
                email:config.tester_tourist_email
            }

        });
        if(isTEsterTouristExist){
            console.log("Tourist  Already Exists!")
            return;

        }
        const name =config.tester_tourist_name;
        const email =config.tester_tourist_email
        const password =config.tester_tourist_password

        if(!name || !email || !password ){
            throw new Error("Tourist Name ,Email ,Password Missing in env file");
            
        }

        const hashedPassword = await bcrypt.hash(password ,Number(config.bcrypt_salt_rounds))
        
        const tourist =await prisma.user.create({
            data:{
                name,
                email,
                password :hashedPassword,
                role:Role.TOURIST,
                needPasswordChange:false,
                emailVerified:true
            }
        })

        console.log("Guide  Created ", tourist);



    } catch (error) {
        console.log("Error seeding Tourist  :", error);

        await prisma.user.delete({
            where:{
                email: config.tester_tourist_email,

            }
        })

        
        
    }
}