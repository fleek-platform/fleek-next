# ⚡️Fleek Next Adapter

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-blue.svg)](https://conventionalcommits.org)

The Fleek Next.js adapter allows you to deploy your server-side Next.js application on Fleek.

# 🚧 Work in Progress 🚧

This repository is currently under development and is a **Work in Progress**. Features and functionalities may change frequently.

# Installation

- **npm**

```bash
npm install @fleek-platform/next
```

- **pnpm**

```bash
pnpm install @fleek-platform/next
```

# Usage

To deploy your Next.js application to Fleek, follow these steps:

1. **Configure Edge Runtime**
   Add the following code to any routes that run server-side code to ensure they run on the edge:

```typescript
export const runtime = 'edge';
```

2. **Set environment variables**

```sh
export FLEEK_TOKEN=<your personal access token>
```

3. Add `fleek.json` to your project's root dir:

```json
{
  "FLEEK_PROJECT_ID": "<your project id>"
}
```

4. **Build and Deploy**

Use the Fleek Next.js adapter to build and deploy your application via the command line:

```sh
npx fleek-next deploy
# or if installed globally
fleek-next deploy
```

If you are running the command outside of your project's root dir, you can set the path to it with the project path flag `-p`/`--projectPath`:

```sh
fleek-next deploy -p path/to/my/repo
```

## Login to Fleek

If you don't have a project ID or Fleek personal access token, you can make use of the [Fleek CLI](https://www.npmjs.com/package/@fleekxyz/cli):

1. Install the Fleek CLI

```
npm i -g @fleekxyz/cli
```

2. Login to your Fleek account

```sh
fleek login
```

3. Create a personal access token and store it somewhere safe:

```sh
fleek pat create --name '<name of your personal access token>'
```

4. Create a project if you don't have one yet:

```sh
fleek projects create --name '<name of your project>'
```

5. Get your project ID:

```sh
fleek projects list | grep '<name of your project>' | awk '{print $1}'
```

## Additional Options

The `deploy` command supports several options to customize the build and deployment process:

- `-d, --dryrun`: Builds the Next.js app without deploying it to Fleek. Defaults to `false`.
- `-p, --project-path <path>`: The path to your Next.js project's root directory. Defaults to the path where the command is run.
- `-s, --skipBuild`: Skip building the Next.js app before deployment, useful if you want to build the application yourself due to any possible extra steps. Defaults to `false`.
- `-c, --clean`: Clean previous build artifacts before building.
- `-v, --verbose`: Enable verbose logging.

# Release Process

This project follows SemVer for versioning. Here's how to release a new version:

1. **Update Version Number**: Bump the version number in package.json using npm version (patch/minor/major). This will update the version number in package.json and create a new Git tag.

```bash
pnpm version patch
```

2. **Push Changes and Tags**

```bash
git push origin main --follow-tags
```

3. **GitHub Actions Automation**: A GitHub Actions workflow automatically publishes the package to npm when a new tag is pushed.

# Contributing

Thanks for considering contributing to our project!

## How to Contribute

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch-name`.
3. Make your changes.
4. Commit your changes using conventional commits.
5. Push to your fork and submit a pull request.

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for our commit messages:

- `test`: 💍 Adding missing tests
- `feat`: 🎸 A new feature
- `fix`: 🐛 A bug fix
- `chore`: 🤖 Build process or auxiliary tool changes
- `docs`: ✏️ Documentation only changes
- `refactor`: 💡 A code change that neither fixes a bug or adds a feature
- `style`: 💄 Markup, white-space, formatting, missing semi-colons...
