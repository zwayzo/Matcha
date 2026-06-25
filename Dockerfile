FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the project
COPY . .

# Expose Next.js dev port
EXPOSE 3000

# Run in development mode
CMD ["npm", "run", "dev"]
