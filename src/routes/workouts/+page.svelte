<script lang="ts">
	import type { PageData } from './$types';

	interface RecommendedExercise {
		id: number;
		name: string;
		target_muscle: string;
		instructions: string | null;
		required_equipment: string;
		is_training_specific: number;
	}

	interface GroupedExercises {
		muscle: string;
		exercises: RecommendedExercise[];
	}

	interface RecommendedEquipment {
		id: number;
		name: string;
	}

	let { data }: { data: PageData } = $props();

	// Group recommended exercises by target muscle, preserving priority order
	const groupedExercises: GroupedExercises[] = $derived(
		data.exercises.reduce<GroupedExercises[]>((groups, exercise) => {
			const existing = groups.find((group) => group.muscle === exercise.target_muscle);
			if (existing) {
				existing.exercises.push(exercise);
			} else {
				groups.push({ muscle: exercise.target_muscle, exercises: [exercise] });
			}
			return groups;
		}, [])
	);

	const totalExercises = $derived(data.exercises.length);
	const trainingSpecificCount = $derived(
		data.exercises.filter((e) => e.is_training_specific === 1).length
	);
</script>

<svelte:head>
	<title>Recommended Workouts — Gymventory</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Recommended Workouts</h1>
		<p class="text-sm text-gray-600 mt-1">
			Based on your equipment and goal:
			<span class="font-semibold text-blue-600">{data.trainingTypeLabel}</span>
			{#if totalExercises > 0}
				· <span class="font-semibold text-gray-900">{totalExercises}</span>
				{totalExercises === 1 ? 'exercise' : 'exercises'}
				available
			{/if}
		</p>
	</div>

	{#if data.trainingTypeDescription}
		<div class="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
			<div class="flex items-start gap-3">
				<div class="text-2xl">🎯</div>
				<div>
					<h2 class="font-semibold text-gray-900 mb-1">{data.trainingTypeLabel}</h2>
					<p class="text-sm text-gray-600 leading-relaxed">{data.trainingTypeDescription}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if data.recommendedEquipment.length > 0}
		<div class="bg-white border border-gray-200 rounded-xl p-5 mb-8">
			<h2 class="text-sm font-semibold text-gray-700 mb-3">
				🛠️ Equipment recommended for {data.trainingTypeLabel.toLowerCase()}
			</h2>
			<div class="flex flex-wrap gap-2">
				{#each data.recommendedEquipment as eq (eq.id)}
					<a
						href="/"
						class="text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-md font-medium border border-blue-100 hover:bg-blue-100 transition-colors"
					>
						{eq.name}
					</a>
				{/each}
			</div>
			<p class="text-xs text-gray-500 mt-3">
				Add these to your inventory to unlock more {data.trainingTypeLabel.toLowerCase()} exercises.
			</p>
		</div>
	{/if}

	{#if !data.hasInventory}
		<!-- Empty state: user has not saved any equipment yet -->
		<div class="bg-blue-50 border border-blue-200 rounded-xl p-10 text-center">
			<div class="text-5xl mb-4">🏋️</div>
			<h2 class="text-xl font-bold text-gray-900 mb-2">No equipment saved yet</h2>
			<p class="text-gray-600 mb-6 max-w-md mx-auto">
				Add the equipment you have access to in your gym or home setup, and we'll recommend
				exercises tailored to your {data.trainingTypeLabel.toLowerCase()} training program.
			</p>
			<a
				href="/"
				class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors"
			>
				Set Up Your Inventory →
			</a>
		</div>
	{:else if totalExercises === 0}
		<!-- Empty state: equipment saved but no exercises match -->
		<div class="bg-amber-50 border border-amber-200 rounded-xl p-10 text-center">
			<div class="text-5xl mb-4">🤔</div>
			<h2 class="text-xl font-bold text-gray-900 mb-2">No matching exercises found</h2>
			<p class="text-gray-600 mb-6 max-w-md mx-auto">
				We couldn't find any exercises that work with your current equipment selection. Try
				adding more equipment to unlock additional workouts.
			</p>
			<a
				href="/"
				class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors"
			>
				Update Your Inventory →
			</a>
		</div>
	{:else if trainingSpecificCount === 0}
		<!-- Empty state: equipment saved but no training-specific exercises match -->
		<div class="bg-amber-50 border border-amber-200 rounded-xl p-10 text-center mb-8">
			<div class="text-5xl mb-4">🎯</div>
			<h2 class="text-xl font-bold text-gray-900 mb-2">No {data.trainingTypeLabel.toLowerCase()} exercises yet</h2>
			<p class="text-gray-600 mb-6 max-w-md mx-auto">
				Your equipment supports {totalExercises} general exercises, but you don't have
				sport-specific gear yet. Add equipment like
				{#each data.recommendedEquipment.slice(0, 3) as eq, i}
					{eq.name}{i < Math.min(data.recommendedEquipment.length, 3) - 1 ? ', ' : ''}
				{/each}
				to unlock {data.trainingTypeLabel.toLowerCase()} workouts.
			</p>
			<a
				href="/"
				class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors"
			>
				Update Your Inventory →
			</a>
		</div>

		<!-- Still show general exercises -->
		<div class="space-y-10">
			{#each groupedExercises as group (group.muscle)}
				<section>
					<h2 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
						{group.muscle}
						<span
							class="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full align-middle"
						>
							{group.exercises.length} {group.exercises.length === 1 ? 'exercise' : 'exercises'}
						</span>
					</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each group.exercises as exercise (exercise.id)}
							<article
								class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
							>
								<div class="flex items-start justify-between gap-3 mb-2">
									<h3 class="font-semibold text-gray-900">{exercise.name}</h3>
								</div>

								{#if exercise.required_equipment}
									<div class="mb-3">
										<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
											>Equipment</span
										>
										<div class="flex flex-wrap gap-1.5 mt-1.5">
											{#each exercise.required_equipment.split(', ') as eq (eq)}
												<span
													class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium"
												>
													{eq}
												</span>
											{/each}
										</div>
									</div>
								{/if}

								{#if exercise.instructions}
									<p class="text-sm text-gray-600 leading-relaxed">{exercise.instructions}</p>
								{/if}
							</article>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{:else}
		<!-- Grouped exercise cards -->
		<div class="space-y-10">
			{#each groupedExercises as group (group.muscle)}
				<section>
					<h2 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
						{group.muscle}
						<span
							class="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full align-middle"
						>
							{group.exercises.length} {group.exercises.length === 1 ? 'exercise' : 'exercises'}
						</span>
					</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each group.exercises as exercise (exercise.id)}
							<article
								class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow {exercise.is_training_specific === 1 ? 'border-blue-300 ring-1 ring-blue-100' : ''}"
							>
								<div class="flex items-start justify-between gap-3 mb-2">
									<h3 class="font-semibold text-gray-900">{exercise.name}</h3>
									{#if exercise.is_training_specific === 1}
										<span
											class="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap"
										>
											{data.trainingTypeLabel}
										</span>
									{/if}
								</div>

								{#if exercise.required_equipment}
									<div class="mb-3">
										<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
											>Equipment</span
										>
										<div class="flex flex-wrap gap-1.5 mt-1.5">
											{#each exercise.required_equipment.split(', ') as eq (eq)}
												<span
													class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium"
												>
													{eq}
												</span>
											{/each}
										</div>
									</div>
								{/if}

								{#if exercise.instructions}
									<p class="text-sm text-gray-600 leading-relaxed">{exercise.instructions}</p>
								{/if}
							</article>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>
