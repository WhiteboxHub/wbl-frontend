// // import GoogleProvider from "next-auth/providers/google";
// // import NextAuth, { NextAuthOptions } from "next-auth";
// // import axios from "axios";

// // import GoogleProvider from "next-auth/providers/google";
// // import GoogleProvider from "next-auth/providers/google";
// // import GoogleProvider from "next-auth/providers/google";
// // import NextAuth, { NextAuthOptions } from "next-auth";
// // import axios from "axios";
// // import axios from "axios";
// // import axios from "axios";
// // import axios from "axios";
// // import { NextAuthOptions } from "next-auth";
// // import { NextAuthOptions } from "next-auth";

// // import GoogleProvider from "next-auth/providers/google";

// // import NextAuth, { NextAuthOptions, Session } from "next-auth";



// // // frntend/app/api/auth/[...nextauth]/route.ts
// // import NextAuth, { NextAuthOptions, Session } from "next-auth";
// // import GoogleProvider from "next-auth/providers/google";
// // import axios from "axios";

// // // Extend the JWT type to include status and accessToken
// // declare module "next-auth/jwt" {
// //   interface JWT {
// //     id: string;
// //     name?: string;
// //     email?: string;
// //     status?: string;
// //     accessToken?: string;
// //   }
// // }

// // // Extend the Session type to include the id and status properties
// // declare module "next-auth" {
// //   interface Session {
// //     user: {
// //       id: string;
// //       name?: string;
// //       email?: string;
// //       image?: string;
// //       status?: string;
// //     };
// //     accessToken?: string;
// //   }
// // }

// // const authOptions: NextAuthOptions = {
// //   providers: [
// //     GoogleProvider({
// //       clientId: process.env.GOOGLE_CLIENT_ID as string,
// //       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
// //     }),
// //   ],
// //   pages: {
// //     error: '/auth/error', // Custom error page for better UX on errors
// //   },
// //   callbacks: {
// //     async jwt({ token, user }) {
// //       if (user) {
// //         console.log("User in jwt callback:", user);

// //         try {
// //           // Call register or login based on the user status
// //           const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);

// //           // Attach the access token and status to the JWT token
// //           if (accessToken) {
// //             token.accessToken = accessToken;
// //           }
// //           token.id = user.id;
// //           token.name = user.name;
// //           token.email = user.email;
// //           token.status = status; // Attach user status (inactive, active, etc.)

// //           console.log("JWT callback - Token after processing:", token);
// //           console.log("----------------Status message:", message);
// //         } catch (error) {
// //           console.error("---------------------------Error in jwt callback during user handling:", error);
// //           token.error = "---------------------------Error during registration/login handling";
// //         }
// //       }
// //       return token;
// //     },
// //     async session({ session, token }) {
// //       console.log("Token in session callback:", token);

// //       session.user.id = token.id as string;
// //       session.user.name = token.name as string;
// //       session.user.email = token.email as string;
// //       session.accessToken = token.accessToken as string;
// //       session.user.status = token.status;

// //       console.log("---------------------------Session in session callback:", session);

// //       return session;
// //     },
// //   },
// //   debug: true, // Enable debug mode for detailed logs
// //   secret: process.env.NEXTAUTH_SECRET as string,
// // };

// // const handler = NextAuth(authOptions);
// // export { handler as GET, handler as POST };

// // // Function to handle user registration or login
// // async function handleUserRegistrationOrLogin(user: any) {
// //   const payload = {
// //     email: user.email,
// //     name: user.name,
// //     google_id: user.id,
// //   };

// //   try {
// //     const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);

// //     if (!checkResponse.data.exists) {
// //       // If the user does not exist, register them
// //       const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
// //       return {
// //         accessToken: null,
// //         status: 'registered',
// //         message: registerResponse.data.message // Include message from response
// //       };
// //     } else if (checkResponse.data.status === "active") {
// //       // If the user exists and is active, log in
// //       const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
// //       return { accessToken: loginResponse.data.access_token, status: 'active' };
// //     } else {
// //       // If user exists but is inactive
// //       return { accessToken: null, status: 'inactive' };
// //     }
// //   } catch (error) {
// //     console.error("---------------------------Error during registration/login operation:", error.response?.data.detail || error.message);
// //     return { accessToken: null, status: 'error' };
// //   }
// // }


// // // import NextAuth, { NextAuthOptions, Session } from "next-auth";
// // // import GoogleProvider from "next-auth/providers/google";
// // // import axios from "axios";

// // // // Extend the JWT type to include status and accessToken
// // // declare module "next-auth/jwt" {
// // //   interface JWT {
// // //     id: string;
// // //     name?: string;
// // //     email?: string;
// // //     status?: string;
// // //     accessToken?: string;
// // //     error?: string;
// // //   }
// // // }

// // // // Extend the Session type to include the id and status properties
// // // declare module "next-auth" {
// // //   interface Session {
// // //     user: {
// // //       id: string;
// // //       name?: string;
// // //       email?: string;
// // //       image?: string;
// // //       status?: string;
// // //     };
// // //     accessToken?: string;
// // //     error?: string;
// // //   }
// // // }

// // // const authOptions: NextAuthOptions = {
// // //   providers: [
// // //     GoogleProvider({
// // //       clientId: process.env.GOOGLE_CLIENT_ID as string,
// // //       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
// // //     }),
// // //   ],
// // //   pages: {
// // //     error: '/auth/error', // Custom error page for better UX on errors
// // //   },
// // //   callbacks: {
    
// // //     async jwt({ token, user }) {
// // //       if (user) {
// // //         try {
// // //           // Register or login user
// // //           const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);
    
// // //           // Assign token details
// // //           token.id = user.id;
// // //           token.name = user.name;
// // //           token.email = user.email;
// // //           token.status = status;
// // //           token.accessToken = accessToken;
    
// // //           // If status is inactive or error, throw an error to trigger redirection
// // //           if (status === "inactive") {
// // //             throw new Error(message || "Your account is inactive.");
// // //           } else if (status === "error") {
// // //             throw new Error(message || "Error during authentication.");
// // //           }
// // //         } catch (error) {
// // //           console.error("JWT callback error:", error);
// // //           token.error = error.message || "Unknown error during authentication.";
// // //         }
// // //       }
// // //       return token;
// // //     },
// // //     async session({ session, token }) {
// // //       session.user.id = token.id as string;
// // //       session.user.name = token.name as string;
// // //       session.user.email = token.email as string;
// // //       session.accessToken = token.accessToken as string;
// // //       session.user.status = token.status;
// // //       session.error = token.error;

// // //       // console.log("Session in session callback:", session);

// // //       return session;
// // //     },
// // //   },
// // //   debug: true, // Enable debug mode for detailed logs
// // //   secret: process.env.NEXTAUTH_SECRET as string,
// // // };

// // // const handler = NextAuth(authOptions);
// // // export { handler as GET, handler as POST };

// // // async function handleUserRegistrationOrLogin(user: any) {
// // //   const payload = {
// // //     email: user.email,
// // //     name: user.name,
// // //     google_id: user.id,
// // //   };

// // //   try {
// // //     // Check if the user exists
// // //     const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);

// // //     if (!checkResponse.data.exists) {
// // //       // Register new user if they don't exist
// // //       const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
// // //       return {
// // //         accessToken: null,
// // //         status: 'registered',
// // //         message: registerResponse.data.message || "User successfully registered",
// // //       };
// // //     } else if (checkResponse.data.status === "active") {
// // //       // Login active users
// // //       const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
// // //       return {
// // //         accessToken: loginResponse.data.access_token,
// // //         status: 'active',
// // //       };
// // //     } else {
// // //       // Handle inactive users
// // //       return {
// // //         accessToken: null,
// // //         status: 'inactive',
// // //         message: "Your account is inactive. Please contact support.",
// // //       };
// // //     }
// // //   } catch (error) {
// // //     // Log detailed error for debugging
// // //     console.error("Error during user registration/login:", error.response?.data || error.message);
// // //     return { accessToken: null, status: 'error', message: "An error occurred during authentication." };
// // //   }
// // // }

// // // // Utility function to check if the token is expired
// // // function isTokenExpired(token: string): boolean {
// // //   const decoded = parseJwt(token);
// // //   if (!decoded || !decoded.exp) return true;
// // //   return decoded.exp * 1000 < Date.now();
// // // }

// // // // Function to decode the JWT token and parse its payload
// // // function parseJwt(token: string) {
// // //   try {
// // //     return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
// // //   } catch (e) {
// // //     // console.error("Failed to parse JWT:", e);
// // //     return null;
// // //   }
// // // }

// // // // Dummy function to refresh an access token (replace with actual API call)
// // // async function refreshAccessToken(token: string) {
// // //   // console.log("Refreshing access token...");
// // //   // Make your API call to refresh the token here
// // //   return "newAccessToken";
// // // }


// // // import NextAuth, { NextAuthOptions, Session } from "next-auth";
// // // import GoogleProvider from "next-auth/providers/google";
// // // import axios from "axios";

// // // // Extend the JWT type to include status and accessToken
// // // declare module "next-auth/jwt" {
// // //   interface JWT {
// // //     id: string;
// // //     name?: string;
// // //     email?: string;
// // //     status?: string;
// // //     accessToken?: string;
// // //     error?: string;
// // //   }
// // // }

// // // // Extend the Session type to include the id and status properties
// // // declare module "next-auth" {
// // //   interface Session {
// // //     user: {
// // //       id: string;
// // //       name?: string;
// // //       email?: string;
// // //       image?: string;
// // //       status?: string;
// // //     };
// // //     accessToken?: string;
// // //     error?: string;
// // //   }
// // // }

// // // const authOptions: NextAuthOptions = {
// // //   providers: [
// // //     GoogleProvider({
// // //       clientId: process.env.GOOGLE_CLIENT_ID as string,
// // //       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
// // //     }),
// // //   ],
// // //   pages: {
// // //     error: '/auth/error', // Custom error page
// // //   },
// // //   callbacks: {
// // //     async jwt({ token, user }) {
// // //       if (user) {
// // //         try {
// // //           // Call backend to handle user registration or login
// // //           const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);

// // //           // Assign token details
// // //           token.id = user.id;
// // //           token.name = user.name;
// // //           token.email = user.email;
// // //           token.status = status || "unknown";
// // //           token.accessToken = accessToken;

// // //           // Handle inactive or error statuses gracefully
// // //           if (status === "inactive") {
// // //             token.error = message || "Your account is inactive.";
// // //           } else if (status === "error") {
// // //             token.error = message || "Error during authentication.";
// // //           }
// // //         } catch (error) {
// // //           console.error("JWT callback error:", error);
// // //           token.error = "Unexpected error during authentication.";
// // //         }
// // //       }
// // //       return token;
// // //     },
// // //     async session({ session, token }) {
// // //       session.user.id = token.id as string;
// // //       session.user.name = token.name as string;
// // //       session.user.email = token.email as string;
// // //       session.accessToken = token.accessToken as string;
// // //       session.user.status = token.status;
// // //       session.error = token.error || null; // Include error details, if any

// // //       return session;
// // //     },
// // //     async redirect({ url, baseUrl }) {
// // //       // Redirect to the specified URL or default to the home page
// // //       if (url.startsWith(baseUrl)) {
// // //         return url;
// // //       }
// // //       return baseUrl;
// // //     },
// // //   },
// // //   debug: true, // Enable debug mode for detailed logs
// // //   secret: process.env.NEXTAUTH_SECRET as string,
// // // };

// // // const handler = NextAuth(authOptions);
// // // export { handler as GET, handler as POST };

// // // // Backend communication for registration or login
// // // async function handleUserRegistrationOrLogin(user: any) {
// // //   const payload = {
// // //     email: user.email,
// // //     name: user.name,
// // //     google_id: user.id,
// // //   };

// // //   try {
// // //     // Check if the user exists
// // //     const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);

// // //     if (!checkResponse.data.exists) {
// // //       // Register new user
// // //       const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
// // //       return {
// // //         accessToken: null,
// // //         status: 'registered',
// // //         message: registerResponse.data.message || "User successfully registered",
// // //       };
// // //     } else if (checkResponse.data.status === "active") {
// // //       // Login active users
// // //       const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
// // //       return {
// // //         accessToken: loginResponse.data.access_token,
// // //         status: 'active',
// // //       };
// // //     } else {
// // //       // Handle inactive users
// // //       return {
// // //         accessToken: null,
// // //         status: 'inactive',
// // //         message: "Your account is inactive. Please contact support.",
// // //       };
// // //     }
// // //   } catch (error) {
// // //     console.error("Error during user registration/login:", error.response?.data || error.message);
// // //     return { accessToken: null, status: 'error', message: "An error occurred during authentication." };
// // //   }
// // // }

// // // // Utility function to decode JWT token
// // // function parseJwt(token: string) {
// // //   try {
// // //     return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
// // //   } catch (e) {
// // //     return null;
// // //   }
// // // }

// // // // Dummy function to refresh an access token
// // // async function refreshAccessToken(token: string) {
// // //   // Make your API call to refresh the token here
// // //   return "newAccessToken";
// // // }

// // -----------------*************************------------dazling------------------************************************

// // frntend/app/api/auth/[...nextauth]/route.ts
// // import NextAuth, { NextAuthOptions, Session } from "next-auth";
// // import GoogleProvider from "next-auth/providers/google";
// // import axios from "axios";

// // // Extend the JWT type to include status and accessToken
// // declare module "next-auth/jwt" {
// //   interface JWT {
// //     id: string;
// //     name?: string;
// //     email?: string;
// //     status?: string;
// //     accessToken?: string;
// //   }
// // }

// // // Extend the Session type to include the id and status properties
// // declare module "next-auth" {
// //   interface Session {
// //     user: {
// //       id: string;
// //       name?: string;
// //       email?: string;
// //       image?: string;
// //       status?: string;
// //     };
// //     accessToken?: string;
// //   }
// // }

// // const authOptions: NextAuthOptions = {
// //   providers: [
// //     GoogleProvider({
// //       clientId: process.env.GOOGLE_CLIENT_ID as string,
// //       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
// //     }),
// //   ],
// //   pages: {
// //     error: '/auth/error', // Custom error page for better UX on errors
// //   },
// //   callbacks: {
// //     async jwt({ token, user }) {
// //       if (user) {
// //         console.log("User in jwt callback:", user);

// //         try {
// //           // Call register or login based on the user status
// //           const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);

// //           // Attach the access token and status to the JWT token
// //           if (accessToken) {
// //             token.accessToken = accessToken;
// //           }
// //           token.id = user.id;
// //           token.name = user.name;
// //           token.email = user.email;
// //           token.status = status; // Attach user status (inactive, active, etc.)

// //           console.log("JWT callback - Token after processing:", token);
// //           console.log("----------------Status message:", message);
// //         } catch (error) {
// //           console.error("---------------------------Error in jwt callback during user handling:", error);
// //           token.error = "---------------------------Error during registration/login handling";
// //         }
// //       }
// //       return token;
// //     },
// //     async session({ session, token }) {
// //       console.log("Token in session callback:", token);

// //       session.user.id = token.id as string;
// //       session.user.name = token.name as string;
// //       session.user.email = token.email as string;
// //       session.accessToken = token.accessToken as string;
// //       session.user.status = token.status;

// //       console.log("---------------------------Session in session callback:", session);

// //       return session;
// //     },
// //   },
// //   debug: true, // Enable debug mode for detailed logs
// //   secret: process.env.NEXTAUTH_SECRET as string,
// // };

// // const handler = NextAuth(authOptions);
// // export { handler as GET, handler as POST };

// // // Function to handle user registration or login
// // async function handleUserRegistrationOrLogin(user: any) {
// //   const payload = {
// //     email: user.email,
// //     name: user.name,
// //     google_id: user.id,
// //   };

// //   try {
// //     const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);

// //     if (!checkResponse.data.exists) {
// //       // If the user does not exist, register them
// //       const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
// //       return {
// //         accessToken: null,
// //         status: 'registered',
// //         message: registerResponse.data.message // Include message from response
// //       };
// //     } else if (checkResponse.data.status === "active") {
// //       // If the user exists and is active, log in
// //       const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
// //       return { accessToken: loginResponse.data.access_token, status: 'active' };
// //     } else {
// //       // If user exists but is inactive
// //       return { accessToken: null, status: 'inactive' };
// //     }
// //   } catch (error) {
// //     console.error("---------------------------Error during registration/login operation:", error.response?.data.detail || error.message);
// //     return { accessToken: null, status: 'error' };
// //   }
// // }


// // ----------------------------------*******************dazling spring-*************************------------------------------




// // import NextAuth, { NextAuthOptions, Session } from "next-auth";
// // import GoogleProvider from "next-auth/providers/google";
// // import axios from "axios";

// // // Extend the JWT type to include status and accessToken
// // declare module "next-auth/jwt" {
// //   interface JWT {
// //     id: string;
// //     name?: string;
// //     email?: string;
// //     status?: string;
// //     accessToken?: string;
// //   }
// // }

// // // Extend the Session type to include the id and status properties
// // declare module "next-auth" {
// //   interface Session {
// //     user: {
// //       id: string;
// //       name?: string;
// //       email?: string;
// //       image?: string;
// //       status?: string;
// //     };
// //     accessToken?: string;
// //   }
// // }

// // const authOptions: NextAuthOptions = {
// //   providers: [
// //     GoogleProvider({
// //       clientId: process.env.GOOGLE_CLIENT_ID as string,
// //       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
// //     }),
// //   ],
// //   pages: {
// //     error: '/auth/error', // Custom error page for better UX on errors
// //   },
// //   callbacks: {
// //     async jwt({ token, user, account, profile, isNewUser }) {
// //       if (user) {
// //         console.log("User in jwt callback:", user);

// //         try {
// //           const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);
// //           if (accessToken) {
// //             token.accessToken = accessToken;
// //           }
// //           token.id = user.id;
// //           token.name = user.name;
// //           token.email = user.email;
// //           token.status = status;
// //           console.log("JWT callback - Token after processing:", token);
// //           console.log("Status message:", message);
// //         } catch (error) {
// //           console.error("Error in jwt callback during user handling:", error);
// //           token.error = "Error during registration/login handling";
// //         }
// //       }
// //       return token;
// //     },
// //     async session({ session, token }) {
// //       console.log("Token in session callback:", token);

// //       session.user.id = token.id as string;
// //       session.user.name = token.name as string;
// //       session.user.email = token.email as string;
// //       session.accessToken = token.accessToken as string;
// //       session.user.status = token.status;

// //       console.log("Session in session callback:", session);

// //       return session;
// //     },
// //   },
// //   debug: true, // Enable debug mode for detailed logs
// //   secret: process.env.NEXTAUTH_SECRET as string,
// // };

// // const handler = NextAuth(authOptions);
// // export { handler as GET, handler as POST };

// // // Function to handle user registration or login
// // async function handleUserRegistrationOrLogin(user: any) {
// //   const payload = {
// //     email: user.email,
// //     name: user.name,
// //     google_id: user.id,
// //   };

// //   const maxRetries = 3;
// //   let retries = 0;

// //   while (retries < maxRetries) {
// //     try {
// //       const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);
// //       console.log("Check user response:", checkResponse.data);

// //       if (!checkResponse.data.exists) {
// //         const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
// //         console.log("Register user response:", registerResponse.data);
// //         return {
// //           accessToken: null,
// //           status: 'registered',
// //           message: registerResponse.data.message
// //         };
// //       } else if (checkResponse.data.status === "active") {
// //         const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
// //         console.log("Login user response:", loginResponse.data);
// //         return { accessToken: loginResponse.data.access_token, status: 'active' };
// //       } else {
// //         return { accessToken: null, status: 'inactive' };
// //       }
// //     } catch (error) {
// //       console.error("Error during registration/login operation:", error.response?.data.detail || error.message);
// //       retries++;
// //       if (retries >= maxRetries) {
// //         return { accessToken: null, status: 'error' };
// //       }
// //       console.log(`Retrying... (${retries}/${maxRetries})`);
// //     }
// //   }
// // }

// // import GoogleProvider from "next-auth/providers/google";


// // Extend the JWT type to include status and accessToken
// // declare module "next-auth/jwt" {
// //   interface JWT {
// //     id: string;
// //     name?: string;
// //     email?: string;
// //     status?: string;
// //     accessToken?: string;
// //   }
// // }

// // // Extend the Session type to include the id and status properties
// // declare module "next-auth" {
// //   interface Session {
// //     user: {
// //       id: string;
// // // import axios from "axios";
// //       retries++;
// //     id: string;
// //     name?: string;
// //     email?: string;
// //     status?: string;
// //     accessToken?: string;
// //   }
// // }

// // // Extend the Session type to include the id and status properties
// // declare module "next-auth" {
// //   interface Session {
// //     user: {
// //       id: string;
// //       name?: string;
// //       email?: string;
// //       image?: string;
// //       status?: string;
// //     };
// //     accessToken?: string;
// //   }
// // }

// // const authOptions: NextAuthOptions = {
// //   providers: [
// //     GoogleProvider({
// //       clientId: process.env.GOOGLE_CLIENT_ID as string,
// //       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
// //     }),
// //   ],
// //   pages: {
// //     error: '/auth/error', // Custom error page for better UX on errors
// //   },
// //   callbacks: {
// //     async jwt({ token, user, account, profile, isNewUser }) {
// //       if (user) {
// //         console.log("User in jwt callback:", user);

// //         try {
// //           const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);
// //           if (accessToken) {
// //             token.accessToken = accessToken;
// //           }
// //           token.id = user.id;
// //           token.name = user.name;
// //           token.email = user.email;
// //           token.status = status;
// //           console.log("JWT callback - Token after processing:", token);
// //           console.log("Status message:", message);
// //         } catch (error) {
// //           console.error("Error in jwt callback during user handling:", error);
// //           token.error = "Error during registration/login handling";
// //         }
// //       }
// //       return token;
// //     },
// //     async session({ session, token }) {
// //       console.log("Token in session callback:", token);

// //       session.user.id = token.id as string;
// //       session.user.name = token.name as string;
// //       session.user.email = token.email as string;
// //       session.accessToken = token.accessToken as string;
// //       session.user.status = token.status;

// //       console.log("Session in session callback:", session);

// //       return session;
// //     },
// //   },
// //   debug: true, // Enable debug mode for detailed logs
// //   secret: process.env.NEXTAUTH_SECRET as string,
// // };

// // const handler = NextAuth(authOptions);
// // export { handler as GET, handler as POST };

// // async function handleUserRegistrationOrLogin(user: any) {
// //   const payload = {
// //     email: user.email,
// //     name: user.name,
// //     google_id: user.id,
// //   };

// //   try {
// //     // First, check if user exists
// //     const checkResponse = await axios.post(
// //       `${process.env.NEXT_PUBLIC_API_URL}/check_user/`,
// //       payload
// //     );

// //     if (!checkResponse.data.exists) {
// //       // User doesn't exist, try to register
// //       const registerResponse = await axios.post(
// //         `${process.env.NEXT_PUBLIC_API_URL}/google_users/`,
// //         payload
// //       );

// //       if (registerResponse.data.status === "pending") {
// //         return {
// //           accessToken: null,
// //           status: "pending",
// //           message: "Registration successful. Waiting for admin approval.",
// //         };
// //       }

// //       // If registration returns an access token, user was auto-activated
// //       if (registerResponse.data.access_token) {
// //         return {
// //           accessToken: registerResponse.data.access_token,
// //           status: "active",
// //           message: "Registration and login successful",
// //         };
// //       }
// //     } else {
// //       // User exists, try to login
// //       const loginResponse = await axios.post(
// //         `${process.env.NEXT_PUBLIC_API_URL}/google_login/`,
// //         payload
// //       );

// //       if (loginResponse.data.status === "inactive") {
// //         return {
// //           accessToken: null,
// //           status: "inactive",
// //           message: "Account inactive. Please contact admin.",
// //         };
// //       }

// //       if (loginResponse.data.access_token) {
// //         return {
// //           accessToken: loginResponse.data.access_token,
// //           status: "active",
// //           message: "Login successful",
// //         };
// //       }
// //     }

// //     throw new Error("Unexpected response from server");
// //   } catch (error) {
// //     console.error("Error during authentication:", error);
// //     throw new Error(
// //       error.response?.data?.detail || "An error occurred during authentication"
// //     );
// //   }
// // }

// // const authOptions: NextAuthOptions = {
// //   providers: [
// //     GoogleProvider({
// //       clientId: process.env.GOOGLE_CLIENT_ID as string,
// //       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
// //     }),
// //   ],
// //   pages: {
// //     error: '/auth/error',
// //     signIn: '/auth/signin',
// //   },
// //   callbacks: {
// //     async signIn({ user, account }) {
// //       try {
// //         const result = await handleUserRegistrationOrLogin(user);
        
// //         if (result.status === "active") {
// //           return true;
// //         }
        
// //         // Store the status message in the account object to access it later
// //         account.error = result.message;
// //         return `/auth/status?message=${encodeURIComponent(result.message)}`;
// //       } catch (error) {
// //         console.error("Sign-in error:", error);
// //         return `/auth/error?error=${encodeURIComponent(error.message)}`;
// //       }
// //     },
// //     async jwt({ token, user, account }) {
// //       if (user) {
// //         try {
// //           const result = await handleUserRegistrationOrLogin(user);
// //           token.accessToken = result.accessToken;
// //           token.status = result.status;
// //           token.id = user.id;
// //           token.name = user.name;
// //           token.email = user.email;
// //         } catch (error) {
// //           console.error("JWT callback error:", error);
// //           token.error = error.message;
// //         }
// //       }
// //       return token;
// //     },
// //     async session({ session, token }) {
// //       session.user.id = token.id as string;
// //       session.user.name = token.name as string;
// //       session.user.email = token.email as string;
// //       session.accessToken = token.accessToken as string;
// //       session.user.status = token.status as string;
// //       return session;
// //     },
// //   },
// //   debug: process.env.NODE_ENV === 'development',
// //   secret: process.env.NEXTAUTH_SECRET,
// // };



// // import GoogleProvider from "next-auth/providers/google";
// // import NextAuth, { NextAuthOptions } from "next-auth";
// // import axios from "axios";
// // import winston from "winston";

// // // Step 1: Set up Winston logger
// // const logger = winston.createLogger({
// //   level: 'info', // Log level (info, warn, error, etc.)
// //   format: winston.format.combine(
// //     winston.format.timestamp(), // Add a timestamp
// //     winston.format.json() // Log in JSON format
// //   ),
// //   transports: [
// //     // Log to the console
// //     new winston.transports.Console(),
// //     // Log to a file
// //     new winston.transports.File({ 
// //       filename: 'all-logs.log', // All logs will go to this file
// //       level: 'info', // Log level for the file
// //     })
// //   ]
// // });



// // // Type declarations
// // declare module "next-auth/jwt" {
// //   interface JWT {
// //     id: string;
// //     name?: string;
// //     email?: string;
// //     status?: string;
// //     accessToken?: string;
// //     error?: string;
// //   }
// // }

// // declare module "next-auth" {
// //   interface Session {
// //     user: {
// //       id: string;
// //       name?: string;
// //       email?: string;
// //       image?: string;
// //       status?: string;
// //     };
// //     accessToken?: string;
// //     error?: string;
// //   }
// // }

// // const authOptions: NextAuthOptions = {
// //   providers: [
// //     GoogleProvider({
// //       clientId: process.env.GOOGLE_CLIENT_ID as string,
// //       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
// //     }),
// //   ],
// //   pages: {
// //     signIn: '/auth/signin',
// //     error: '/auth/error',
// //   },
// //   callbacks: {
// //     async signIn({ user, account }) {
// //       logger.log("User:", user);
// //       console.log("Account:", account);

// //       try {
// //         if (!user?.email) {
// //           console.error(" Error: No email provided by Google");

// //           throw new Error("No email provided by Google");
// //         }

// //         // Initial check and registration/login

// //         const result = await handleUserRegistrationOrLogin(user);
// //         console.log("Registration/Login Result:", result);
        
// //         if (result.status === 'error') {

// //           console.log('Error during registration/login:', result);
// //           return `/auth/error?error=${encodeURIComponent(result.message || "Authentication failed")}`;
          
// //         }

// //         if (result.status === 'inactive') {
// //           console.warn('Inactive account:', result);
// //           return `/auth/error?error=${encodeURIComponent("Account is inactive. Please contact administrator.")}`;
// //         }
        

// //         return true;
// //       } catch (error) {
// //         console.error("Sign-in error:", error);
// //         return `/auth/error?error=${encodeURIComponent(error.message || "An unknown error occurred")}`;
// //       }
// //     },

// //     async jwt({ token, user, account }) {

// //       // Only run this logic when initial sign in
// //       if (account && user) {
// //         try {
// //           const result = await handleUserRegistrationOrLogin(user);
// //           console.log("JWT Callback Result:", result);
          
// //           token.accessToken = result.accessToken;
// //           token.status = result.status;
// //           token.id = user.id;
// //           token.name = user.name;
// //           token.email = user.email;

// //           if (result.status === 'error' || result.status === 'inactive') {


// //             token.error = result.message;
// //           }
// //         } catch (error) {
// //           console.error("JWT callback error:", error);
// //           token.error = error.message;
// //         }
// //       }
      
// //       // For subsequent requests, just return the token
// //       return token;
// //     },

// //     async session({ session, token }) {
// //       if (token.error) {
// //         throw new Error(token.error);
// //       }

// //       session.user.id = token.id as string;
// //       session.user.name = token.name as string;
// //       session.user.email = token.email as string;
// //       session.user.status = token.status as string;
// //       session.accessToken = token.accessToken as string;
// //       return session;
// //     },
// //   },
// //   debug: process.env.NODE_ENV === 'development',
// //   secret: process.env.NEXTAUTH_SECRET,
// // };
// // export default authOptions;

// // const handler = NextAuth(authOptions);
// // export { handler as GET, handler as POST };

// // async function handleUserRegistrationOrLogin(user: any) {
// //   const payload = {
// //     email: user.email,
// //     name: user.name,
// //     google_id: user.id,
// //   };

// //   try {
// //     // Add retry logic for network issues
// //     const maxRetries = 3;
// //     let attempt = 0;
    
// //     while (attempt < maxRetries) {
// //       try {
// //         const checkResponse = await axios.post(
// //           `${process.env.NEXT_PUBLIC_API_URL}/check_user/`,
// //           payload,
// //           { timeout: 5000 } // 5 second timeout
// //         );

// //         if (!checkResponse.data.exists) {
// //           const registerResponse = await axios.post(
// //             `${process.env.NEXT_PUBLIC_API_URL}/google_users/`,
// //             payload,
// //             { timeout: 5000 }
// //           );
          
// //           return {
// //             accessToken: null,
// //             status: 'registered',
// //             message: registerResponse.data.message
// //           };
// //         }

// //         if (checkResponse.data.status === "active") {
// //           const loginResponse = await axios.post(
// //             `${process.env.NEXT_PUBLIC_API_URL}/google_login/`,
// //             payload,
// //             { timeout: 5000 }
// //           );
          
// //           return {
// //             accessToken: loginResponse.data.access_token,
// //             status: 'active',
// //             message: 'Login successful'
// //           };
// //         }

// //         return {
// //           accessToken: null,
// //           status: 'inactive',
// //           message: 'Account is inactive'
// //         };

// //       } catch (error) {
// //         attempt++;
// //         if (attempt === maxRetries) throw error;
// //         await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
// //       }
// //     }
// //   } catch (error) {
// //     console.error("Authentication error:", error.response?.data || error);
// //     return {
// //       accessToken: null,
// //       status: 'error',
// //       message: error.response?.data?.detail || error.message
// //     };  
// //   }
// // }



// whiteboxLearning-wbl/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

// Extend the JWT type to include status and accessToken
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string;
    email?: string;
    status?: string;
    accessToken?: string;
  }
}

// Extend the Session type to include the id and status properties
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      status?: string;
    };
    accessToken?: string;
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {

        const { accessToken, status } = await handleUserRegistrationOrLoginWithRetry(user);

        if (accessToken) {
          token.accessToken = accessToken;
        }

        token.id = user.id;
        token.name = user.name ?? undefined; //  FIXED: handle possible null
        token.email = user.email ?? undefined; // Optional: similar fix
        token.status = status;
        token.accessToken = accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.name = token.name ?? undefined;
      session.user.email = token.email ?? undefined;
      session.accessToken = token.accessToken ?? undefined;
      session.user.status = token.status;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET as string,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Function to handle user registration or login
async function handleUserRegistrationOrLogin(user: any) {
  const payload = {
    email: user.email,
    name: user.name,
    google_id: user.id,
  };

  try {
    const checkResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/check_user/`,
      payload
    );

    if (!checkResponse.data.exists) {
      // If the user does not exist, register them
      const registerResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/google_users/`,
        payload
      );
      return {
        accessToken: null,
        status: "registered",
        message: registerResponse.data.message,
      };
    } 
    if (checkResponse.data.status === "active") {
       // If the user exists and is active, log in
      const loginResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/google_login/`,
        payload
      );
      return {
        accessToken: loginResponse.data.access_token,
        status: "active",
      };
    } else {
      // If user exists but is inactive
      return { accessToken: null, status: "inactive" };
    }
  } catch (error: any) {
    // console.error(
    //   "Error during operation:",
    //   error.response?.data.detail || error.message
    // );
    return { accessToken: null, status: "error" };
  }
}


async function handleUserRegistrationOrLoginWithRetry(user: any) {
  const firstAttempt = await handleUserRegistrationOrLogin(user);
  if (firstAttempt.status === "active" && firstAttempt.accessToken) {
    return firstAttempt;
  }

  if (
    firstAttempt.status === "registered" ||
    firstAttempt.status === "error"  ||
    firstAttempt.status === "inactive"
  ) {
    // console.warn("Retrying user login in 1 second...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const secondAttempt = await handleUserRegistrationOrLogin(user);
    return secondAttempt;
  }

  return firstAttempt;
}

