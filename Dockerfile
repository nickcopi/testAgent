# Use an official Python runtime as a parent image
FROM stefanscherer/node-windows

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install chocolatey
RUN Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install node modules
RUN npm install

# Make port 80 available to the world outside this container
#EXPOSE 80

# Define environment variable
ENV greenGuy http://192.168.109.128:8080

# Run app.py when the container launches
CMD ["node", "index.js"]
