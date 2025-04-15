# Atlas AI Assistant

Atlas is a powerful personal AI assistant built with SvelteKit that integrates with Notion, Gmail, GitHub, and iCloud to streamline your workflow. It now includes a Receipt Scanning & Expense Dashboard module.

## Features

- **Notion Integration**: Update boards, create entries, and manage your Notion workspace
- **Gmail Integration**: Send emails and manage your inbox
- **GitHub Integration**: Access repository context using RAG (Retrieval-Augmented Generation)
- **iCloud Integration**: Access files and emails from your iCloud account
- **Chat Interface**: Natural language interface to interact with Atlas
- **Receipt Scanning**: Capture or upload receipt images and extract data using OpenAI Vision
- **Expense Dashboard**: View expense analytics with charts and summaries

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
