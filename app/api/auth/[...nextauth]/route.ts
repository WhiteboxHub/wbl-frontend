// // frntend/app/api/auth/[...nextauth]/route.ts
// import NextAuth, { NextAuthOptions, Session } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import axios from "axios";

// // Extend the JWT type to include status and accessToken
// declare module "next-auth/jwt" {
//   interface JWT {
//     id: string;
//     name?: string;
//     email?: string;
//     status?: string;
//     accessToken?: string;
//   }
// }

// // Extend the Session type to include the id and status properties
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       name?: string;
//       email?: string;
//       image?: string;
//       status?: string;
//     };
//     accessToken?: string;
//   }
// }

// const authOptions: NextAuthOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID as string,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
//     }),
//   ],
//   pages: {
//     error: '/auth/error', // Custom error page for better UX on errors
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         console.log("User in jwt callback:", user);

//         try {
//           // Call register or login based on the user status
//           const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);

//           // Attach the access token and status to the JWT token
//           if (accessToken) {
//             token.accessToken = accessToken;
//           }
//           token.id = user.id;
//           token.name = user.name;
//           token.email = user.email;
//           token.status = status; // Attach user status (inactive, active, etc.)

//           console.log("JWT callback - Token after processing:", token);
//           console.log("----------------Status message:", message);
//         } catch (error) {
//           console.error("---------------------------Error in jwt callback during user handling:", error);
//           token.error = "---------------------------Error during registration/login handling";
//         }
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       console.log("Token in session callback:", token);

//       session.user.id = token.id as string;
//       session.user.name = token.name as string;
//       session.user.email = token.email as string;
//       session.accessToken = token.accessToken as string;
//       session.user.status = token.status;

//       console.log("---------------------------Session in session callback:", session);

//       return session;
//     },
//   },
//   debug: true, // Enable debug mode for detailed logs
//   secret: process.env.NEXTAUTH_SECRET as string,
// };

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };

// // Function to handle user registration or login
// async function handleUserRegistrationOrLogin(user: any) {
//   const payload = {
//     email: user.email,
//     name: user.name,
//     google_id: user.id,
//   };

//   try {
//     const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);

//     if (!checkResponse.data.exists) {
//       // If the user does not exist, register them
//       const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
//       return {
//         accessToken: null,
//         status: 'registered',
//         message: registerResponse.data.message // Include message from response
//       };
//     } else if (checkResponse.data.status === "active") {
//       // If the user exists and is active, log in
//       const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
//       return { accessToken: loginResponse.data.access_token, status: 'active' };
//     } else {
//       // If user exists but is inactive
//       return { accessToken: null, status: 'inactive' };
//     }
//   } catch (error) {
//     console.error("---------------------------Error during registration/login operation:", error.response?.data.detail || error.message);
//     return { accessToken: null, status: 'error' };
//   }
// }


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
// //     error?: string;
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
// //     error: '/auth/error', // Custom error page for better UX on errors
// //   },
// //   callbacks: {
    
// //     async jwt({ token, user }) {
// //       if (user) {
// //         try {
// //           // Register or login user
// //           const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);
    
// //           // Assign token details
// //           token.id = user.id;
// //           token.name = user.name;
// //           token.email = user.email;
// //           token.status = status;
// //           token.accessToken = accessToken;
    
// //           // If status is inactive or error, throw an error to trigger redirection
// //           if (status === "inactive") {
// //             throw new Error(message || "Your account is inactive.");
// //           } else if (status === "error") {
// //             throw new Error(message || "Error during authentication.");
// //           }
// //         } catch (error) {
// //           console.error("JWT callback error:", error);
// //           token.error = error.message || "Unknown error during authentication.";
// //         }
// //       }
// //       return token;
// //     },
// //     async session({ session, token }) {
// //       session.user.id = token.id as string;
// //       session.user.name = token.name as string;
// //       session.user.email = token.email as string;
// //       session.accessToken = token.accessToken as string;
// //       session.user.status = token.status;
// //       session.error = token.error;

// //       // console.log("Session in session callback:", session);

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
// //     // Check if the user exists
// //     const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);

// //     if (!checkResponse.data.exists) {
// //       // Register new user if they don't exist
// //       const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
// //       return {
// //         accessToken: null,
// //         status: 'registered',
// //         message: registerResponse.data.message || "User successfully registered",
// //       };
// //     } else if (checkResponse.data.status === "active") {
// //       // Login active users
// //       const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
// //       return {
// //         accessToken: loginResponse.data.access_token,
// //         status: 'active',
// //       };
// //     } else {
// //       // Handle inactive users
// //       return {
// //         accessToken: null,
// //         status: 'inactive',
// //         message: "Your account is inactive. Please contact support.",
// //       };
// //     }
// //   } catch (error) {
// //     // Log detailed error for debugging
// //     console.error("Error during user registration/login:", error.response?.data || error.message);
// //     return { accessToken: null, status: 'error', message: "An error occurred during authentication." };
// //   }
// // }

// // // Utility function to check if the token is expired
// // function isTokenExpired(token: string): boolean {
// //   const decoded = parseJwt(token);
// //   if (!decoded || !decoded.exp) return true;
// //   return decoded.exp * 1000 < Date.now();
// // }

// // // Function to decode the JWT token and parse its payload
// // function parseJwt(token: string) {
// //   try {
// //     return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
// //   } catch (e) {
// //     // console.error("Failed to parse JWT:", e);
// //     return null;
// //   }
// // }

// // // Dummy function to refresh an access token (replace with actual API call)
// // async function refreshAccessToken(token: string) {
// //   // console.log("Refreshing access token...");
// //   // Make your API call to refresh the token here
// //   return "newAccessToken";
// // }


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
// //     error?: string;
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
// //     error: '/auth/error', // Custom error page
// //   },
// //   callbacks: {
// //     async jwt({ token, user }) {
// //       if (user) {
// //         try {
// //           // Call backend to handle user registration or login
// //           const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);

// //           // Assign token details
// //           token.id = user.id;
// //           token.name = user.name;
// //           token.email = user.email;
// //           token.status = status || "unknown";
// //           token.accessToken = accessToken;

// //           // Handle inactive or error statuses gracefully
// //           if (status === "inactive") {
// //             token.error = message || "Your account is inactive.";
// //           } else if (status === "error") {
// //             token.error = message || "Error during authentication.";
// //           }
// //         } catch (error) {
// //           console.error("JWT callback error:", error);
// //           token.error = "Unexpected error during authentication.";
// //         }
// //       }
// //       return token;
// //     },
// //     async session({ session, token }) {
// //       session.user.id = token.id as string;
// //       session.user.name = token.name as string;
// //       session.user.email = token.email as string;
// //       session.accessToken = token.accessToken as string;
// //       session.user.status = token.status;
// //       session.error = token.error || null; // Include error details, if any

// //       return session;
// //     },
// //     async redirect({ url, baseUrl }) {
// //       // Redirect to the specified URL or default to the home page
// //       if (url.startsWith(baseUrl)) {
// //         return url;
// //       }
// //       return baseUrl;
// //     },
// //   },
// //   debug: true, // Enable debug mode for detailed logs
// //   secret: process.env.NEXTAUTH_SECRET as string,
// // };

// // const handler = NextAuth(authOptions);
// // export { handler as GET, handler as POST };

// // // Backend communication for registration or login
// // async function handleUserRegistrationOrLogin(user: any) {
// //   const payload = {
// //     email: user.email,
// //     name: user.name,
// //     google_id: user.id,
// //   };

// //   try {
// //     // Check if the user exists
// //     const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);

// //     if (!checkResponse.data.exists) {
// //       // Register new user
// //       const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
// //       return {
// //         accessToken: null,
// //         status: 'registered',
// //         message: registerResponse.data.message || "User successfully registered",
// //       };
// //     } else if (checkResponse.data.status === "active") {
// //       // Login active users
// //       const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
// //       return {
// //         accessToken: loginResponse.data.access_token,
// //         status: 'active',
// //       };
// //     } else {
// //       // Handle inactive users
// //       return {
// //         accessToken: null,
// //         status: 'inactive',
// //         message: "Your account is inactive. Please contact support.",
// //       };
// //     }
// //   } catch (error) {
// //     console.error("Error during user registration/login:", error.response?.data || error.message);
// //     return { accessToken: null, status: 'error', message: "An error occurred during authentication." };
// //   }
// // }

// // // Utility function to decode JWT token
// // function parseJwt(token: string) {
// //   try {
// //     return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
// //   } catch (e) {
// //     return null;
// //   }
// // }

// // // Dummy function to refresh an access token
// // async function refreshAccessToken(token: string) {
// //   // Make your API call to refresh the token here
// //   return "newAccessToken";
// // }

// -----------------*************************------------dazling------------------************************************

// frntend/app/api/auth/[...nextauth]/route.ts
// import NextAuth, { NextAuthOptions, Session } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import axios from "axios";

// // Extend the JWT type to include status and accessToken
// declare module "next-auth/jwt" {
//   interface JWT {
//     id: string;
//     name?: string;
//     email?: string;
//     status?: string;
//     accessToken?: string;
//   }
// }

// // Extend the Session type to include the id and status properties
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       name?: string;
//       email?: string;
//       image?: string;
//       status?: string;
//     };
//     accessToken?: string;
//   }
// }

// const authOptions: NextAuthOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID as string,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
//     }),
//   ],
//   pages: {
//     error: '/auth/error', // Custom error page for better UX on errors
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         console.log("User in jwt callback:", user);

//         try {
//           // Call register or login based on the user status
//           const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);

//           // Attach the access token and status to the JWT token
//           if (accessToken) {
//             token.accessToken = accessToken;
//           }
//           token.id = user.id;
//           token.name = user.name;
//           token.email = user.email;
//           token.status = status; // Attach user status (inactive, active, etc.)

//           console.log("JWT callback - Token after processing:", token);
//           console.log("----------------Status message:", message);
//         } catch (error) {
//           console.error("---------------------------Error in jwt callback during user handling:", error);
//           token.error = "---------------------------Error during registration/login handling";
//         }
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       console.log("Token in session callback:", token);

//       session.user.id = token.id as string;
//       session.user.name = token.name as string;
//       session.user.email = token.email as string;
//       session.accessToken = token.accessToken as string;
//       session.user.status = token.status;

//       console.log("---------------------------Session in session callback:", session);

//       return session;
//     },
//   },
//   debug: true, // Enable debug mode for detailed logs
//   secret: process.env.NEXTAUTH_SECRET as string,
// };

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };

// // Function to handle user registration or login
// async function handleUserRegistrationOrLogin(user: any) {
//   const payload = {
//     email: user.email,
//     name: user.name,
//     google_id: user.id,
//   };

//   try {
//     const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);

//     if (!checkResponse.data.exists) {
//       // If the user does not exist, register them
//       const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
//       return {
//         accessToken: null,
//         status: 'registered',
//         message: registerResponse.data.message // Include message from response
//       };
//     } else if (checkResponse.data.status === "active") {
//       // If the user exists and is active, log in
//       const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
//       return { accessToken: loginResponse.data.access_token, status: 'active' };
//     } else {
//       // If user exists but is inactive
//       return { accessToken: null, status: 'inactive' };
//     }
//   } catch (error) {
//     console.error("---------------------------Error during registration/login operation:", error.response?.data.detail || error.message);
//     return { accessToken: null, status: 'error' };
//   }
// }


// ----------------------------------*******************dazling spring-*************************------------------------------




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
  pages: {
    error: '/auth/error', // Custom error page for better UX on errors
  },
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        console.log("User in jwt callback:", user);

        try {
          const { accessToken, status, message } = await handleUserRegistrationOrLogin(user);
          if (accessToken) {
            token.accessToken = accessToken;
          }
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.status = status;
          console.log("JWT callback - Token after processing:", token);
          console.log("Status message:", message);
        } catch (error) {
          console.error("Error in jwt callback during user handling:", error);
          token.error = "Error during registration/login handling";
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Token in session callback:", token);

      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.accessToken = token.accessToken as string;
      session.user.status = token.status;

      console.log("Session in session callback:", session);

      return session;
    },
  },
  debug: true, // Enable debug mode for detailed logs
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

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);
      console.log("Check user response:", checkResponse.data);

      if (!checkResponse.data.exists) {
        const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
        console.log("Register user response:", registerResponse.data);
        return {
          accessToken: null,
          status: 'registered',
          message: registerResponse.data.message
        };
      } else if (checkResponse.data.status === "active") {
        const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
        console.log("Login user response:", loginResponse.data);
        return { accessToken: loginResponse.data.access_token, status: 'active' };
      } else {
        return { accessToken: null, status: 'inactive' };
      }
    } catch (error) {
      console.error("Error during registration/login operation:", error.response?.data.detail || error.message);
      retries++;
      if (retries >= maxRetries) {
        return { accessToken: null, status: 'error' };
      }
      console.log(`Retrying... (${retries}/${maxRetries})`);
    }
  }
}
