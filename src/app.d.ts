// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		atlasConfig?: {
			github?: {
				clientId: string;
				redirectUri: string;
			};
			google?: {
				clientId: string;
				redirectUri: string;
			};
			app?: {
				url: string;
			};
		};
	}
}

export {};
