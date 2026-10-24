FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Backend/EscapeRoom.Api.csproj Backend/
RUN dotnet restore Backend/EscapeRoom.Api.csproj

COPY Backend/ Backend/
RUN dotnet publish Backend/EscapeRoom.Api.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "EscapeRoom.Api.dll"]
