<script lang="ts">
	let { form }: { form: { error?: string } | null } = $props();
</script>

<div class="min-h-[80vh] flex items-center justify-center p-4">
	<div class="w-full max-w-md bg-white border rounded-lg shadow-sm p-8">
		<h1 class="text-2xl font-bold text-gray-900 mb-2 text-center">Log In</h1>
		<p class="text-sm text-gray-600 mb-6 text-center">
			Welcome back! Log in to access your inventory.
		</p>

		{#if form?.error}
			<div class="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
				{form.error}
			</div>
		{/if}

		<form method="POST" class="space-y-4">
			<div>
				<label for="username" class="block text-sm font-medium text-gray-700 mb-1">
					Username
				</label>
				<input
					type="text"
					id="username"
					name="username"
					required
					class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
					Password
				</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors cursor-pointer"
			>
				Log In
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-gray-600">
			Don't have an account?
			<a href="/register" class="text-blue-600 hover:underline font-medium">Sign up</a>
		</p>
	</div>
</div>
