import {PrismaClient} from "../../../generated/prisma/client";
import {passwordToken} from "../../lib/jwt";
import {sendMail} from "../../lib/mailer";


export class ForgotPasswordService {
    // connect to database
    constructor(private db: PrismaClient) {
    }

    async forgotPassword(data: {email: string}) {
        const user = await this.db.user.findUnique({where: {email: data.email}, include: {profile: true}});

        if (!user) throw new Error("USER_NOT_FOUND");

        // this variable will save the hash token after generated in passwordToken function in jwt (hash user id and email)
        const passwordResetToken = passwordToken({userId: user.id, email: user.email})

        const passwordResetUrl = `${process.env.APP_URL}/auth/verify-password-token?token=${passwordResetToken}`;
        // when APP_ENV="test" in the env file, it will not send the email, otherwise
        const isNotTest = process.env.APP_ENV !== "test";
        if(isNotTest){
            await sendMail(
                user.email,
                "Password reset",
                `
                    <p>Hello ${user.profile?.first_name},</p>
                    <p>Please reset your password by clicking the link below:</p>
                    <p><a href="${passwordResetUrl}">Reset password</a></p>
                `
            );
        }

        // create a new password reset record in the database
        try {
            await this.db.passwordReset.create({data: {userId: user.id, token: passwordResetToken}});
        } catch (error: any) {
            // if it has db issues, server error
            throw new Error("SERVER_ERROR");
        }

        return;
    }
}