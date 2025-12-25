# Use the official Node.js 18 Alpine image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# -------- BUILD-TIME ARGS (Frontend public vars) --------
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY
ARG NEXT_PUBLIC_GOOGLE_CALENDAR_ID
ARG NEXTAUTH_URL

# -------- Make them available during build --------
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY=$NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY
ENV NEXT_PUBLIC_GOOGLE_CALENDAR_ID=$NEXT_PUBLIC_GOOGLE_CALENDAR_ID
ENV NEXTAUTH_URL=$NEXTAUTH_URL


# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Always build the Next.js app to ensure the .next directory exists
RUN npm run build || { echo 'Build failed'; exit 1; }

# Set environment variable to control which .env file to use
# COPY .env .env

# Expose port 3000 to the outside world
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "run", "start"]

