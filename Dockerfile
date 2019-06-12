# Use an official Python runtime as a parent image
FROM mcr.microsoft.com/windows/servercore:ltsc2016

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install chocolatey
RUN @"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"


#Install nodejs lol
RUN choco install -y nodejs.install

# Install node modules
RUN npm install

# Make port 80 available to the world outside this container
#EXPOSE 80

# Define environment variable
ENV greenGuy http://192.168.109.128:8080

# Run app.py when the container launches
CMD ["node", "index.js"]
