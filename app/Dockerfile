FROM node:14 as compiled
WORKDIR /opt/notification-fe
COPY . .
RUN npm i
WORKDIR /opt/notification-fe/app
RUN npm i
RUN npm run bundle

FROM nginx:1.19-alpine 

# copy the build folder from react to the root of nginx (www)
COPY --from=compiled /opt/notification-fe/app/dist/ /usr/share/nginx/html/

# expose port 80 to the outer world

EXPOSE 80

# start nginx

CMD ["nginx", "-g", "daemon off;"]
