<script lang="ts">
	import { calculateBodyMetrics, type Gender } from '$lib/bodyMetrics';
	import { calculateAge, parseDMY } from '$lib/age';
	import DatePicker from '$lib/DatePicker.svelte';

	let { form }: { form: { error?: string } | null } = $props();

	let gender: Gender = $state('male');
	let birthDate = $state('');
	let trainingType = $state('fitness');

	// Measurement inputs as strings (for controlled inputs)
	let weightKg = $state('');
	let heightCm = $state('');
	let neckCm = $state('');
	let waistCm = $state('');
	let hipCm = $state('');

	const ageNum = $derived(birthDate ? (parseDMY(birthDate) ? calculateAge(parseDMY(birthDate)!) : 0) : 0);
	const weightNum = $derived(Number(weightKg));
	const heightNum = $derived(Number(heightCm));
	const neckNum = $derived(Number(neckCm));
	const waistNum = $derived(Number(waistCm));
	const hipNum = $derived(Number(hipCm));

	// Live BMI / body fat preview
	const metrics = $derived.by(() => {
		if (
			weightNum > 0 &&
			heightNum > 0 &&
			neckNum > 0 &&
			waistNum > 0 &&
			(gender === 'male' || hipNum > 0)
		) {
			return calculateBodyMetrics({
				gender,
				age: ageNum > 0 ? ageNum : null,
				weightKg: weightNum,
				heightCm: heightNum,
				neckCm: neckNum,
				waistCm: waistNum,
				hipCm: gender === 'female' ? hipNum : null
			});
		}
		return null;
	});

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

	function genderChanged(newGender: Gender) {
		gender = newGender;
	}
</script>

<div class="min-h-[80vh] flex items-center justify-center p-4">
	<div class="w-full max-w-xl bg-white border rounded-lg shadow-sm p-8">
		<h1 class="text-2xl font-bold text-gray-900 mb-2 text-center">Create an Account</h1>
		<p class="text-sm text-gray-600 mb-6 text-center">
			Set up your profile with your initial measurements and training goal.
		</p>

		{#if form?.error}
			<div class="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
				{form.error}
			</div>
		{/if}

		<form method="POST" class="space-y-6">
			<!-- Account Information -->
			<div class="space-y-4">
				<h2 class="text-sm font-bold text-gray-500 uppercase tracking-wide">Account</h2>
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
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
						Email Address
					</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						placeholder="you@example.com"
						class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
							Confirm Password
						</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							required
							class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<!-- Birth Date & Gender -->
			<div class="space-y-3">
				<h2 class="text-sm font-bold text-gray-500 uppercase tracking-wide">Birth Date & Gender</h2>

				<div>
					<label for="birthDate" class="block text-sm font-medium text-gray-700 mb-1">
						Birth Date
					</label>
					<DatePicker bind:value={birthDate} name="birthDate" />
					<p class="text-xs text-gray-500 mt-1">
						{#if birthDate}
							You will be <span class="font-semibold">{ageNum}</span> years old. Your age is
							calculated automatically from your birth date.
						{:else}
							Click the calendar button 📅 to pick your birth date from the calendar.
						{/if}
					</p>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<label
						class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors {gender === 'male' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}"
					>
						<input
							type="radio"
							name="gender"
							value="male"
							checked={gender === 'male'}
							class="w-5 h-5 text-blue-600 focus:ring-blue-500"
							onchange={() => genderChanged('male')}
						/>
						<div>
							<div class="font-semibold text-gray-900">Male</div>
							<div class="text-xs text-gray-500">Uses waist & neck measurements</div>
						</div>
					</label>

					<label
						class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors {gender === 'female' ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' : 'hover:bg-gray-50'}"
					>
						<input
							type="radio"
							name="gender"
							value="female"
							checked={gender === 'female'}
							class="w-5 h-5 text-pink-600 focus:ring-pink-500"
							onchange={() => genderChanged('female')}
						/>
						<div>
							<div class="font-semibold text-gray-900">Female</div>
							<div class="text-xs text-gray-500">Also needs hip measurement</div>
						</div>
					</label>
				</div>
			</div>

			<!-- Initial Measurements -->
			<div class="space-y-4">
				<h2 class="text-sm font-bold text-gray-500 uppercase tracking-wide">
					Initial Measurements
				</h2>

				{#if metrics}
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
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

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="weightKg" class="block text-sm font-medium text-gray-700 mb-1">
							Weight (kg)
						</label>
						<input
							type="number"
							id="weightKg"
							name="weightKg"
							required
							min="25"
							max="350"
							step="0.1"
							bind:value={weightKg}
							placeholder="e.g. 75"
							class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="heightCm" class="block text-sm font-medium text-gray-700 mb-1">
							Height (cm)
						</label>
						<input
							type="number"
							id="heightCm"
							name="heightCm"
							required
							min="100"
							max="250"
							step="0.1"
							bind:value={heightCm}
							placeholder="e.g. 175"
							class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="neckCm" class="block text-sm font-medium text-gray-700 mb-1">
							Neck (cm)
						</label>
						<input
							type="number"
							id="neckCm"
							name="neckCm"
							required
							min="20"
							max="60"
							step="0.1"
							bind:value={neckCm}
							placeholder="e.g. 38"
							class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="waistCm" class="block text-sm font-medium text-gray-700 mb-1">
							Waist / Belly (cm)
						</label>
						<input
							type="number"
							id="waistCm"
							name="waistCm"
							required
							min="40"
							max="200"
							step="0.1"
							bind:value={waistCm}
							placeholder="e.g. 85"
							class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					{#if gender === 'female'}
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
								placeholder="e.g. 100"
								class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:outline-none"
							/>
						</div>
					{/if}
				</div>

				<p class="text-xs text-gray-500">
					BMI and body fat % are calculated using the U.S. Navy method.
					{#if gender === 'male'}
						Males use weight, height, neck, and waist.
					{:else}
						Females use weight, height, neck, waist and hip.
					{/if}
				</p>
			</div>

			<!-- Training Goal -->
			<div class="space-y-3">
				<h2 class="text-sm font-bold text-gray-500 uppercase tracking-wide">Training Goal</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each Object.values(trainingOptions) as option (option.value)}
						<label
							class="flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-colors {trainingType === option.value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}"
						>
							<input
								type="radio"
								name="trainingType"
								value={option.value}
								checked={trainingType === option.value}
								class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
								onchange={() => (trainingType = option.value)}
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
			</div>

			<button
				type="submit"
				class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md transition-colors cursor-pointer"
			>
				Create Account
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-gray-600">
			Already have an account?
			<a href="/login" class="text-blue-600 hover:underline font-medium">Log in</a>
		</p>
	</div>
</div>