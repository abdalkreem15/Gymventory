<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import type { LayoutData as KitLayoutData } from './$types';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	type LayoutData = KitLayoutData & {
		user?: { id: number; username: string } | null;
	};

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let isAuthPage = $derived(
		page.url.pathname === '/login' || page.url.pathname === '/register'
	);
</script>

{#if !isAuthPage}
	<header class="bg-white border-b shadow-sm sticky top-0 z-10">
		<nav class="max-w-4xl mx-auto px-6 py-3.5 flex items-center justify-between">
			<a href="/" class="text-xl font-bold text-gray-900 flex items-center gap-2">
				🏋️ Gymventory
			</a>

			{#if data.user}
				<div class="flex items-center gap-6">
					<div class="flex items-center gap-4 text-sm font-medium">
						<a href="/" class="text-gray-600 hover:text-blue-600 transition-colors">
							Inventory
						</a>
						<a href="/workouts" class="text-gray-600 hover:text-blue-600 transition-colors">
							Workouts
						</a>
					</div>

					<div class="flex items-center gap-3 pl-4 border-l border-gray-200">
						<span class="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
							{data.user.username}
						</span>
						<form method="POST" action="/logout">
							<button
								type="submit"
								class="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded transition-colors cursor-pointer"
							>
								Log Out
							</button>
						</form>
					</div>
				</div>
			{:else}
				<div class="flex items-center gap-4 text-sm font-medium">
					<a href="/login" class="text-gray-600 hover:text-gray-900 transition-colors">
						Log In
					</a>
					<a
						href="/register"
						class="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md transition-colors"
					>
						Register
					</a>
				</div>
			{/if}
		</nav>
	</header>
{/if}

<main>
	{@render children()}
</main>
