FROM node:18

WORKDIR /app
COPY . .
RUN npm install

# Copy your .env.local into the container
COPY .env.local .env.local

EXPOSE 3001
CMD ["npx", "next", "dev", "-p", "3001"] 