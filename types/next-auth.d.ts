// types/next-auth.d.ts
import { SignInResponse } from "next-auth/react";

// Extend SignInResponse to include a message property
interface ExtendedSignInResponse extends SignInResponse {
    message?: string; // Optional message property
}
