FROM node:20-alpine

WORKDIR /app

# Dependencies would be installed here in a real build; keeping minimal for sandbox
COPY . /app

EXPOSE 5173

CMD ["node", "-e", "console.log('Frontend container placeholder. Use local dev for Vite.'); setInterval(()=>{}, 1<<30)"]


