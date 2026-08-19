<script lang="ts">
	import type { PageData as KitPageData } from './$types';

	type PageData = KitPageData & {
		user: { id: number; username: string };
		equipment: { id: number; name: string }[];
		userEquipmentIds: number[];
		recommendedEquipment: { id: number; name: string }[];
	};

	let { data, form }: { data: PageData; form: { success?: boolean } | null } = $props();

	const recommendedIds = $derived(new Set(data.recommendedEquipment.map((item) => item.id)));
</script>

<div class="max-w-4xl mx-auto p-6">
	<div class="flex justify-between items-center mb-6 pb-4 border-b">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Gymventory</h1>
			<p class="text-sm text-gray-600">
				Logged in as <span class="font-semibold">{data.user.username}</span>
			</p>
		</div>
		<form method="POST" action="/logout">
			<button
				type="submit"
				class="text-sm text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 font-medium py-1.5 px-3 rounded-md transition-colors cursor-pointer"
			>
				Log Out
			</button>
		</form>
	</div>

	<p class="text-gray-600 mb-6">Select the equipment you have access to in your gym or home setup.</p>

	{#if form?.success}
		<div class="mb-6 p-4 bg-green-100 text-green-800 rounded-md font-medium border border-green-200">
			Inventory saved successfully!
		</div>
	{/if}

	{#if data.recommendedEquipment.length > 0}
		<div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
			<h2 class="text-sm font-semibold text-gray-900 mb-2">
				⭐ Recommended for your training goal
			</h2>
			<p class="text-xs text-gray-600 mb-3">
				These items unlock sport-specific exercises for your selected training program.
			</p>
			<div class="flex flex-wrap gap-2">
				{#each data.recommendedEquipment as item (item.id)}
					<span
						class="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-md font-medium"
					>
						{item.name}
					</span>
				{/each}
			</div>
		</div>
	{/if}

	<form method="POST" action="?/saveInventory">
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
			{#each data.equipment as item}
				<label
					class="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {recommendedIds.has(item.id) ? 'border-blue-300 bg-blue-50/50' : ''}"
				>
					<input
						type="checkbox"
						name="equipment"
						value={item.id}
						checked={data.userEquipmentIds.includes(item.id)}
						class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
					/>
					<span class="font-medium text-gray-800">
						{item.name}
						{#if recommendedIds.has(item.id)}
							<span
								class="ml-1.5 text-xs font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded"
							>
								Recommended
							</span>
						{/if}
					</span>
				</label>
			{/each}
		</div>

		<div class="flex gap-4">
			<button
				type="submit"
				class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md shadow-sm transition-colors cursor-pointer"
			>
				Save Inventory
			</button>
			<a
				href="/workouts"
				class="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-6 rounded-md shadow-sm transition-colors"
			>
				View Recommended Workouts →
			</a>
			<a
				href="/profile"
				class="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-md shadow-sm transition-colors"
			>
				View Profile →
			</a>
		</div>
	</form>
</div>