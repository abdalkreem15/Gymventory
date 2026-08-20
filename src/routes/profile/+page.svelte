<script lang="ts">
    import { calculateBodyMetrics, type Gender } from '$lib/bodyMetrics';
    import { formatDMY } from '$lib/age';
    import DatePicker from '$lib/DatePicker.svelte';

    interface Measurement {
        id: number;
        weight_kg: number;
        height_cm: number;
        neck_cm: number;
        waist_cm: number;
        hip_cm: number | null;
        measured_at: string;
        bmi: number;
        body_fat_percent: number | null;
        bmi_category: string;
    }

    interface TrainingTypeInfo {
        name: string;
        description: string;
    }

    interface UserInfo {
        id: number;
        username: string;
        email: string;
        gender: Gender;
        birth_date: string;
        age: number;
        training_type: string;
        target_weight_kg: number | null;
    }

    interface PerfectWeightInfo {
        suggestedKg: number;
        minKg: number;
        maxKg: number;
        customKg: number | null;
    }

    let { data, form }: {
        data: {
            user: UserInfo;
            trainingType?: TrainingTypeInfo;
            measurements: Measurement[];
            perfectWeight?: PerfectWeightInfo;
        };
        form: { error?: string; success?: boolean; message?: string } | null;
    } = $props();

    // New measurement form state
    let weightKg = $state('');
    let heightCm = $state('');
    let neckCm = $state('');
    let waistCm = $state('');
    let hipCm = $state('');

    // Form field states initialized as empty strings to avoid Svelte 5 compiler warnings
    let birthDateInput = $state('');
    let targetWeightInput = $state('');

    // Sync form field values reactively when server data changes
    $effect(() => {
        birthDateInput = data.user.birth_date ? formatDMY(data.user.birth_date) : '';
        targetWeightInput = data.perfectWeight?.customKg?.toString() ?? '';
    });

    const weightNum = $derived(Number(weightKg));
    const heightNum = $derived(Number(heightCm));
    const neckNum = $derived(Number(neckCm));
    const waistNum = $derived(Number(waistCm));
    const hipNum = $derived(Number(hipCm));

    const isFemale = $derived(data.user.gender === 'female');

    // Live BMI / body fat preview for new measurement
    const metrics = $derived.by(() => {
        if (
            weightNum > 0 &&
            heightNum > 0 &&
            neckNum > 0 &&
            waistNum > 0 &&
            (!isFemale || hipNum > 0)
        ) {
            return calculateBodyMetrics({
                gender: data.user.gender,
                weightKg: weightNum,
                heightCm: heightNum,
                neckCm: neckNum,
                waistCm: waistNum,
                hipCm: isFemale ? hipNum : null
            });
        }
        return null;
    });

    // Latest measurement (first row is most recent)
    const latest = $derived(data.measurements[0]);

    const isFitness = $derived(data.user.training_type === 'fitness');

    const perfectWeightKg = $derived(
        data.perfectWeight ? (data.perfectWeight.customKg ?? data.perfectWeight.suggestedKg) : null
    );

    const perfectWeightProgress = $derived.by(() => {
        if (!latest || !data.perfectWeight || perfectWeightKg === null) return 0;
        const current = latest.weight_kg;
        if (current <= perfectWeightKg) return 100;
        const start = data.perfectWeight.maxKg;
        if (start <= perfectWeightKg) return 0;
        return Math.min(100, Math.max(0, Math.round(((start - current) / (start - perfectWeightKg)) * 100)));
    });

    const trainingTypeLabels: Record<string, string> = {
        fitness: 'Fitness & Weight Loss',
        bodybuilding: 'Bodybuilding',
        boxing: 'Boxing',
        kickboxing: 'Kickboxing',
        kungfu: 'Kung Fu',
        swimming: 'Swimming'
    };

    const trainingOptions = [
        {
            value: 'fitness',
            icon: '🔥',
            title: 'Fitness & Weight Loss',
            description: 'Lose weight & improve health with cardio + full-body circuits'
        },
        {
            value: 'bodybuilding',
            icon: '💪',
            title: 'Bodybuilding',
            description: 'Build muscle mass with hypertrophy splits & progressive overload'
        },
        {
            value: 'boxing',
            icon: '🥊',
            title: 'Boxing',
            description: 'Train like a boxer — heavy bag, speed bag, footwork & conditioning'
        },
        {
            value: 'kickboxing',
            icon: '🦵',
            title: 'Kickboxing',
            description: 'Combine punches & kicks with pads, heavy bag & leg power work'
        },
        {
            value: 'kungfu',
            icon: '🐉',
            title: 'Kung Fu',
            description: 'Traditional martial arts — stances, forms, strikes & discipline'
        },
        {
            value: 'swimming',
            icon: '🏊',
            title: 'Swimming',
            description: 'Sport-specific swim training — sprints, kicks & technique work'
        }
    ];

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Delete account confirmation modal state
    let showDeleteModal = $state(false);
    let deleteForm = $state<HTMLFormElement | null>(null);

    function openDeleteModal(): void {
        showDeleteModal = true;
    }

    function closeDeleteModal(): void {
        showDeleteModal = false;
    }

    function submitDeleteAccount(): void {
        deleteForm?.requestSubmit();
    }
</script>

<svelte:head>
	<title>Profile — Gymventory</title>
</svelte:head>

<svelte:window onkeydown={(e) => e.key === 'Escape' && showDeleteModal && closeDeleteModal()} />

<div class="max-w-4xl mx-auto p-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Your Profile</h1>
		<p class="text-sm text-gray-600 mt-1">
			Logged in as <span class="font-semibold">{data.user.username}</span> ·
			Age: <span class="font-semibold">{data.user.age}</span> ·
			{#if data.trainingType}
				Goal: <span class="font-semibold text-blue-600">{trainingTypeLabels[data.user.training_type] ?? data.user.training_type}</span>
			{/if}
		</p>
	</div>

	{#if form?.success}
		<div class="mb-6 p-4 bg-green-100 text-green-800 rounded-md font-medium border border-green-200">
			{form.message ?? 'Measurement saved successfully! Your progress has been updated.'}
		</div>
	{/if}

	{#if form?.error}
		<div class="mb-6 p-4 bg-red-100 text-red-700 rounded-md font-medium border border-red-200">
			{form.error}
		</div>
	{/if}

	<!-- Current Stats -->
	{#if latest}
		<div class="grid grid-cols-2 gap-4 mb-8 {isFitness ? 'md:grid-cols-5' : 'md:grid-cols-4'}">
			<div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
				<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Weight</div>
				<div class="text-2xl font-bold text-gray-900 mt-1">{latest.weight_kg.toFixed(1)} kg</div>
				<div class="text-xs text-gray-500 mt-0.5">Measured {formatDate(latest.measured_at)}</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
				<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">BMI</div>
				<div class="text-2xl font-bold text-gray-900 mt-1">{latest.bmi.toFixed(1)}</div>
				<div class="text-xs text-blue-600 font-medium mt-0.5">{latest.bmi_category}</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
				<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Body Fat</div>
				<div class="text-2xl font-bold text-gray-900 mt-1">
					{latest.body_fat_percent !== null ? latest.body_fat_percent.toFixed(1) + '%' : '—'}
				</div>
				<div class="text-xs text-gray-500 mt-0.5">
					Navy method ({data.user.gender === 'male' ? 'waist + neck' : 'waist + hip + neck'})
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
				<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Height</div>
				<div class="text-2xl font-bold text-gray-900 mt-1">{latest.height_cm.toFixed(1)} cm</div>
				<div class="text-xs text-gray-500 mt-0.5">Waist {latest.waist_cm.toFixed(1)} cm</div>
			</div>

			{#if isFitness && data.perfectWeight}
				<div class="bg-white border border-green-200 rounded-lg p-5 shadow-sm">
					<div class="text-xs font-semibold text-green-600 uppercase tracking-wide">Perfect Weight</div>
					<div class="text-2xl font-bold text-green-700 mt-1">{perfectWeightKg!.toFixed(1)} kg</div>
					<div class="text-xs text-gray-500 mt-0.5">
						{#if data.perfectWeight.customKg !== null}
							Your target
						{:else}
							Suggested · Healthy {data.perfectWeight.minKg.toFixed(1)}–{data.perfectWeight.maxKg.toFixed(1)} kg
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="bg-blue-50 border border-blue-200 rounded-xl p-10 text-center mb-8">
			<div class="text-5xl mb-4">📏</div>
			<h2 class="text-xl font-bold text-gray-900 mb-2">No measurements yet</h2>
			<p class="text-gray-600 max-w-md mx-auto">
				Add your first measurement below to start tracking your progress.
			</p>
		</div>
	{/if}

	<!-- Add New Measurement -->
	<div class="bg-white border border-gray-200 rounded-xl p-6 mb-10">
		<h2 class="text-lg font-bold text-gray-900 mb-4">Add New Measurement</h2>

		{#if metrics}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
				<div class="flex gap-6 justify-center">
					<div class="text-center">
						<div class="text-xs font-semibold text-blue-600 uppercase tracking-wide">BMI</div>
						<div class="text-2xl font-bold text-gray-900">{metrics.bmi.toFixed(1)}</div>
						<div class="text-xs text-blue-600 font-medium">{metrics.bmiCategory}</div>
					</div>
					<div class="text-center">
						<div class="text-xs font-semibold text-blue-600 uppercase tracking-wide">Body Fat</div>
						<div class="text-2xl font-bold text-gray-900">
							{metrics.bodyFatPercent !== null ? metrics.bodyFatPercent.toFixed(1) + '%' : '—'}
						</div>
						<div class="text-xs text-blue-600 font-medium">
							{metrics.bodyFatCategory ?? 'Enter all values'}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<form method="POST" action="?/addMeasurement" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
			<div>
				<label for="weightKg" class="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
				<input
					type="number"
					id="weightKg"
					name="weightKg"
					required
					min="25"
					max="350"
					step="0.1"
					bind:value={weightKg}
					placeholder={latest ? latest.weight_kg.toFixed(1) : 'e.g. 75'}
					class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="heightCm" class="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
				<input
					type="number"
					id="heightCm"
					name="heightCm"
					required
					min="100"
					max="250"
					step="0.1"
					bind:value={heightCm}
					placeholder={latest ? latest.height_cm.toFixed(1) : 'e.g. 175'}
					class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="neckCm" class="block text-sm font-medium text-gray-700 mb-1">Neck (cm)</label>
				<input
					type="number"
					id="neckCm"
					name="neckCm"
					required
					min="20"
					max="60"
					step="0.1"
					bind:value={neckCm}
					placeholder={latest ? latest.neck_cm.toFixed(1) : 'e.g. 38'}
					class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="waistCm" class="block text-sm font-medium text-gray-700 mb-1">Waist / Belly (cm)</label>
				<input
					type="number"
					id="waistCm"
					name="waistCm"
					required
					min="40"
					max="200"
					step="0.1"
					bind:value={waistCm}
					placeholder={latest ? latest.waist_cm.toFixed(1) : 'e.g. 85'}
					class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			{#if isFemale}
				<div>
					<label for="hipCm" class="block text-sm font-medium text-gray-700 mb-1">
						Hip (cm) <span class="text-pink-600">*</span>
					</label>
					<input
						type="number"
						id="hipCm"
						name="hipCm"
						required
						min="50"
						max="220"
						step="0.1"
						bind:value={hipCm}
						placeholder={latest?.hip_cm ? latest.hip_cm.toFixed(1) : 'e.g. 100'}
						class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:outline-none"
					/>
				</div>
			{/if}

			<div class="flex items-end">
				<button
					type="submit"
					class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors cursor-pointer"
				>
					Save Measurement
				</button>
			</div>
		</form>
	</div>

	<!-- Perfect Weight (Fitness / Weight Loss only) -->
	{#if isFitness}
		<div class="bg-white border border-gray-200 rounded-xl p-6 mb-10">
			<h2 class="text-lg font-bold text-gray-900 mb-1">Perfect Weight</h2>
			<p class="text-sm text-gray-600 mb-4">
				Your suggested perfect weight is calculated from your height to keep you in a healthy BMI range.
				You can set your own target weight instead.
			</p>

			{#if data.perfectWeight}
				<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
					<div class="flex items-center justify-between flex-wrap gap-2">
						<div>
							<div class="text-xs font-semibold text-green-700 uppercase tracking-wide">Current Target</div>
							<div class="text-xl font-bold text-green-800">
								{perfectWeightKg!.toFixed(1)} kg
								{#if data.perfectWeight.customKg === null}
									<span class="text-xs font-medium text-green-600">(suggested)</span>
								{/if}
							</div>
						</div>
						<div class="text-right">
							<div class="text-xs font-semibold text-green-700 uppercase tracking-wide">Healthy Range</div>
							<div class="text-sm font-medium text-green-800">
								{data.perfectWeight.minKg.toFixed(1)} – {data.perfectWeight.maxKg.toFixed(1)} kg
							</div>
						</div>
					</div>

					{#if latest}
						<div class="mt-3">
							<div class="flex justify-between text-xs text-green-700 mb-1">
								<span>Current: {latest.weight_kg.toFixed(1)} kg</span>
								<span>
									{#if latest.weight_kg > perfectWeightKg!}
										{Math.round((latest.weight_kg - perfectWeightKg!) * 10) / 10} kg to go
									{:else}
										Target reached! 🎉
									{/if}
								</span>
							</div>
							<div class="w-full bg-green-200 rounded-full h-2">
								<div
									class="bg-green-600 h-2 rounded-full transition-all"
									style="width: {perfectWeightProgress}%"
								></div>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
					Add your first measurement to get a suggested perfect weight based on your height.
					You can still set a custom target below.
				</div>
			{/if}

			<form method="POST" action="?/updateTargetWeight" class="flex items-end gap-4 flex-wrap">
				<div class="flex-1 min-w-[200px] max-w-xs">
					<label for="targetWeight" class="block text-sm font-medium text-gray-700 mb-1">Target Weight (kg)</label>
					<input
						type="number"
						id="targetWeight"
						name="targetWeight"
						min="25"
						max="350"
						step="0.1"
						bind:value={targetWeightInput}
						placeholder={data.perfectWeight ? data.perfectWeight.suggestedKg.toFixed(1) : 'e.g. 70'}
						class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
					/>
					<p class="text-xs text-gray-500 mt-1">Leave empty to use the suggested weight.</p>
				</div>
				<button
					type="submit"
					class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors cursor-pointer"
				>
					Save Target
				</button>
			</form>
		</div>
	{/if}

	<!-- Update Birth Date -->
	<div class="bg-white border border-gray-200 rounded-xl p-6 mb-10">
		<h2 class="text-lg font-bold text-gray-900 mb-1">Birth Date</h2>
		<p class="text-sm text-gray-600 mb-4">
			Your age is calculated automatically from your birth date, so it always stays up to date.
			It's used for age-adjusted BMI categories and safer exercise recommendations.
		</p>

		<form method="POST" action="?/updateBirthDate" class="flex items-end gap-4">
			<div class="flex-1 max-w-xs">
				<label for="birthDate" class="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
				<DatePicker bind:value={birthDateInput} name="birthDate" />
				<p class="text-xs text-gray-500 mt-1">
					Current age: <span class="font-semibold">{data.user.age}</span> years · Click the calendar button 📅 to pick your birth date.
				</p>
			</div>
			<button
				type="submit"
				class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors cursor-pointer"
			>
				Save Birth Date
			</button>
		</form>
	</div>

	<!-- Change Training Goal -->
	<div class="bg-white border border-gray-200 rounded-xl p-6 mb-10">
		<h2 class="text-lg font-bold text-gray-900 mb-1">Training Goal</h2>
		<p class="text-sm text-gray-600 mb-4">
			Choose the goal that fits what you're currently training for. This updates your workout recommendations.
		</p>

		<form method="POST" action="?/updateGoal">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each trainingOptions as option (option.value)}
					<label
						class="flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-colors {data.user.training_type === option.value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}"
					>
						<input
							type="radio"
							name="trainingType"
							value={option.value}
							checked={data.user.training_type === option.value}
							class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
						/>
						<div>
							<div class="font-semibold text-gray-900">
								<span class="mr-1.5">{option.icon}</span>
								{option.title}
							</div>
							<div class="text-xs text-gray-500 mt-0.5 leading-relaxed">{option.description}</div>
						</div>
					</label>
				{/each}
			</div>

			<div class="mt-5 flex justify-end">
				<button
					type="submit"
					class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors cursor-pointer"
				>
					Save Goal
				</button>
			</div>
		</form>
	</div>

	<!-- Measurement History -->
	{#if data.measurements.length > 0}
		<div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-bold text-gray-900">Measurement History</h2>
				<p class="text-xs text-gray-500 mt-0.5">
					{data.measurements.length} {data.measurements.length === 1 ? 'entry' : 'entries'} · Newest first
				</p>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
							<th class="px-6 py-3">Date</th>
							<th class="px-6 py-3">Weight (kg)</th>
							<th class="px-6 py-3">BMI</th>
							<th class="px-6 py-3">Body Fat %</th>
							<th class="px-6 py-3">Waist (cm)</th>
							{#if isFemale}
								<th class="px-6 py-3">Hip (cm)</th>
							{/if}
						</tr>
					</thead>
					<tbody>
						{#each data.measurements as m (m.id)}
							<tr class="border-t border-gray-100 hover:bg-gray-50 transition-colors">
								<td class="px-6 py-3 font-medium text-gray-900">{formatDate(m.measured_at)}</td>
								<td class="px-6 py-3">{m.weight_kg.toFixed(1)}</td>
								<td class="px-6 py-3">
									{m.bmi.toFixed(1)}
									<span class="text-xs text-gray-500">({m.bmi_category})</span>
								</td>
								<td class="px-6 py-3">
									{m.body_fat_percent !== null ? m.body_fat_percent.toFixed(1) : '—'}
								</td>
								<td class="px-6 py-3">{m.waist_cm.toFixed(1)}</td>
								{#if isFemale}
									<td class="px-6 py-3">{m.hip_cm !== null ? m.hip_cm.toFixed(1) : '—'}</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- Danger Zone: Delete Account -->
	<div class="bg-red-50 border border-red-200 rounded-xl p-6 mt-10">
		<h2 class="text-lg font-bold text-red-900 mb-1">Danger Zone</h2>
		<p class="text-sm text-red-700 mb-4">
			Deleting your account permanently removes your profile, all body measurements, and inventory data. This action cannot be undone.
		</p>

		<form method="POST" action="?/deleteAccount" bind:this={deleteForm}>
			<button
				type="button"
				onclick={openDeleteModal}
				class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors cursor-pointer"
			>
				Delete Account
			</button>
		</form>
	</div>
</div>

<!-- Delete Account Confirmation Modal -->
{#if showDeleteModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="deleteModalTitle"
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-black/50 backdrop-blur-sm"
			role="button"
			aria-label="Close confirmation dialog"
			tabindex="-1"
			onclick={closeDeleteModal}
			onkeydown={(e) => e.key === 'Enter' && closeDeleteModal()}
		></div>

		<!-- Modal card -->
		<div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
			<div class="text-4xl mb-3">⚠️</div>
			<h2 id="deleteModalTitle" class="text-xl font-bold text-gray-900 mb-2">Delete your account?</h2>
			<p class="text-sm text-gray-600 mb-6">
				This will permanently remove your profile, all body measurements, and inventory data. This action
				cannot be undone.
			</p>
			<div class="flex gap-3 justify-end">
				<button
					type="button"
					onclick={closeDeleteModal}
					class="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={submitDeleteAccount}
					class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors cursor-pointer"
				>
					Delete Account
				</button>
			</div>
		</div>
	</div>
{/if}
