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

        const { accessToken, status } = await handleUserRegistrationOrLogin(user);

        if (accessToken) {
          token.accessToken = accessToken;
        }

        token.id = user.id;
        // token.name = user.name;
        // token.email = user.email;
        token.name = user.name ?? undefined; 
        token.email = user.email ?? undefined;
        token.status = status;

      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;

      session.accessToken = token.accessToken as string; // Pass the access token to the session
      session.user.status = token.status; // Pass user status to session

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

    const checkResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check_user/`, payload);

    if (!checkResponse.data.exists) { 
      // If the user does not exist, register them
      const registerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_users/`, payload);
      // return { accessToken: null, status: 'registered' };
     // Pass the registration message back to the UI
     return { 
      accessToken: null, 
      status: 'registered', 
      message: registerResponse.data.message // Include the message from the response
     }
    } else if (checkResponse.data.status === "active") {
      // If the user exists and is active, log in
      const loginResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google_login/`, payload);
      return { accessToken: loginResponse.data.access_token, status: 'active' };
    } else {
      // If user exists but is inactive
      return { accessToken: null, status: 'inactive' };
    }
  } catch (error) {
    console.error("Error during operation:", error.response?.data.detail || error.message);
    return { accessToken: null, status: 'error' };
  }
}