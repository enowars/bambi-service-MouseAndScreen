# Backend
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build_backend
WORKDIR /src

# Fetch dependencies
COPY ./MouseAndScreen/MouseAndScreen.csproj ./MouseAndScreen/MouseAndScreen.csproj
COPY MouseAndScreen.sln ./MouseAndScreen.sln
RUN dotnet restore

# Publish release artifacts
COPY . ./
RUN dotnet publish MouseAndScreen -c Release -o /app


# Frontend
FROM node:12.22.11 as build_frontend
WORKDIR /src

# Fetch dependencies
COPY ./Frontend/package.json ./Frontend/package.json
COPY ./Frontend/package-lock.json ./Frontend/package-lock.json
WORKDIR /src/Frontend
RUN npm install
COPY ./Frontend /src/Frontend
RUN npm run prod


# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS runtime
WORKDIR /app
COPY --from=build_backend /app .
COPY --from=build_frontend /src/MouseAndScreen/wwwroot ./wwwroot
ENTRYPOINT dotnet MouseAndScreen.dll
