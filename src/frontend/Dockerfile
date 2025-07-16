FROM nginx:alpine

# Create directory structure
RUN mkdir -p /usr/share/nginx/html

# Copy nginx configuration first
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all frontend files
COPY . /usr/share/nginx/html/

# Set correct permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]