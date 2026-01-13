# README #

## Development Laptop ##

### Install node.js ###
Download & install node.js LTS Version [https://nodejs.org/en](https://nodejs.org/en) 

### Install Go Compiler ###
Download & install Go [https://go.dev/dl/](https://go.dev/dl/) -> Choose current Windows 64bit version (e.g. go1.25.5.windows-amd64.msi)

### Clone Repository ###
clone bitbucket directory to development system

### Powershell root folder ###
```
> npm install
> npm run dev -- --host 127.0.0.1 --port 60123
> npm run dev (live system for development)
```

## For development ##
Run server under vite in dev mode
```
> npm.cmd run dev -- --host 127.0.0.1 --port 60123
```

## For deployment build ##
Run build script with go
```
> npm run build:exe
```