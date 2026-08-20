<script lang="ts">
	interface Props {
		value?: string;
		name?: string;
		onchange?: (value: string) => void;
	}

	let { value = $bindable(''), name, onchange }: Props = $props();

	// Parse DD/MM/YYYY to { day, month, year } or null
	function parseDMY(dateStr: string): { day: number; month: number; year: number } | null {
		const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr.trim());
		if (!match) return null;
		const day = Number(match[1]);
		const month = Number(match[2]);
		const year = Number(match[3]);
		if (month < 1 || month > 12) return null;
		if (day < 1 || day > 31) return null;
		const date = new Date(year, month - 1, day);
		if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
			return null;
		}
		return { day, month, year };
	}

	// Format { day, month, year } to DD/MM/YYYY
	function formatDMY(day: number, month: number, year: number): string {
		return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
	}

	// Current selected date (parsed from value)
	const selected = $derived(parseDMY(value));

	// Calendar view state
	const today = new Date();
	let viewYear = $state(today.getFullYear());
	let viewMonth = $state(today.getMonth() + 1); // 1-12
	let isOpen = $state(false);

	let inputEl = $state<HTMLInputElement | null>(null);
	let popupEl = $state<HTMLDivElement | null>(null);

	// Days in the current view month
	const daysInMonth = $derived(new Date(viewYear, viewMonth, 0).getDate());
	// Day of week for the 1st of the month (0=Sunday)
	const firstDayOfWeek = $derived(new Date(viewYear, viewMonth - 1, 1).getDay());

	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

	// Build calendar grid (weeks × 7 days)
	const calendarDays = $derived.by(() => {
		const days: (number | null)[] = [];
		// Leading empty cells
		for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
		// Day cells
		for (let d = 1; d <= daysInMonth; d++) days.push(d);
		// Trailing empty cells to complete the last week
		while (days.length % 7 !== 0) days.push(null);
		return days;
	});

	function isToday(day: number): boolean {
		return day === today.getDate() && viewMonth === today.getMonth() + 1 && viewYear === today.getFullYear();
	}

	function isSelected(day: number): boolean {
		return selected !== null && day === selected.day && viewMonth === selected.month && viewYear === selected.year;
	}

	function isDisabled(day: number): boolean {
		const date = new Date(viewYear, viewMonth - 1, day);
		// Min: 1900-01-01
		if (date < new Date(1900, 0, 1)) return true;
		// Max: today
		if (date > new Date()) return true;
		return false;
	}

	function selectDay(day: number): void {
		const newValue = formatDMY(day, viewMonth, viewYear);
		value = newValue;
		onchange?.(newValue);
		isOpen = false;
	}

	function prevMonth(): void {
		if (viewMonth === 1) {
			viewMonth = 12;
			viewYear--;
		} else {
			viewMonth--;
		}
	}

	function nextMonth(): void {
		if (viewMonth === 12) {
			viewMonth = 1;
			viewYear++;
		} else {
			viewMonth++;
		}
	}

	function toggleCalendar(): void {
		// Reset view to selected date if available
		if (selected) {
			viewYear = selected.year;
			viewMonth = selected.month;
		}
		isOpen = !isOpen;
	}

	function handleInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		value = target.value;
		onchange?.(target.value);
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			isOpen = false;
		}
	}

	// Close when clicking outside
	$effect(() => {
		if (!isOpen) return;
		function handleClickOutside(e: MouseEvent) {
			if (inputEl && !inputEl.contains(e.target as Node) && popupEl && !popupEl.contains(e.target as Node)) {
				isOpen = false;
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});
</script>

<div class="relative">
	<div class="flex gap-2">
		<input
			type="text"
			bind:this={inputEl}
			value={value}
			name={name}
			oninput={handleInput}
			placeholder="DD/MM/YYYY"
			pattern={String.raw`\d{1,2}/\d{1,2}/\d{4}`}
			title="Please enter your birth date in DD/MM/YYYY format"
			class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
		/>
		<button
			type="button"
			onclick={toggleCalendar}
			title="Pick a date from the calendar"
			aria-label="Open calendar to pick birth date"
			aria-expanded={isOpen}
			class="shrink-0 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-colors cursor-pointer"
		>
			📅
		</button>
	</div>

	{#if isOpen}
		<div
			bind:this={popupEl}
			role="dialog"
			aria-label="Calendar"
			tabindex="-1"
			onkeydown={handleKeydown}
			class="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-72"
		>
			<!-- Month/Year header -->
			<div class="flex items-center justify-between mb-3">
				<button
					type="button"
					onclick={prevMonth}
					title="Previous month"
					aria-label="Previous month"
					class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
				>
					◀
				</button>
				<div class="font-semibold text-gray-900">
					{monthNames[viewMonth - 1]} {viewYear}
				</div>
				<button
					type="button"
					onclick={nextMonth}
					title="Next month"
					aria-label="Next month"
					class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
				>
					▶
				</button>
			</div>

			<!-- Day names -->
			<div class="grid grid-cols-7 gap-1 mb-1">
				{#each dayNames as dayName (dayName)}
					<div class="text-center text-xs font-semibold text-gray-500 py-1">{dayName}</div>
				{/each}
			</div>

			<!-- Calendar grid -->
			<div class="grid grid-cols-7 gap-1">
				{#each calendarDays as day, i (i)}
					{#if day === null}
						<div class="h-9"></div>
					{:else}
						<button
							type="button"
							onclick={() => selectDay(day!)}
							disabled={isDisabled(day)}
							class="h-9 w-9 mx-auto flex items-center justify-center rounded-md text-sm transition-colors cursor-pointer
								{isSelected(day)
									? 'bg-blue-600 text-white font-semibold'
									: isToday(day)
										? 'bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200'
										: 'text-gray-700 hover:bg-gray-100'}
								{isDisabled(day) ? 'opacity-40 cursor-not-allowed' : ''}"
						>
							{day}
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>